/**
 * market-service.js — dsmarket 市场对接（契约：ARCHITECTURE.md 2.1 信封 / 2.4 市场模块）
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ENV = typeof process !== 'undefined' && process.env ? process.env : {};
const DEFAULT_API_BASE = 'https://dsmarket.example.com/api/v1';
const OPERATION_ACTIONS = new Set(['install', 'update', 'uninstall', 'license', 'rollback', 'setChannel']);

function packageRoot() {
  const here = path.dirname(fileURLToPath(import.meta.url));
  return path.resolve(here, '..');
}
function ok(data) { return { ok: true, data }; }
function fail(code, message) { return { ok: false, error: { code, message } }; }
function nowIso() { return new Date().toISOString(); }
function safeCall(fn, fallback) { try { return fn(); } catch { return fallback; } }

/** 当前插件包版本：优先注入 currentVersion，否则读 package.json */
function resolveCurrentVersion(config = {}) {
  if (config.currentVersion) return String(config.currentVersion);
  try {
    const pkg = JSON.parse(fs.readFileSync(path.join(packageRoot(), 'package.json'), 'utf8'));
    return String(pkg.version || '0.0.0');
  } catch {
    return '0.0.0';
  }
}

/** 语义化版本 major.minor.patch 比较：a>b 返回 1 / a<b 返回 -1 / 相等 0 */
export function compareVersion(a, b) {
  const parse = v => String(v || '0').replace(/^v/i, '').split(/[.+-]/).slice(0, 3).map(n => Number.parseInt(n, 10) || 0);
  const pa = parse(a), pb = parse(b);
  for (let i = 0; i < 3; i++) {
    if (pa[i] > pb[i]) return 1;
    if (pa[i] < pb[i]) return -1;
  }
  return 0;
}

/** 内置 mock 市场数据（无网络/测试环境使用） */
function mockMarket() {
  return {
    plugin: {
      id: 'dsmarket-dsh-ad-manage',
      name: 'AD/LDAP 域管理插件',
      publisher: 'DSH Market Contributor',
      summary: '可视化管理 AD/OpenLDAP 域连接与用户、计算机、组、OU、GPO 全生命周期，支持在线更新与灰度渠道。',
      description: '面向企业 IT 的域管理插件：多域配置、敏感信息加密存储、审计留痕、dsmarket 一键安装/更新/回滚。',
      icon: 'icon.svg',
      tags: ['AD', 'LDAP', '域管理', '运维'],
      currentVersion: '1.0.0',
      latestVersion: '1.2.0',
      channel: 'stable',
      licenseMode: 'free',
      available: true,
      commentsUrl: 'https://dsmarket.example.com/plugins/dsmarket-dsh-ad-manage/comments',
      homepage: 'https://dsmarket.example.com/plugins/dsmarket-dsh-ad-manage'
    },
    versions: [
      { version: '1.2.0', releasedAt: '2026-10-20T00:00:00Z', channel: 'gray', force: false, changelog: '新增 GPO 绑定与灰度渠道；优化分页性能。', compatibility: '>=1.0.0', breaking: false, size: 0 },
      { version: '1.1.0', releasedAt: '2026-09-10T00:00:00Z', channel: 'stable', force: false, changelog: '新增计算机与 OU 管理、全局检索。', compatibility: '>=1.0.0', breaking: false, size: 0 },
      { version: '1.0.0', releasedAt: '2026-08-01T00:00:00Z', channel: 'stable', force: false, changelog: '首个正式版：域配置、用户/组管理、审计日志、市场对接。', compatibility: '>=1.0.0', breaking: false, size: 0 }
    ],
    licenses: {
      free: { mode: 'free', status: 'active', available: true, reason: '免费授权' },
      paid: { mode: 'paid', status: 'inactive', available: false, reason: '需要企业授权（演示环境未购买）' },
      trial: { mode: 'trial', status: 'active', available: true, reason: '试用授权，剩余 14 天', expiresAt: '2026-12-07T00:00:00Z' }
    }
  }
}

