/**
 * sync-service.js — 域数据本地缓存与同步调度
 *
 * 需求：
 * - 登录（插件激活）、连接配置保存/切换、测试连接时同步数据
 * - 定期同步，周期可配置（5/10/30/60 分钟等）
 * - 本地留存数据，同步后更新缓存
 *
 * 缓存写入 store 的 JSON 集合：cache_users / cache_computers / cache_groups / cache_ous / cache_gpos / syncMeta
 */
import fs from 'node:fs'
import path from 'node:path'

const OK = (data) => ({ ok: true, data })
const FAIL = (code, message) => ({ ok: false, error: { code, message } })
const nowIso = () => new Date().toISOString()

// 缓存集合名
const CACHE_KEYS = {
  users: 'cache_users',
  computers: 'cache_computers',
  groups: 'cache_groups',
  ous: 'cache_ous',
  gpos: 'cache_gpos',
}
const SYNC_META = 'syncMeta'
const DEFAULT_INTERVAL_MIN = 10
const ALLOWED_INTERVALS = [0, 1, 5, 10, 15, 30, 60, 120] // 0=禁用自动同步

/**
 * createSyncService({ store, directory, dataDir, logger })
 * @returns 同步服务对象
 */
export function createSyncService({ store, directory, dataDir, logger } = {}) {
  if (!store || !directory) throw new Error('createSyncService 需要 store 与 directory')
  const log = logger || { info() {}, warn() {}, error() {} }
  const cacheDir = dataDir ? path.join(dataDir, 'cache') : null

  let timer = null
  let running = false
  let lastResult = null
  let syncWaiters = [] // 等待同步完成的回调

  function waitForSync(timeoutMs) {
    if (!running) return Promise.resolve(true)
    return new Promise((resolve) => {
      const timer = setTimeout(() => {
        syncWaiters = syncWaiters.filter(w => w !== done)
        resolve(false)
      }, timeoutMs)
      const done = () => { clearTimeout(timer); resolve(true) }
      syncWaiters.push(done)
    })
  }
  function notifyWaiters() {
    const list = syncWaiters.slice()
    syncWaiters = []
    list.forEach(fn => { try { fn() } catch (e) {} })
  }

  function readMeta() {
    const r = store.read(SYNC_META, null)
    return r && r.ok ? (r.data || {}) : {}
  }
  function writeMeta(meta) {
    return store.write(SYNC_META, { ...readMeta(), ...meta })
  }

  /** 返回缓存的状态摘要（供 UI 展示） */
  function status() {
    const meta = readMeta()
    const counts = {}
    for (const [kind, key] of Object.entries(CACHE_KEYS)) {
      const r = store.read(key, [])
      counts[kind] = r && r.ok && Array.isArray(r.data) ? r.data.length : 0
    }
    return OK({
      enabled: meta.enabled !== false,
      intervalMinutes: meta.intervalMinutes || DEFAULT_INTERVAL_MIN,
      lastSyncAt: meta.lastSyncAt || null,
      lastStatus: meta.lastStatus || null,
      lastError: meta.lastError || null,
      counts,
      running,
      nextSyncAt: meta.nextSyncAt || null,
    })
  }

  /** 设置同步周期（分钟）；0 表示关闭自动同步 */
  function setIntervalMinutes(minutes) {
    const m = Number(minutes)
    if (!ALLOWED_INTERVALS.includes(m)) return FAIL('INVALID_INTERVAL', `同步周期必须是以下值之一：${ALLOWED_INTERVALS.join(', ')} 分钟`)
    const enabled = m > 0
    const r = writeMeta({ intervalMinutes: m, enabled, nextSyncAt: enabled ? new Date(Date.now() + m * 60000).toISOString() : null })
    if (!r.ok) return r
    restartTimer()
    return OK({ intervalMinutes: m, enabled })
  }

  /** 从 LDAP 拉取全部对象并写入本地缓存 */
  async function syncNow(reason = 'manual') {
    if (running) {
      // 已有同步在进行：等待其完成后返回，避免手动同步被直接跳过
      const waited = await waitForSync(15000)
      if (waited) return OK({ ...(lastResult || {}), joined: true })
      return OK({ skipped: true, reason: 'sync-in-progress' })
    }
    running = true
    const started = nowIso()
    try {
      const pageSize = 1000
      const kinds = [
        ['users', 'listUsers'],
        ['computers', 'listComputers'],
        ['groups', 'listGroups'],
        ['ous', 'listOUs'],
        ['gpos', 'listGPOs'],
      ]
      const totals = {}
      const errors = {}
      for (const [kind, method] of kinds) {
        try {
          // 一次性拉全量（pageSize 上限 1000，通常足够；更大目录可在后续增强）
          // 单次查询加超时保护，避免某个调用永久挂起导致同步卡死
          const res = await Promise.race([
            directory[method]({ page: 1, pageSize }),
            new Promise((_, rej) => setTimeout(() => rej(new Error('同步查询超时')), 60000)),
          ])
          if (!res || !res.ok) {
            errors[kind] = (res && res.error && res.error.message) ? res.error.message : '查询失败'
            totals[kind] = 0
            continue
          }
          const items = res.data && Array.isArray(res.data.items) ? res.data.items : []
          const w = store.write(CACHE_KEYS[kind], items)
          if (!w.ok) errors[kind] = w.error ? w.error.message : '写入缓存失败'
          totals[kind] = res.data ? res.data.total : items.length
        } catch (e) {
          errors[kind] = e && e.message ? e.message : String(e)
          totals[kind] = 0
        }
      }
      const hasErrors = Object.keys(errors).length > 0
      const meta = {
        lastSyncAt: started,
        lastStatus: hasErrors ? 'partial' : 'success',
        lastError: hasErrors ? JSON.stringify(errors) : null,
        lastReason: reason,
        totals,
        nextSyncAt: (() => {
          const m = readMeta()
          return m.enabled && m.intervalMinutes ? new Date(Date.now() + m.intervalMinutes * 60000).toISOString() : null
        })(),
      }
      writeMeta(meta)
      lastResult = { ...meta, totals, errors }
      log.info(`[sync] 同步完成 reason=${reason} totals=${JSON.stringify(totals)}`)
      return OK(lastResult)
    } finally {
      running = false
      notifyWaiters()
    }
  }

  /** 读取缓存数据（供列表页优先展示本地数据） */
  function readCache(kind, q = {}) {
    const key = CACHE_KEYS[kind]
    if (!key) return FAIL('INVALID_KIND', `未知缓存类型：${kind}`)
    const r = store.read(key, [])
    if (!r.ok) return r
    let items = Array.isArray(r.data) ? r.data : []
    // 用户缓存的应用层保险：剔除可能混入的计算机对象。
    // 计算机账号特征：objectClass 含 computer、UAC 0x2000 位、sAMAccountName 以 $ 结尾。
    if (kind === 'users') {
      items = items.filter(row => {
        if (!row || typeof row !== 'object') return false
        const oc = Array.isArray(row.objectClass) ? row.objectClass : []
        const sam = String(row.sAMAccountName || row.username || row.name || '')
        const uac = Number(row.userAccountControl || 0)
        return !oc.some(c => /computer/i.test(String(c))) && !(uac & 0x2000) && !/\$$/.test(sam)
      })
    }
    // 启用/锁定等条件筛选（缓存数据同样支持）
    if (q.filters) {
      const f = q.filters
      if (f.enabled !== undefined && f.enabled !== '') {
        const want = f.enabled === true || f.enabled === 'true'
        items = items.filter(row => !!row.enabled === want)
      }
      if (f.locked !== undefined && f.locked !== '') {
        const want = f.locked === true || f.locked === 'true'
        items = items.filter(row => !!row.locked === want)
      }
    }
    // 关键词过滤
    if (q.keyword) {
      const kw = String(q.keyword).toLowerCase()
      items = items.filter(row => Object.values(row || {}).some(v => String(v).toLowerCase().includes(kw)))
    }
    // OU 过滤
    if (q.ouDn) items = items.filter(row => String(row.dn || '').toLowerCase().endsWith(String(q.ouDn).toLowerCase()))
    const total = items.length
    const page = Math.max(1, Number(q.page) || 1)
    const pageSize = Math.min(Math.max(1, Number(q.pageSize) || 20), 1000)
    return OK({ items: items.slice((page - 1) * pageSize, page * pageSize), total, page, pageSize, fromCache: true })
  }

  function restartTimer() {
    if (timer) { clearInterval(timer); timer = null }
    const meta = readMeta()
    const minutes = Number(meta.intervalMinutes) || DEFAULT_INTERVAL_MIN
    if (meta.enabled === false || minutes <= 0) return
    timer = setInterval(() => {
      syncNow('scheduled').catch(e => log.error(`[sync] 定时同步失败: ${e && e.message ? e.message : e}`))
    }, minutes * 60000)
    // 避免定时器阻止进程退出
    if (timer && typeof timer.unref === 'function') timer.unref()
  }

  /** 插件激活时启动调度；首次同步由调用方决定是否触发 */
  function start() {
    restartTimer()
    return OK({ started: true })
  }
  function stop() {
    if (timer) { clearInterval(timer); timer = null }
    return OK({ stopped: true })
  }

  return {
    status, setIntervalMinutes, syncNow, readCache, start, stop,
    get lastResult() { return lastResult },
  }
}

export default createSyncService
