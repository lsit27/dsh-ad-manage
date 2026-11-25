/**
 * AD/LDAP 域管理插件 — Host 入口（装配层）
 * 只做模块装配、参数适配、RBAC 与命令注册；业务逻辑全部在 src/* 中。
 */
import { createStore } from './src/store.js'
import { createCrypto } from './src/crypto.js'
import { createRbac } from './src/rbac.js'
import { createLdapClient, normalizeConfig } from './src/ldap-client.js'
import { createDirectoryService } from './src/directory-service.js'
import { createMarketService } from './src/market-service.js'
import { createSyncService } from './src/sync-service.js'

const NS = 'domain-manager'

function ok(data) { return { ok: true, data } }
function fail(code, message) { return { ok: false, error: { code, message } } }

function wrap(fn) {
  return async (params = {}) => {
    try {
      const result = await fn(params || {})
      if (result && typeof result === 'object' && 'ok' in result) return result
      return ok(result)
    } catch (err) {
      if (err && err.code && err.message) return fail(err.code, err.message)
      return fail('INTERNAL_ERROR', err && err.message ? err.message : String(err))
    }
  }
}

/** 把 UI 域配置转换成 LDAP 客户端配置；不记任何敏感值到日志 */
function toLdapConfig(cfg = {}) {
  const scheme = cfg.ssl || cfg.port === 636 ? 'ldaps' : 'ldap'
  const host = cfg.host || '127.0.0.1'
  const port = cfg.port || (scheme === 'ldaps' ? 636 : 389)
  return {
    url: cfg.url || `${scheme}://${host}:${port}`,
    host, port,
    ssl: !!cfg.ssl,
    tls: !!cfg.tls,
    bindDN: cfg.bindDN || '',
    bindPassword: cfg.bindPassword || '',
    baseDN: cfg.baseDN || '',
    // 配置中的 timeout 单位为秒（UI 标注"秒"），ldapjs 需要毫秒。
    // 兼容旧数据：小于 1000 视为秒，大于等于 1000 视为已是毫秒。
    timeout: (() => {
      const t = Number(cfg.timeout) || 10
      return t < 1000 ? t * 1000 : t
    })(),
    pageSize: Number(cfg.pageSize) || 100,
    driver: process.env.LDAP_CLIENT_DRIVER || 'auto',
  }
}