/**
 * createMarketService({store, config, logger})
 * 所有公开方法返回 {ok,data,error} 信封。
 */
export function createMarketService(options = {}) {
  const store = options.store;
  const config = options.config || {};
  const logger = options.logger || { info() {}, warn() {}, error() {} };
  const apiBase = String(config.apiBase || ENV.MARKET_API_BASE || DEFAULT_API_BASE).replace(/\/$/, '');
  const mock = config.mock === true || ENV.MARKET_MOCK === '1' || ENV.NODE_ENV === 'test';
  const currentVersion = resolveCurrentVersion(config);
  const pluginId = config.pluginId || 'dsmarket-dsh-ad-manage';

  function getCollection(name, fallback) {
    if (!store || typeof store.read !== 'function') return ok(fallback);
    const r = store.read(name, fallback);
    if (r && typeof r === 'object' && 'ok' in r) return r;
    return ok(r === undefined || r === null ? fallback : r);
  }
  function setCollection(name, value) {
    if (!store || typeof store.write !== 'function') return ok(true);
    const r = store.write(name, value);
    if (r && typeof r === 'object' && 'ok' in r) return r;
    return ok(true);
  }
  function record(action, detail) {
    if (!store || typeof store.append !== 'function') return;
    store.append('operations', { action, time: nowIso(), version: currentVersion, detail: detail || {} });
  }
  function log(level, msg) { safeCall(() => logger[level] && logger[level](msg), undefined); }

  /** 远端请求：失败/无网络一律回退 mock 数据 */
  async function remote(pathname) {
    if (mock) return { data: mockMarket(), from: 'mock' };
    const url = `${apiBase}/${String(pathname).replace(/^\//, '')}`;
    try {
      const res = await fetch(url, { headers: { accept: 'application/json' }, signal: AbortSignal.timeout ? AbortSignal.timeout(5000) : undefined });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return { data: await res.json(), from: 'remote' };
    } catch (e) {
      log('warn', `市场请求失败，回退内置数据：${url}（${e.message}）`);
      return { data: mockMarket(), from: 'mock' };
    }
  }

  function channelOf() {
    const r = getCollection('channel', 'stable');
    const ch = r.ok ? r.data : 'stable';
    return ch === 'gray' ? 'gray' : 'stable';
  }
  function versionsOf(market) {
    return Array.isArray(market && market.versions) ? market.versions : (market && Array.isArray(market.plugin && market.plugin.versions) ? market.plugin.versions : []);
  }
  function findVersion(list, version) {
    return list.find(v => v.version === version) || null;
  }

  async function search(q = {}) {
    const { data: market, from } = await remote('plugins/search?q=' + encodeURIComponent(q.keyword || q.q || ''));
    const plugin = market.plugin || {};
    const keyword = String(q.keyword || q.q || '').trim().toLowerCase();
    const items = [plugin].filter(p => p && p.id).filter(p => !keyword || [p.name, p.summary, ...(p.tags || [])].join(' ').toLowerCase().includes(keyword));
    const page = Math.max(1, Number(q.page || 1));
    const pageSize = Math.max(1, Number(q.pageSize || 20));
    return ok({ items: items.slice((page - 1) * pageSize, page * pageSize), total: items.length, page, pageSize, source: from });
  }

  async function detail(id) {
    const { data: market, from } = await remote(`plugins/${encodeURIComponent(id || pluginId)}`);
    const plugin = market.plugin || {};
    if (id && plugin.id && id !== plugin.id && id !== 'dsmarket') {
      // mock 下只有一个插件，其他 id 返回未找到；真实接口会返回对应详情
      if (mock) return fail('MARKET_NOT_FOUND', `市场未找到插件：${id}`);
    }
    return ok({ ...plugin, source: from, commentsUrl: plugin.commentsUrl || plugin.comments_url || '' });
  }

  async function versions(id) {
    const { data: market, from } = await remote(`plugins/${encodeURIComponent(id || pluginId)}/versions`);
    const channel = channelOf();
    let list = versionsOf(market);
    if (channel === 'stable') list = list.filter(v => v.channel !== 'gray');
    list = [...list].sort((a, b) => compareVersion(b.version, a.version));
    return ok({ items: list, total: list.length, channel, source: from });
  }

  async function checkUpdate() {
    const { data: market, from } = await remote(`plugins/${encodeURIComponent(pluginId)}/versions`);
    const channel = channelOf();
    let list = versionsOf(market);
    if (channel === 'gray') {
      // 灰度渠道可见全部版本（含 gray）
      list = [...list];
    } else {
      list = list.filter(v => v.channel !== 'gray');
    }
    list.sort((a, b) => compareVersion(b.version, a.version));
    const latest = list[0] ? { ...list[0] } : null;
    const hasUpdate = latest ? compareVersion(latest.version, currentVersion) > 0 : false;
    const breaking = latest ? !!latest.breaking || compareVersion(latest.version.split('.')[0] + '.0.0', currentVersion) > 0 : false;
    const plugin = market.plugin || {};
    return ok({
      currentVersion,
      latestVersion: latest ? latest.version : currentVersion,
      hasUpdate,
      force: hasUpdate ? !!latest.force : false,           // 强制更新
      optional: hasUpdate ? !latest.force : true,           // 可选更新
      breakingChange: breaking,                              // 重大版本兼容风险
      compatibilityRisk: breaking ? '主版本升级可能存在兼容性风险，请先在测试环境验证。' : '',
      channel,
      available: plugin.available !== false,                 // 下架标记
      changelog: latest ? latest.changelog : '',
      source: from
    });
  }

  /** install(spec)：spec={id?,version?}；下架后禁止重新安装下载（但已安装实例功能不受影响） */
  async function install(spec = {}) {
    const version = spec.version || '';
    const { data: market, from } = await remote(`plugins/${encodeURIComponent(spec.id || pluginId)}`);
    const plugin = market.plugin || {};
    if (plugin.available === false || (plugin.license && plugin.license.available === false)) {
      return fail('MARKET_UNAVAILABLE', '该插件已在市场下架，禁止重新安装下载；已安装实例可继续使用');
    }
    const list = versionsOf(market);
    const target = version ? findVersion(list, version) : list[0];
    if (version && !target) return fail('VERSION_NOT_FOUND', `未找到版本：${version}`);
    const chosen = target ? target.version : (plugin.latestVersion || currentVersion);
    const installed = { id: plugin.id || pluginId, version: chosen, installedAt: nowIso(), channel: channelOf() };
    const r = setCollection('license', { ...installed, mode: plugin.licenseMode || 'free', available: plugin.available !== false });
    if (!r.ok) return r;
    record('install', installed);
    log('info', `安装插件 ${installed.id}@${chosen}`);
    return ok({ ...installed, source: from });
  }

  /** update(version)：更新前调用 store.backup() 备份插件与配置，失败 restore 回滚 */
  async function update(version) {
    const check = await checkUpdate();
    if (!check.ok) return check;
    if (check.data.available === false) return fail('MARKET_UNAVAILABLE', '插件已下架，禁止下载更新包；已安装版本可继续使用');
    if (version && compareVersion(version, currentVersion) <= 0) {
      return fail('VERSION_NOT_OLD', `目标版本 ${version} 不高于当前版本 ${currentVersion}`);
    }
    const targetVersion = version || check.data.latestVersion;
    if (check.data.hasUpdate === false && !version) return ok({ version: currentVersion, updated: false, message: '已是最新版本' });

    const backupResult = store && typeof store.backup === 'function' ? store.backup('pre-update') : null;
    const backupPath = backupResult && backupResult.ok ? backupResult.data.path : null;
    try {
      // 模拟下载/安装写入（真实实现为下载插件包覆盖本地文件，此处仅持久化版本与授权缓存）
      const r = setCollection('license', { version: targetVersion, updatedAt: nowIso(), channel: channelOf(), available: true });
      if (!r.ok) throw new Error(r.error ? r.error.message : '写入授权缓存失败');
      record('update', { from: currentVersion, to: targetVersion, backupPath });
      log('info', `更新成功 ${currentVersion} -> ${targetVersion}，备份：${backupPath || '无'}`);
      return ok({ from: currentVersion, to: targetVersion, backupPath, updated: true, breakingChange: check.data.breakingChange });
    } catch (e) {
      if (backupPath && store && typeof store.restore === 'function') {
        const rr = store.restore(backupPath);
        log('error', `更新失败已回滚：${e.message}；回滚结果=${rr && rr.ok ? '成功' : '失败'}`);
      }
      return fail('UPDATE_FAILED', `更新失败${backupPath ? '，已尝试回滚' : ''}：${e.message}`);
    }
  }

  /** rollback()：从最近一次备份恢复；未指定路径时自动选取最新备份 */
  async function rollback(backupPath) {
    if (!store || typeof store.restore !== 'function') return fail('STORE_UNAVAILABLE', '存储不可用，无法回滚');
    let targetPath = backupPath;
    if (!targetPath && store.dataDir) {
      const backupsDir = path.join(store.dataDir, 'backups');
      try {
        if (fs.existsSync(backupsDir)) {
          const dirs = fs.readdirSync(backupsDir)
            .map(name => ({ name, full: path.join(backupsDir, name), mtime: fs.statSync(path.join(backupsDir, name)).mtimeMs }))
            .filter(x => fs.existsSync(path.join(x.full, 'manifest.json')))
            .sort((a, b) => b.mtime - a.mtime);
          if (dirs.length) targetPath = dirs[0].full;
        }
      } catch { /* 无法列举备份时交由 restore 报错 */ }
    }
    const r = store.restore(targetPath);
    if (!r.ok) return r;
    record('rollback', r.data);
    return ok({ rolledBack: true, ...r.data });
  }

  async function setChannel(channel) {
    if (channel !== 'stable' && channel !== 'gray') return fail('CHANNEL_INVALID', '渠道仅支持 stable 或 gray');
    const r = setCollection('channel', channel);
    if (!r.ok) return r;
    record('setChannel', { channel });
    return ok({ channel });
  }

  /** getLicense()：授权状态从市场校验并缓存到 store；本地功能不受 available=false 影响 */
  async function getLicense() {
    const cached = getCollection('license', null);
    const { data: market, from } = await remote(`plugins/${encodeURIComponent(pluginId)}/license`);
    const plugin = market.plugin || {};
    const mode = (plugin.licenseMode || (market.licenses && Object.keys(market.licenses)[0] || 'free'));
    const remoteLicense = (market.licenses && market.licenses[mode]) || {};
    const result = {
      mode: ['free', 'paid', 'trial'].includes(mode) ? mode : 'free',
      status: remoteLicense.status || 'active',
      available: plugin.available !== false,           // 下架标记，仅禁安装下载
      reason: remoteLicense.reason || '',
      localUsable: true,                                // 下架后已安装继续可用
      cached: cached.ok ? cached.data : null,
      source: from
    };
    const r = setCollection('license', { ...result, checkedAt: nowIso() });
    if (!r.ok) return r;
    return ok(result);
  }

  function operations(q = {}) {
    const r = getCollection('operations', []);
    if (!r.ok) return r;
    let items = Array.isArray(r.data) ? r.data : [];
    if (q.action) items = items.filter(o => o.action === q.action);
    if (q.from) items = items.filter(o => o.time >= q.from);
    if (q.to) items = items.filter(o => o.time <= q.to);
    const page = Math.max(1, Number(q.page || 1));
    const pageSize = Math.max(1, Number(q.pageSize || 20));
    return ok({ items: items.slice((page - 1) * pageSize, page * pageSize), total: items.length, page, pageSize });
  }

  return {
    search, detail, versions, checkUpdate, install, update, rollback,
    setChannel, getLicense, operations,
    // 便捷只读属性
    currentVersion, apiBase, pluginId, mock
  };
}

export default createMarketService;
