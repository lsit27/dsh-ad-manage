/**
 * store.js — JSON 文件持久化（契约：ARCHITECTURE.md 2.1 信封 / 2.3 存储与安全）
 * 内置集合：configs / activeDomain / audit / operations / license / channel
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createCrypto, defaultDataDir as cryptoDefaultDataDir } from './crypto.js';

const COLLECTIONS = [
  'configs', 'activeDomain', 'audit', 'operations', 'license', 'channel',
  // 同步缓存集合
  'cache_users', 'cache_computers', 'cache_groups', 'cache_ous', 'cache_gpos', 'syncMeta',
];
const APPEND_ONLY = new Set(['audit']); // 审计日志仅追加
const SENSITIVE_FIELDS = ['bindPassword'];

function packageRoot() {
  const here = path.dirname(fileURLToPath(import.meta.url));
  return path.resolve(here, '..');
}
export function defaultDataDir() {
  return process.env.DSL_AD_DATA_DIR ? path.resolve(process.env.DSL_AD_DATA_DIR) : path.resolve(packageRoot(), '.data');
}

function ok(data) { return { ok: true, data }; }
function fail(code, message) { return { ok: false, error: { code, message } }; }
function nowIso() { return new Date().toISOString(); }
function clone(v) { return v === undefined ? undefined : JSON.parse(JSON.stringify(v)); }

/** 敏感字段只 seal 后落库；读时 unseal 还原，保证明文不落盘 */
function protectConfig(cfg, crypto) {
  const out = clone(cfg);
  for (const f of SENSITIVE_FIELDS) {
    if (out[f] !== undefined && out[f] !== null && out[f] !== '' && !crypto.isSealed(out[f])) {
      out[f] = crypto.seal(String(out[f]));
    }
  }
  return out;
}
function unprotectConfig(cfg, crypto) {
  if (!cfg || typeof cfg !== 'object') return cfg;
  const out = clone(cfg);
  for (const f of SENSITIVE_FIELDS) {
    if (crypto.isSealed(out[f])) {
      try { out[f] = crypto.unseal(out[f]); }
      catch (e) { out[f] = ''; }
    }
  }
  return out;
}

function normalizeDomain(cfg) {
  // 配置名称兼容多种来源：UI 表单用 label，历史数据用 name。
  // 之前只读 name 导致 UI 保存的 label 丢失、名称退化成 id。
  const displayName = String(cfg.name || cfg.label || cfg.configName || '').trim() || cfg.id;
  return {
    id: cfg.id,
    name: displayName,
    label: displayName,
    host: cfg.host || '',
    port: Number(cfg.port ?? 389),
    ssl: !!cfg.ssl,
    tls: !!cfg.tls,
    bindDN: cfg.bindDN || '',
    bindPassword: cfg.bindPassword ?? '',
    baseDN: cfg.baseDN || '',
    // 同一域的其它域控制器（备用地址），逗号/换行分隔；主地址失败时依次尝试
    failoverHosts: Array.isArray(cfg.failoverHosts) ? cfg.failoverHosts
      : String(cfg.failoverHosts || cfg.hosts || '').split(/[,;\n]/).map(s => s.trim()).filter(Boolean),
    timeout: Number(cfg.timeout ?? 10), // 单位：秒（UI 表单标注秒）
    pageSize: Math.min(1000, Number(cfg.pageSize ?? 100)),
    vendor: cfg.vendor || 'auto'
  };
}

/**
 * createStore({dataDir, crypto})
 * 所有 public 方法均返回 {ok,data,error} 信封（2.1）。
 */