export function apply(ctx, config = {}) {
  const crypto = createCrypto({ dataDir: process.env.DSL_AD_DATA_DIR })
  const store = createStore({ dataDir: process.env.DSL_AD_DATA_DIR, crypto })
  const rbac = createRbac()

  const auditor = {
    record(entry) {
      store.append('audit', {
        time: new Date().toISOString(),
        result: 'success',
        ...entry,
      })
    },
  }

  // ldap 是异步创建的，缓存「已连接客户端」以及正在创建的 Promise，避免并发重复建立连接。
  let ldap = null
  let ldapPromise = null
  async function ensureLdap() {
    if (ldap) return ldap
    if (!ldapPromise) {
      ldapPromise = (async () => {
        let cfg
        const activeR = store.domainConfig.list()
        if (activeR.ok && Array.isArray(activeR.data) && activeR.data.length) {
          const activeIdR = store.read('activeDomain', null)
          const activeId = activeIdR.ok ? activeIdR.data : null
          cfg = activeR.data.find(c => c.id === activeId) || activeR.data[0]
        }
        if (!cfg) {
          cfg = {
            host: '127.0.0.1', port: 389, ssl: false, tls: false,
            bindDN: process.env.LDAP_BIND_DN || '',
            bindPassword: process.env.LDAP_BIND_PASSWORD || '',
            baseDN: process.env.LDAP_BASE_DN || 'dc=example,dc=com',
            timeout: 5000, pageSize: 100,
          }
        }
        // 主地址 + 备用域控依次尝试，任一成功即返回
        const hosts = [cfg.host, ...(Array.isArray(cfg.failoverHosts) ? cfg.failoverHosts : [])].filter(Boolean)
        let lastErr = null
        for (const host of hosts) {
          try {
            const client = await createLdapClient(toLdapConfig({ ...cfg, host }))
            return client
          } catch (err) {
            lastErr = err
          }
        }
        throw lastErr || fail('CONN_REFUSED', '没有可用的域控制器')
      })().catch(err => { ldapPromise = null; throw err })
    }
    ldap = await ldapPromise
    return ldap
  }

  // 动态读取当前激活域的真实 baseDN（不能用示例值，否则 AD 返回 Referral/No Such Object）
  function currentBaseDN() {
    const r = store.domainConfig.list()
    if (r.ok && Array.isArray(r.data) && r.data.length) {
      const activeR = store.read('activeDomain', null)
      const activeId = activeR.ok ? activeR.data : null
      const cfg = r.data.find(c => c.id === activeId) || r.data[0]
      if (cfg && cfg.baseDN) return cfg.baseDN
    }
    return process.env.LDAP_BASE_DN || 'dc=example,dc=com'
  }

  const directory = createDirectoryService({
    ldap: { // 惰性代理：首次调用时确保已建立连接，并把调用转发给真实客户端
      cfg: {
        // 函数：directory-service 每次调用时动态读取激活域真实值
        baseDN: () => currentBaseDN(),
      },
      ...Object.fromEntries([
        'search', 'searchPaged', 'searchOne', 'add', 'modify', 'modifyAttributes', 'del',
        'rename', 'move', 'modifyPassword', 'changeState', 'unlock', 'addGroupMember',
        'removeGroupMember', 'listGroupMembers', 'listOU', 'createOU', 'renameOU',
        'moveOU', 'deleteOU', 'listOUObjects', 'listGPO', 'getGPO', 'toggleGPO',
        'bindGPO', 'unbindGPO', 'findByField', 'unbind',
      ].map(name => [name, async (...args) => (await ensureLdap())[name](...args)])),
    },
    store,
    auditor,
    rbac,
  })

  const market = createMarketService({
    store,
    config: {
      apiBase: process.env.MARKET_API_BASE || config.marketApiBase || '',
      mock: process.env.MARKET_MOCK === '1' || config.marketMock === true,
    },
    // 不读取 ctx.logger（Cordis 严格模式下未 inject 的服务访问会抛错）
    logger: { info() {}, warn() {}, error() {} },
  })

  // 数据同步服务：本地缓存 + 定时同步
  const sync = createSyncService({
    store,
    directory,
    dataDir: process.env.DSL_AD_DATA_DIR,
    logger: { info() {}, warn() {}, error() {} },
  })

  // 默认角色可通过插件 Config 配置（defaultRole），默认 admin 以便独立安装的插件开箱可用。
  // 生产环境可在 cordis.patch.yml 中设为 viewer/operator 实现权限隔离。
  const defaultRole = config.defaultRole || process.env.DSL_AD_DEFAULT_ROLE || 'admin'
  const roleOf = (params) => {
    const actor = params && params.actor
    return (actor && actor.role) || defaultRole
  }
  const guard = (action, params) => {
    try { rbac.assert(roleOf(params), action) } catch (err) { return fail(err.code || 'FORBIDDEN', err.message) }
    return null
  }

  // directory-service 的写方法签名为 (payload, actor) 或 (id, value, confirmToken, actor)，
  // 这里把 UI 的单一 params 对象解包成对应位置参数。
  const dir = {
    list: (p) => directory['list' + p.__kind](p),
    one: (name, p) => directory[name](p.id || p.dn, p.actor),
    create: (name, p) => directory[name](p, p.actor),
    update: (name, p) => directory[name](p, p.actor),
    toggle: (name, p) => directory[name](p.id, p.enabled, p.actor),
    move: (name, p) => directory[name](p.id, p.ouDn || p.ou || p.targetOU || p.parent, p.actor),
    del: (name, p) => directory[name](p.id, p.confirmToken, p.actor),
  }

  // 触发后台同步（不阻塞当前操作）。同步失败只记录，不影响主流程。
  function triggerSync(reason) {
    Promise.resolve().then(() => sync.syncNow(reason)).catch(() => {})
  }

  // 列表读取：默认用本地缓存（同步后更新），缓存为空或强制刷新时走实时查询。
  async function listWithCache(kind, p, method) {
    const cacheKey = { users: 'cache_users', computers: 'cache_computers', groups: 'cache_groups', ous: 'cache_ous', gpos: 'cache_gpos' }[kind]
    if (!p.useLive) {
      const cached = sync.readCache(kind, p)
      if (cached.ok && cached.data && cached.data.total > 0) {
        return cached
      }
    }
    // 实时查询并刷新缓存
    const live = await directory[method](p)
    if (live.ok && live.data && Array.isArray(live.data.items)) {
      store.write(cacheKey, live.data.items)
    }
    if (p.useLive && live.ok) triggerSync('manual-refresh')
    return live
  }

  const handlers = {
    // ---- 域连接配置 ----
    'domainConfig.list': wrap(async (p) => {
      const e = guard('config.read', p); if (e) return e
      const r = store.domainConfig.list()
      if (!r.ok) return r
      const activeR = store.read('activeDomain', null)
      const activeId = activeR.ok ? activeR.data : null
      // 返回时附带 active 标记，供前端正确显示当前选中配置
      const items = (r.data || []).map(c => ({ ...c, active: c.id === activeId }))
      return ok(items)
    }),
    'domainConfig.get': wrap(async (p) => { const e = guard('config.read', p); return e || store.domainConfig.get(p.id) }),
    'domainConfig.save': wrap(async (p) => {
      const e = guard('config.write', p); if (e) return e
      const incoming = p.config || p
      // 新建配置时前端 id 为空字符串，自动生成稳定的唯一 id
      const cfg = { ...incoming }
      if (!cfg.id || !String(cfg.id).trim()) {
        cfg.id = `domain-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
      }
      const r = store.domainConfig.save(cfg)
      if (r.ok) auditor.record({ actor: p.actor && p.actor.name, target: cfg.id, action: 'config.save', detail: { name: cfg.name } })
      ldap = null; ldapPromise = null // 配置变更后下次调用重连
      if (r.ok) triggerSync('config-save')
      return r
    }),
    'domainConfig.reset': wrap(async (p) => { const e = guard('config.write', p); return e || store.domainConfig.reset(p.id) }),
    'domainConfig.delete': wrap(async (p) => {
      const e = guard('config.write', p); if (e) return e
      if (p.confirmToken !== 'CONFIRMED') return fail('CONFIRM_REQUIRED', '删除域配置需要二次确认')
      const r = store.domainConfig.delete(p.id)
      if (r.ok) auditor.record({ actor: p.actor && p.actor.name, target: p.id, action: 'config.delete' })
      return r
    }),
    'domainConfig.test': wrap(async (p) => {
      const e = guard('config.read', p); if (e) return e
      try {
        const raw = p.config || p
        const hosts = [raw.host, ...(Array.isArray(raw.failoverHosts) ? raw.failoverHosts : [])].filter(Boolean)
        let client = null
        let connectedHost = raw.host
        let lastErr = null
        for (const host of hosts) {
          try {
            // 与列表加载使用同一驱动选择逻辑（auto 由 createLdapClient 决定回退）
            client = await createLdapClient(toLdapConfig({ ...raw, host }))
            connectedHost = host
            break
          } catch (err) { lastErr = err }
        }
        if (!client) throw lastErr || fail('CONN_REFUSED', '没有可用的域控制器')
        const driverUsed = client.driverUsed || 'ldapjs'
        if (client.unbind) await client.unbind()
        triggerSync('connection-test')
        return ok({
          connected: true,
          connectedHost,
          driverUsed,
          demoMode: driverUsed === 'mock',
          message: driverUsed === 'mock'
            ? '演示模式连接成功（未连接真实目录服务）'
            : `连接并绑定成功（${connectedHost}）`,
        })
      } catch (err) {
        return fail(err.code || 'CONN_REFUSED', err.message || '连接测试失败')
      }
    }),
    'domainConfig.setActive': wrap(async (p) => {
      const e = guard('config.write', p); if (e) return e
      const r = store.domainConfig.setActive(p.id)
      ldap = null; ldapPromise = null
      if (r.ok) triggerSync('domain-switch')
      return r
    }),

    // ---- 域对象（列表） ----
    // 默认优先读本地缓存（由登录/连接/测试/定时同步更新），缓存为空时实时查询。
    // 传 useLive=true 可强制实时查询（并同步刷新缓存）。
    'directory.listUsers': wrap((p) => listWithCache('users', p, 'listUsers')),
    'directory.listComputers': wrap((p) => listWithCache('computers', p, 'listComputers')),
    'directory.listGroups': wrap((p) => listWithCache('groups', p, 'listGroups')),
    'directory.listOUs': wrap((p) => listWithCache('ous', p, 'listOUs')),
    'directory.listGPOs': wrap((p) => listWithCache('gpos', p, 'listGPOs')),
    'directory.listGroupMembers': wrap((p) => directory.listGroupMembers(p.id || p.dn, p.actor)),
    'directory.listOUObjects': wrap((p) => directory.listOUObjects(p.id || p.dn || p.ouDn, p, p.actor)),
    'directory.search': wrap((p) => directory.search(p, p.actor)),

    // ---- 域对象（写操作） ----
    'directory.createUser': wrap((p) => directory.createUser(p, p.actor)),
    'directory.updateUser': wrap((p) => directory.updateUser(p, p.actor)),
    'directory.resetPassword': wrap((p) => directory.resetPassword(p.id, p.password, p.confirmToken, p.actor)),
    'directory.toggleUser': wrap((p) => directory.toggleUser(p.id, p.enabled, p.actor)),
    'directory.unlockUser': wrap((p) => directory.unlockUser(p.id, p.actor)),
    'directory.moveUser': wrap((p) => directory.moveUser(p.id, p.ouDn || p.ou || p.targetOU, p.actor)),
    'directory.deleteUser': wrap((p) => directory.deleteUser(p.id, p.confirmToken, p.actor)),
    'directory.getUserGroups': wrap((p) => directory.getUserGroups(p.id, p.actor)),

    'directory.createComputer': wrap((p) => directory.createComputer(p, p.actor)),
    'directory.updateComputer': wrap((p) => directory.updateComputer(p, p.actor)),
    'directory.moveComputer': wrap((p) => directory.moveComputer(p.id, p.ouDn || p.ou || p.targetOU, p.actor)),
    'directory.deleteComputer': wrap((p) => directory.deleteComputer(p.id, p.confirmToken, p.actor)),
    'directory.toggleComputer': wrap((p) => directory.toggleComputer(p.id, p.enabled, p.actor)),

    'directory.createGroup': wrap((p) => directory.createGroup(p, p.actor)),
    'directory.updateGroup': wrap((p) => directory.updateGroup(p, p.actor)),
    'directory.addGroupMembers': wrap((p) => directory.addGroupMembers(p.id, p.members, p.actor)),
    'directory.removeGroupMembers': wrap((p) => directory.removeGroupMembers(p.id, p.members, p.actor)),
    'directory.deleteGroup': wrap((p) => directory.deleteGroup(p.id, p.confirmToken, p.actor)),

    'directory.createOU': wrap((p) => directory.createOU(p, p.actor)),
    'directory.renameOU': wrap((p) => directory.renameOU(p.id, p.name || p.newName, p.actor)),
    'directory.moveOU': wrap((p) => directory.moveOU(p.id, p.parent || p.parentId || p.targetOU, p.actor)),
    'directory.deleteOU': wrap((p) => directory.deleteOU(p.id, p.confirmToken, p.actor)),

    'directory.getGPO': wrap((p) => directory.getGPO(p.id, p.actor)),
    'directory.toggleGPO': wrap((p) => directory.toggleGPO(p.id, p.enabled, p.actor)),
    'directory.bindGPO': wrap((p) => directory.bindGPO(p.id, p.ou || p.ouDn, p.actor)),
    'directory.unbindGPO': wrap((p) => directory.unbindGPO(p.id, p.ou || p.ouDn, p.actor)),

    // ---- 数据同步 ----
    'sync.status': wrap((p) => { const e = guard('config.read', p); return e || sync.status() }),
    'sync.now': wrap((p) => { const e = guard('config.write', p); return e || sync.syncNow('manual') }),
    'sync.setInterval': wrap((p) => { const e = guard('config.write', p); return e || sync.setIntervalMinutes(p.minutes) }),
    'sync.cache': wrap((p) => { const e = guard('object.read', p); return e || sync.readCache(p.kind, p) }),

    // ---- 审计 ----
    'audit.list': wrap(async (p) => {
      const e = guard('audit.read', p); if (e) return e
      const r = store.read('audit', [])
      if (!r.ok) return r
      const items = Array.isArray(r.data) ? r.data : []
      const page = Math.max(1, Number(p.page) || 1)
      const pageSize = Math.min(Math.max(1, Number(p.pageSize) || 20), 1000)
      return ok({ items: items.slice((page - 1) * pageSize, page * pageSize), total: items.length, page, pageSize })
    }),

    // ---- 市场 ----
    'market.search': wrap((p) => market.search(p)),
    'market.detail': wrap((p) => market.detail(p.id || p.keyword)),
    'market.versions': wrap((p) => market.versions(p.id)),
    'market.checkUpdate': wrap((p) => { const e = guard('market.read', p); return e || market.checkUpdate() }),
    'market.install': wrap((p) => { const e = guard('plugin.update', p); return e || market.install(p) }),
    'market.update': wrap((p) => {
      const e = guard('plugin.update', p); if (e) return e
      if (p.confirmToken !== 'CONFIRMED') return fail('CONFIRM_REQUIRED', '插件更新需要二次确认')
      return market.update(p.version)
    }),
    'market.rollback': wrap((p) => { const e = guard('plugin.update', p); return e || market.rollback(p.backupPath) }),
    'market.setChannel': wrap((p) => { const e = guard('plugin.update', p); return e || market.setChannel(p.channel) }),
    'market.getLicense': wrap((p) => market.getLicense()),
    'market.operations': wrap((p) => { const e = guard('market.read', p); return e || market.operations(p) }),

    // ---- 技能市场（随插件分发，可下载安装） ----
    'skills.list': wrap(async (p) => {
      const e = guard('market.read', p); if (e) return e
      try {
        const { readFileSync } = await import('node:fs')
        const { fileURLToPath } = await import('node:url')
        const pathMod = await import('node:path')
        const root = pathMod.dirname(fileURLToPath(import.meta.url))
        const catalog = JSON.parse(readFileSync(pathMod.join(root, 'skills', 'catalog.json'), 'utf8'))
        return ok(catalog)
      } catch (err) {
        return fail('SKILL_CATALOG_ERROR', err && err.message ? err.message : '读取技能目录失败')
      }
    }),
    'skills.get': wrap(async (p) => {
      const e = guard('market.read', p); if (e) return e
      try {
        const { readFileSync } = await import('node:fs')
        const { fileURLToPath } = await import('node:url')
        const pathMod = await import('node:path')
        const root = pathMod.dirname(fileURLToPath(import.meta.url))
        const rel = String(p.path || '').replace(/^[/\\]+/, '')
        // 防目录穿越
        if (rel.includes('..')) return fail('INVALID_PATH', '非法路径')
        const content = readFileSync(pathMod.join(root, rel), 'utf8')
        return ok({ path: rel, content })
      } catch (err) {
        return fail('SKILL_READ_ERROR', err && err.message ? err.message : '读取技能失败')
      }
    }),

    // ---- RBAC ----
    'rbac.can': wrap(async (p) => rbac.can(roleOf(p), p.action)),
  }

  const PREFIX = NS + '.'
  // 前端 slot 未必提供 actor；为未携带 actor 的请求注入默认角色，
  // 避免 directory-service 内部 guard 将无 actor 的请求一律当作 viewer。
  const defaultActor = { role: defaultRole, name: 'ui-user' }
  const execute = async (command, params = {}) => {
    let key = String(command || '')
    if (key.startsWith(PREFIX)) key = key.slice(PREFIX.length)
    const handler = handlers[key]
    if (!handler) return fail('UNKNOWN_COMMAND', `未知命令：${command}`)
    const supplied = params && typeof params === 'object' ? params.actor : null
    const actor = (supplied && typeof supplied === 'object' && supplied.role) ? supplied : defaultActor
    const enriched = (params && typeof params === 'object')
      ? { ...params, actor }
      : { actor }
    return handler(enriched)
  }

  // 注册同源 HTTP RPC route：Client 通过 fetch('/api/dm-rpc') 调用 Host 服务。
  // 这是 DSH 官方支持的插件 HTTP 扩展点（ctx.webServer.register）。
  ctx.effect(() => {
    const ws = ctx.webServer
    if (!ws || typeof ws.register !== 'function') return
    const json = (res, status, body) => {
      res.writeHead(status, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' })
      res.end(JSON.stringify(body))
    }
    const disposer = ws.register({
      kind: 'exact',
      path: '/api/dm-rpc',
      handler: async (req, res) => {
        if (req.method !== 'POST') return json(res, 405, { ok: false, error: { code: 'METHOD_NOT_ALLOWED', message: '请使用 POST' } })
        try {
          const chunks = []
          for await (const chunk of req) chunks.push(chunk)
          const body = JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}')
          const result = await execute(body.command, body.params || {})
          return json(res, 200, result)
        } catch (err) {
          return json(res, 200, { ok: false, error: { code: 'RPC_ERROR', message: err && err.message ? err.message : String(err) } })
        }
      },
    })
    return () => { if (typeof disposer === 'function') disposer() }
  })

  // 暴露全局桥（Client 回退通道）
  ctx.effect(() => {
    const bridge = { execute, namespace: NS }
    if (typeof globalThis !== 'undefined') globalThis.__DM_HOST_BRIDGE__ = bridge
    return () => {
      if (typeof globalThis !== 'undefined' && globalThis.__DM_HOST_BRIDGE__ === bridge) {
        delete globalThis.__DM_HOST_BRIDGE__
      }
    }
  })

  // Client 通过 HTTP RPC (/api/dm-rpc) 调用，不依赖 remote.commands。
  // 注意：Cordis 严格模式下未 inject 的服务（如 remote）访问会抛错，切勿读取。

  // 插件激活（用户登录/进入插件）：启动定时同步调度；已有域配置时立即触发一次后台同步。
  // 这就是"登录时同步"：每次用户登录并加载插件都会刷新本地缓存。
  sync.start()
  {
    const listR = store.domainConfig.list()
    if (listR.ok && Array.isArray(listR.data) && listR.data.length > 0) {
      triggerSync('login')
    }
  }

  ctx.effect(() => () => { sync.stop() })

  return { execute, handlers, __services: { store, rbac, directory, market, sync, ensureLdap } }
}

// webServer 提供同源 HTTP RPC 扩展点，供 Client UI 调用本插件的域服务。
export const inject = ['webServer']