export function createStore(options = {}) {
  const dataDir = options.dataDir ? path.resolve(options.dataDir) : defaultDataDir();
  const crypto = options.crypto || createCrypto({ dataDir: options.dataDir ? dataDir : cryptoDefaultDataDir() });
  const files = {};
  for (const name of COLLECTIONS) files[name] = path.join(dataDir, `${name}.json`);
  let ready = false;

  function rawRead(name) {
    const file = files[name];
    if (!file) return null;
    if (!fs.existsSync(file)) return null;
    try {
      const text = fs.readFileSync(file, 'utf8').trim();
      return text ? JSON.parse(text) : null;
    } catch {
      return null; // 损坏文件不致命，返回空
    }
  }
  function atomicWrite(file, value) {
    const tmp = `${file}.tmp`;
    fs.writeFileSync(tmp, JSON.stringify(value, null, 2), 'utf8');
    fs.renameSync(tmp, file);
  }

  function init() {
    try {
      fs.mkdirSync(dataDir, { recursive: true });
      for (const name of COLLECTIONS) {
        if (!fs.existsSync(files[name])) {
          const arraySeeds = ['configs', 'audit', 'operations', 'cache_users', 'cache_computers', 'cache_groups', 'cache_ous', 'cache_gpos'];
          const seed = arraySeeds.includes(name) ? [] : null;
          atomicWrite(files[name], seed);
        }
      }
      ready = true;
      return ok({ dataDir, collections: [...COLLECTIONS] });
    } catch (e) {
      return fail('STORE_INIT_FAILED', `存储初始化失败：${e.message}`);
    }
  }
  function ensure() { if (!ready) init(); }

  function read(name, defaultValue) {
    ensure();
    if (!files[name]) return fail('STORE_NAME_INVALID', `未知集合：${name}`);
    const v = rawRead(name);
    return ok(v === null ? clone(defaultValue) : v);
  }

  function write(name, data) {
    ensure();
    if (!files[name]) return fail('STORE_NAME_INVALID', `未知集合：${name}`);
    if (APPEND_ONLY.has(name)) return fail('STORE_APPEND_ONLY', 'audit 集合仅可追加，禁止覆盖写入');
    try {
      let out = data;
      if (name === 'configs') {
        if (Array.isArray(data)) out = data.map(c => protectConfig(c, crypto));
        else if (data && typeof data === 'object') out = protectConfig(data, crypto);
      }
      atomicWrite(files[name], out);
      return ok(true);
    } catch (e) {
      return fail('STORE_WRITE_FAILED', `写入失败：${e.message}`);
    }
  }

  /** append：audit/operations 仅追加；其他集合写入数组尾部 */
  function append(name, record) {
    ensure();
    if (!files[name]) return fail('STORE_NAME_INVALID', `未知集合：${name}`);
    try {
      const cur = rawRead(name);
      const list = Array.isArray(cur) ? cur : [];
      const entry = clone(record);
      if (name === 'audit') {
        entry.time = entry.time || nowIso();
        entry.id = entry.id || `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      }
      list.push(entry);
      atomicWrite(files[name], list);
      return ok(entry);
    } catch (e) {
      return fail('STORE_APPEND_FAILED', `追加失败：${e.message}`);
    }
  }

  /** backup(prefix)：全量备份数据目录的 JSON 集合，返回 {path, files, time} */
  function backup(prefix = 'backup') {
    ensure();
    try {
      const stamp = nowIso().replace(/[:.]/g, '-');
      const dir = path.join(dataDir, 'backups');
      fs.mkdirSync(dir, { recursive: true });
      const backupDir = path.join(dir, `${prefix}-${stamp}`);
      fs.mkdirSync(backupDir, { recursive: true });
      const copied = [];
      for (const name of COLLECTIONS) {
        const src = files[name];
        if (fs.existsSync(src)) {
          const dst = path.join(backupDir, path.basename(src));
          fs.copyFileSync(src, dst);
          copied.push(dst);
        }
      }
      // 密钥文件一并备份，否则备份恢复后无法解密历史密文
      const keyFile = crypto && crypto.keyPath ? crypto.keyPath : path.join(dataDir, '.key');
      if (fs.existsSync(keyFile)) fs.copyFileSync(keyFile, path.join(backupDir, '.key'));
      const manifest = { time: nowIso(), dataDir, collections: copied.map(f => path.basename(f)), prefix };
      atomicWrite(path.join(backupDir, 'manifest.json'), manifest);
      return ok({ path: backupDir, files: copied, time: manifest.time });
    } catch (e) {
      return fail('STORE_BACKUP_FAILED', `备份失败：${e.message}`);
    }
  }

  /** restore(path)：从 backup() 返回的目录恢复所有集合 */
  function restore(backupPath) {
    ensure();
    if (!backupPath) return fail('STORE_RESTORE_ARG', '缺少备份路径');
    try {
      const dir = path.resolve(backupPath);
      if (!fs.existsSync(dir)) return fail('STORE_RESTORE_NOT_FOUND', `备份不存在：${dir}`);
      const manifestFile = path.join(dir, 'manifest.json');
      const manifest = fs.existsSync(manifestFile) ? JSON.parse(fs.readFileSync(manifestFile, 'utf8')) : null;
      const names = manifest && Array.isArray(manifest.collections) ? manifest.collections : COLLECTIONS.map(n => `${n}.json`);
      for (const fname of names) {
        // 操作记录属于审计轨迹，回滚不应抹掉历史
        if (path.basename(fname) === 'operations.json') continue;
        const src = path.join(dir, path.basename(fname));
        if (fs.existsSync(src)) fs.copyFileSync(src, path.join(dataDir, path.basename(fname)));
      }
      const keyBackup = path.join(dir, '.key');
      if (fs.existsSync(keyBackup) && crypto && crypto.keyPath) fs.copyFileSync(keyBackup, crypto.keyPath);
      return ok({ restoredFrom: dir, files: names });
    } catch (e) {
      return fail('STORE_RESTORE_FAILED', `恢复失败：${e.message}`);
    }
  }

  function list() {
    ensure();
    const out = COLLECTIONS.map(name => {
      const v = rawRead(name);
      const file = files[name];
      let size = 0;
      try { size = fs.statSync(file).size; } catch { /* noop */ }
      return {
        name,
        file,
        size,
        type: Array.isArray(v) ? 'array' : (v && typeof v === 'object' ? 'object' : 'empty'),
        count: Array.isArray(v) ? v.length : (v ? 1 : 0)
      };
    });
    return ok(out);
  }

  // ---- domainConfig.*（2.1 信封；list/get/save/reset/delete/setActive）----
  function domainList() {
    const r = read('configs', []);
    if (!r.ok) return r;
    return ok((r.data || []).map(c => unprotectConfig(c, crypto)));
  }
  function domainGet(id) {
    const r = domainList();
    if (!r.ok) return r;
    const cfg = r.data.find(c => c.id === id);
    return cfg ? ok(cfg) : fail('DOMAIN_NOT_FOUND', `域配置不存在：${id}`);
  }
  function domainSave(cfg) {
    if (!cfg || !cfg.id) return fail('DOMAIN_ID_REQUIRED', '域配置缺少 id');
    const normalized = normalizeDomain(cfg);
    const r = domainList();
    if (!r.ok) return r;
    const list = r.data;
    const idx = list.findIndex(c => c.id === cfg.id);
    if (idx >= 0) list[idx] = normalized; else list.push(normalized);
    const w = write('configs', list);
    if (!w.ok) return w;
    const active = read('activeDomain', null);
    if (!active.ok) return active;
    if (!active.data || !list.some(c => c.id === active.data)) {
      const a = write('activeDomain', cfg.id);
      if (!a.ok) return a;
    }
    return ok(unprotectConfig(normalized, crypto));
  }
  function domainReset(id) {
    const r = domainGet(id);
    if (!r.ok) return r;
    const blank = normalizeDomain({ id, name: r.data.name });
    const l = domainList();
    const list = l.data.map(c => c.id === id ? blank : c);
    const w = write('configs', list);
    return w.ok ? ok(blank) : w;
  }
  function domainDelete(id) {
    const l = domainList();
    if (!l.ok) return l;
    const list = l.data.filter(c => c.id !== id);
    if (list.length === l.data.length) return fail('DOMAIN_NOT_FOUND', `域配置不存在：${id}`);
    const w = write('configs', list);
    if (!w.ok) return w;
    const active = read('activeDomain', null);
    if (active.ok && active.data === id) {
      const next = write('activeDomain', list.length ? list[0].id : null);
      if (!next.ok) return next;
    }
    return ok({ id, deleted: true });
  }
  function domainSetActive(id) {
    const r = domainGet(id);
    if (!r.ok) return r;
    const w = write('activeDomain', id);
    return w.ok ? ok(r.data) : w;
  }

  init();
  return {
    dataDir, init, read, write, append, backup, restore, list,
    domainConfig: { list: domainList, get: domainGet, save: domainSave, reset: domainReset, delete: domainDelete, setActive: domainSetActive }
  };
}

export default createStore;
