// src/ldap-client.js — LDAP 协议适配器（ARCHITECTURE.md 2.2）
// 依赖 ldapjs；无依赖时用 LDAP_CLIENT_DRIVER=mock 内存驱动跑通 UI 与流程。
import { createRequire } from 'node:module';
import { randomUUID } from 'node:crypto';

const require = createRequire(import.meta.url);

export const PAGED_RESULT_OID = '1.2.840.113556.1.4.319';
export const PAGE_SIZE_MAX = 1000;
// 部分 AD/LDAP 服务器对 ['*','+'] 通配符返回空属性集，显式列出常用属性更可靠。
export const DEFAULT_ATTRIBUTES = [
  'dn', 'cn', 'name', 'ou', 'displayName', 'description',
  'sAMAccountName', 'uid', 'userPrincipalName', 'mail', 'mobile', 'telephoneNumber',
  'memberOf', 'member', 'userAccountControl', 'lockoutTime', 'pwdLastSet',
  'dNSHostName', 'operatingSystem', 'operatingSystemVersion',
  'groupScope', 'groupType', 'managedBy', 'objectClass',
  'objectGuid', 'whenCreated', 'whenChanged', 'lastLogon',
  // 用户档案字段
  'givenName', 'sn', 'initials', 'title', 'department', 'company',
  'employeeID', 'employeeNumber', 'ipPhone', 'physicalDeliveryOfficeName', 'manager',
];

export const ERROR_MESSAGES = Object.freeze({
  CONN_REFUSED: '无法连接 LDAP 服务器：连接被拒绝，请检查地址与端口。',
  TIMEOUT: 'LDAP 操作超时，请检查网络或增加超时时间。',
  BIND_FAILED: '绑定 LDAP 失败：绑定 DN 或密码错误。',
  INSUFFICIENT_ACCESS: '权限不足：当前绑定账号无权执行该操作。',
  NO_SUCH_OBJECT: '对象不存在或 DN 路径有误。',
  PASSWORD_POLICY: '密码不符合域密码策略（长度、复杂度或历史限制）。',
  ENTRY_IN_USE: '条目已被占用或处于使用状态，操作无法完成。',
  SIZE_LIMIT: '超出服务器端条目数量限制。',
  PAGE_LIMIT: '分页参数超出上限（每页最多 1000 条）。',
  TLS_FAILED: 'TLS/SSL 握手失败，请检查证书与加密配置。',
  STRONG_AUTH_REQUIRED: '域服务器要求强认证（LDAPS 或 StartTLS），请启用 SSL/TLS 并使用加密端口（通常 636），或联系域管理员开放明文 LDAP。',
  CONFIRM_REQUIRED: '高危操作需要二次确认令牌（confirmToken=CONFIRMED）。',
  UNKNOWN: 'LDAP 操作失败。',
});

export class LdapError extends Error {
  constructor(code, detail, cause) {
    super(detail ? `${ERROR_MESSAGES[code] || ERROR_MESSAGES.UNKNOWN}（${detail}）` : (ERROR_MESSAGES[code] || ERROR_MESSAGES.UNKNOWN));
    this.name = 'LdapError';
    this.code = code;
    this.detail = detail;
    if (cause) this.cause = cause;
  }
}
export function ldapError(code, detail, cause) { return new LdapError(code, detail, cause); }

function normalizeConfig(cfg = {}) {
  const url = cfg.url || cfg.ldapUrl || 'ldap://127.0.0.1:389';
  let parsed;
  try { parsed = new URL(url); } catch { throw ldapError('CONN_REFUSED', `无效的 LDAP URL：${url}`); }
  const protocol = (parsed.protocol || '').replace(':', '').toLowerCase();
  if (!['ldap', 'ldaps'].includes(protocol)) throw ldapError('CONN_REFUSED', `不支持的 LDAP 协议：${protocol}`);
  const ssl = cfg.ssl === undefined ? protocol === 'ldaps' : !!cfg.ssl;
  const port = cfg.port !== undefined && cfg.port !== null && cfg.port !== '' ? Number(cfg.port)
    : (parsed.port ? Number(parsed.port) : (ssl ? 636 : 389));
  if (!Number.isInteger(port) || port <= 0 || port > 65535) throw ldapError('CONN_REFUSED', `无效的 LDAP 端口：${cfg.port}`);
  const baseDN = cfg.baseDN || cfg.baseDn || parsed.pathname.replace(/^\//, '') || '';
  const tls = cfg.tls === true || cfg.startTLS === true || cfg.starttls === true;
  const timeout = Number.isFinite(Number(cfg.timeout)) && Number(cfg.timeout) > 0 ? Number(cfg.timeout) : 5000;
  let pageSize = Number.isFinite(Number(cfg.pageSize)) && Number(cfg.pageSize) > 0 ? Number(cfg.pageSize) : 100;
  if (pageSize > PAGE_SIZE_MAX) throw ldapError('PAGE_LIMIT', `pageSize=${pageSize}`);
  return {
    url: `${protocol}://${parsed.hostname}:${port}`, protocol, host: parsed.hostname, port, ssl, tls,
    bindDN: cfg.bindDN || cfg.bindDn || '', bindPassword: cfg.bindPassword || cfg.password || '',
    baseDN, timeout, pageSize,
    driver: cfg.driver || (process.env.LDAP_CLIENT_DRIVER || '').toLowerCase() || 'ldapjs',
  };
}

/** 从 DN 提取根域组件：OU=惠州琥正,DC=futronics,DC=cn -> DC=futronics,DC=cn */
function rootDnOf(dn) {
  const parts = String(dn || '').split(',').map(s => s.trim()).filter(Boolean);
  const dc = parts.filter(p => /^DC=/i.test(p));
  return dc.length ? dc.join(',') : '';
}
function asArray(v) { return v === undefined || v === null ? [] : (Array.isArray(v) ? v : [v]); }
function first(v) { return Array.isArray(v) ? v[0] : v; }
function makeAttrs(initial = {}) {
  const store = new Map();
  for (const [k, v] of Object.entries(initial)) store.set(k.toLowerCase(), asArray(v).slice());
  return {
    keys() { return [...store.keys()]; },
    get(name) { return (store.get(String(name).toLowerCase()) || []).slice(); },
    first(name) { return first(this.get(name)); },
    set(name, value) { store.set(String(name).toLowerCase(), asArray(value).slice()); return this; },
    add(name, value) {
      const k = String(name).toLowerCase(); const list = store.get(k) || [];
      for (const v of asArray(value)) if (!list.some(x => String(x) === String(v))) list.push(v);
      store.set(k, list); return this;
    },
    remove(name, value) {
      const k = String(name).toLowerCase();
      const list = (store.get(k) || []).filter(x => String(x) !== String(value));
      if (list.length) store.set(k, list); else store.delete(k); return this;
    },
    del(name) { store.delete(String(name).toLowerCase()); return this; },
    plain() { return Object.fromEntries([...store.entries()].map(([k, v]) => [k, v.slice()])); },
  };
}
function isDnWithin(dn, base) {
  const a = String(dn || '').toLowerCase().replace(/\s+/g, '');
  const b = String(base || '').toLowerCase().replace(/\s+/g, '');
  return !b || a === b || a.endsWith(`,${b}`);
}
function parentDn(dn) { const i = String(dn || '').indexOf(','); return i < 0 ? '' : String(dn).slice(i + 1); }
function rdnOf(dn) { const i = String(dn || '').indexOf(','); return i < 0 ? String(dn || '') : String(dn).slice(0, i); }
function escapeFilter(v) { return String(v).replace(/[\\*()\u0000]/g, ch => '\\' + ch.charCodeAt(0).toString(16).padStart(2, '0')); }
function decodeFilterValue(raw) { return String(raw).replace(/\\([0-9a-fA-F]{2})/g, (_, hex) => String.fromCharCode(parseInt(hex, 16))); }

function parseFilter(input) {
  const s = String(input || '(objectClass=*)').trim();
  let pos = 0;
  const peek = () => s[pos];
  const eat = c => { if (s[pos] === c) { pos++; return true; } return false; };
  const ws = () => { while (/\s/.test(s[pos] || '')) pos++; };
  function item() {
    ws();
    if (!eat('(')) throw ldapError('UNKNOWN', `过滤器语法错误：${s}`);
    ws();
    let node;
    if (eat('&')) node = { op: 'and', items: [] };
    else if (eat('|')) node = { op: 'or', items: [] };
    else if (eat('!')) node = { op: 'not', item: null };
    else {
      const m = /^([^=~<>]+?)(>=|<=|~=|=)([^()]*)/.exec(s.slice(pos));
      if (!m) throw ldapError('UNKNOWN', `过滤器语法错误：${s}`);
      pos += m[0].length;
      const opMap = { '=': 'eq', '~=': 'approx', '>=': 'ge', '<=': 'le' };
      const raw = m[3];
      if (raw === '*') node = { op: 'present', attr: m[1].trim() };
      else if (raw.includes('*')) {
        const parts = raw.split('*');
        node = { op: 'substr', attr: m[1].trim(), initial: parts[0] || '', any: parts.slice(1, -1), final: parts[parts.length - 1] || '' };
      } else node = { op: opMap[m[2]], attr: m[1].trim(), value: decodeFilterValue(raw) };
    }
    if (node.op === 'and' || node.op === 'or') { ws(); while (peek() === '(') { node.items.push(item()); ws(); } }
    else if (node.op === 'not') { ws(); node.item = item(); ws(); }
    if (!eat(')')) throw ldapError('UNKNOWN', `过滤器缺少右括号：${s}`);
    return node;
  }
  const result = item(); ws(); return result;
}
function matchFilter(node, attrs) {
  if (!node) return true;
  switch (node.op) {
    case 'and': return node.items.every(x => matchFilter(x, attrs));
    case 'or': return node.items.some(x => matchFilter(x, attrs));
    case 'not': return !matchFilter(node.item, attrs);
    case 'present': return attrs.get(node.attr).length > 0;
    case 'eq': return attrs.get(node.attr).some(v => String(v).toLowerCase() === String(node.value).toLowerCase());
    case 'approx': return attrs.get(node.attr).some(v => String(v).toLowerCase().includes(String(node.value).toLowerCase()));
    case 'ge': return attrs.get(node.attr).some(v => String(v) >= String(node.value));
    case 'le': return attrs.get(node.attr).some(v => String(v) <= String(node.value));
    case 'substr': {
      const initial = node.initial.toLowerCase(), final = node.final.toLowerCase(), any = node.any.map(x => x.toLowerCase());
      return attrs.get(node.attr).some(raw => {
        let v = String(raw).toLowerCase();
        if (initial) { if (!v.startsWith(initial)) return false; v = v.slice(initial.length); }
        for (const part of any) { const i = v.indexOf(part); if (i < 0) return false; v = v.slice(i + part.length); }
        return !final || v.endsWith(final);
      });
    }
    default: return false;
  }
}

/* ===== mock 演示数据：3 用户 / 2 计算机 / 4 组 / 5 OU / 2 GPO ===== */
const OU_TREE = [
  { id: 'ou-root', name: '企业根目录', dn: 'dc=example,dc=com', parentId: null },
  { id: 'ou-hq', name: '总部', dn: 'ou=总部,dc=example,dc=com', parentId: 'ou-root' },
  { id: 'ou-it', name: '信息技术部', dn: 'ou=信息技术部,ou=总部,dc=example,dc=com', parentId: 'ou-hq' },
  { id: 'ou-fin', name: '财务部', dn: 'ou=财务部,ou=总部,dc=example,dc=com', parentId: 'ou-hq' },
  { id: 'ou-branch', name: '分支机构', dn: 'ou=分支机构,dc=example,dc=com', parentId: 'ou-root' },
];
const GPO_SEED = [
  { id: 'gpo-pwd', name: '全局密码策略', dn: 'cn={6B1F0C2A-1111-4A2B-9C3D-000000000001},cn=Policies,dc=example,dc=com', enabled: true, description: '强制密码长度与复杂度', linkedOUs: ['ou-hq', 'ou-branch'] },
  { id: 'gpo-usb', name: 'USB 设备管控', dn: 'cn={6B1F0C2A-2222-4A2B-9C3D-000000000002},cn=Policies,dc=example,dc=com', enabled: false, description: '禁用可移动存储', linkedOUs: ['ou-it'] },
];
const USER_SEED = [
  { id: 'u-zhangsan', cn: '张三', sam: 'zhangsan', upn: 'zhangsan@example.com', display: '张三', mail: 'zhangsan@example.com', mobile: '13800000001', ou: 'ou-it', enabled: true, locked: false, groups: ['g-admins', 'g-it'] },
  { id: 'u-lisi', cn: '李四', sam: 'lisi', upn: 'lisi@example.com', display: '李四', mail: 'lisi@example.com', mobile: '13800000002', ou: 'ou-fin', enabled: true, locked: true, groups: ['g-finance'] },
  { id: 'u-wangwu', cn: '王五', sam: 'wangwu', upn: 'wangwu@example.com', display: '王五', mail: 'wangwu@example.com', mobile: '13800000003', ou: 'ou-branch', enabled: false, locked: false, groups: ['g-users'] },
];
const COMPUTER_SEED = [
  { id: 'c-pc01', name: 'PC-01', dnshost: 'pc01.example.com', os: 'Windows 11 Pro', ou: 'ou-it', enabled: true },
  { id: 'c-srv01', name: 'SRV-01', dnshost: 'srv01.example.com', os: 'Windows Server 2022', ou: 'ou-hq', enabled: true },
];
const GROUP_SEED = [
  { id: 'g-admins', name: 'Domain Admins', sam: 'Domain Admins', dnGroup: 'cn=Domain Admins,dc=example,dc=com', scope: 'Global', desc: '域管理员组', members: ['u-zhangsan'] },
  { id: 'g-it', name: 'IT 团队', sam: 'ITTeam', dnGroup: 'cn=IT 团队,ou=信息技术部,ou=总部,dc=example,dc=com', scope: 'Global', desc: '信息技术部成员', members: ['u-zhangsan'] },
  { id: 'g-finance', name: '财务部', sam: 'Finance', dnGroup: 'cn=财务部,ou=财务部,ou=总部,dc=example,dc=com', scope: 'Global', desc: '财务成员', members: ['u-lisi'] },
  { id: 'g-users', name: 'Domain Users', sam: 'Domain Users', dnGroup: 'cn=Domain Users,dc=example,dc=com', scope: 'Global', desc: '所有普通用户', members: ['u-wangwu'] },
];
function initialMockData() {
  return {
    ous: OU_TREE.map(x => ({ ...x, children: [] })),
    users: USER_SEED.map(u => ({
      id: u.id, dn: `cn=${u.cn},${OU_TREE.find(o => o.id === u.ou).dn}`,
      attrs: makeAttrs({
        objectClass: ['top', 'person', 'organizationalPerson', 'user'],
        cn: u.cn, sn: u.cn.slice(0, 1), givenName: u.cn.slice(1) || u.cn,
        sAMAccountName: u.sam, userPrincipalName: u.upn, displayName: u.display,
        mail: u.mail, mobile: u.mobile, uid: u.sam,
        memberOf: u.groups.map(g => GROUP_SEED.find(x => x.id === g).dnGroup),
        userAccountControl: u.enabled ? 512 : 514,
        pwdLastSet: '133000000000000000', lockoutTime: u.locked ? '1' : '0',
        description: '演示用户',
      }),
    })),
    computers: COMPUTER_SEED.map(c => ({
      id: c.id, dn: `cn=${c.name},${OU_TREE.find(o => o.id === c.ou).dn}`,
      attrs: makeAttrs({
        objectClass: ['top', 'computer'], objectCategory: 'computer', cn: c.name, name: c.name,
        dNSHostName: c.dnshost, operatingSystem: c.os,
        userAccountControl: c.enabled ? 4096 : 4098,
      }),
    })),
    groups: GROUP_SEED.map(g => ({
      id: g.id, dn: g.dnGroup,
      attrs: makeAttrs({
        objectClass: ['top', 'group'], cn: g.name, name: g.name,
        sAMAccountName: g.sam, groupScope: g.scope, description: g.desc,
        member: g.members.map(uid => USER_SEED.find(u => u.id === uid)).filter(Boolean).map(u => `cn=${u.cn},${OU_TREE.find(o => o.id === u.ou).dn}`),
      }),
    })),
    gpos: GPO_SEED.map(g => ({ ...g, linkedOUs: [...g.linkedOUs] })),
    passwords: new Map(USER_SEED.map(u => [u.id, 'Demo@12345'])),
  };
}
function mockDnForOu(data, ouId) { const ou = data.ous.find(o => o.id === ouId) || data.ous.find(o => o.id === 'ou-root'); return ou ? ou.dn : 'dc=example,dc=com'; }
function mockAttrsOf(entry) { const out = { dn: entry.dn, id: entry.id }; for (const k of entry.attrs.keys()) out[k] = entry.attrs.get(k); return out; }
function mockEntryType(dn, attrs) {
  // 收集所有 objectClass 值（大小写不敏感），不能只看 first()，否则 top/person/user 会被误判为 other
  const oc = [...asArray(attrs.get('objectClass')), ...asArray(attrs.get('objectclass'))].map(String);
  if (oc.some(x => /user|person/i.test(x))) return 'user';
  if (oc.some(x => /computer/i.test(x))) return 'computer';
  if (oc.some(x => /group/i.test(x))) return 'group';
  if (oc.some(x => /organizationalunit/i.test(x))) return 'ou';
  return 'other';
}
function mockAllEntries(data) { return [...data.users, ...data.computers, ...data.groups]; }
export function createMemoryDirectory(seed) {
  const data = seed || initialMockData();
  return { data, initialMockData, mockDnForOu, mockAttrsOf, mockAllEntries, mockEntryType, makeAttrs, first, asArray };
}

/* ===== MockLdapClient ===== */
class MockLdapClient {
  constructor(cfg) { this.cfg = cfg; this.closed = false; this.bound = false; this.data = initialMockData(); }
  async connect() {
    if (this.closed) throw ldapError('CONN_REFUSED');
    if ((this.cfg.ssl || this.cfg.tls) && !this.cfg.bindDN) throw ldapError('TLS_FAILED', 'mock 驱动需要 bindDN 才能建立安全连接');
    this.bound = false; return this;
  }
  async bind(bindDN = this.cfg.bindDN, password = this.cfg.bindPassword) {
    if (this.closed) throw ldapError('CONN_REFUSED');
    if (!bindDN || !password) throw ldapError('BIND_FAILED', '缺少绑定 DN 或密码');
    this.readonly = String(bindDN).toLowerCase() === 'cn=readonly,dc=example,dc=com';
    this.bound = true; return this;
  }
  async unbind() { this.bound = false; this.closed = true; }
  _assertBound() { if (!this.bound) throw ldapError('BIND_FAILED', '尚未成功绑定'); }
  _assertWrite() { this._assertBound(); if (this.readonly) throw ldapError('INSUFFICIENT_ACCESS'); }
  _findByDn(dn) {
    const target = String(dn || '').toLowerCase();
    return mockAllEntries(this.data).find(e => e.dn.toLowerCase() === target)
      || this.data.ous.find(o => o.dn.toLowerCase() === target)
      || this.data.gpos.find(g => g.dn.toLowerCase() === target);
  }
  async search(base, options = {}) {
    this._assertBound();
    const scope = options.scope || 'sub';
    const filter = parseFilter(options.filter || '(objectClass=*)');
    const baseStr = String(base || this.cfg.baseDN || '');
    return mockAllEntries(this.data).filter(e => {
      if (!isDnWithin(e.dn, baseStr)) return false;
      if (scope === 'base' && e.dn.toLowerCase() !== baseStr.toLowerCase()) return false;
      if (scope === 'one' && parentDn(e.dn).toLowerCase() !== baseStr.toLowerCase()) return false;
      return matchFilter(filter, e.attrs);
    }).map(e => ({ dn: e.dn, dnRaw: e.dn, attributes: e.attrs.plain(), id: e.id }));
  }
  async searchPaged(base, options = {}) {
    const all = await this.search(base, options);
    const pageSize = Math.min(options.pageSize || this.cfg.pageSize || 100, PAGE_SIZE_MAX);
    const total = all.length;
    const pages = Math.max(1, Math.ceil(total / pageSize));
    const page = Math.max(1, Math.min(options.page || 1, pages));
    return { items: all.slice((page - 1) * pageSize, page * pageSize), total, page, pageSize, pages };
  }
  async searchOne(base, options = {}) { const rows = await this.search(base, { ...options, scope: 'base' }); return rows[0] || null; }
  async add(dn, attributes = {}) {
    this._assertWrite();
    const target = String(dn || '');
    if (this._findByDn(target)) throw ldapError('ENTRY_IN_USE', target);
    const attrs = makeAttrs(attributes);
    const type = mockEntryType(target, attrs);
    const id = `${type}-${randomUUID()}`;
    const entry = { id, dn: target, attrs };
    if (type === 'user') this.data.users.push(entry);
    else if (type === 'computer') this.data.computers.push(entry);
    else if (type === 'group') this.data.groups.push(entry);
    else this.data.ous.push({ id, name: first(attrs.get('ou')) || rdnOf(target), dn: target, parentId: null });
    return { dn: target, id };
  }
  async modify(dn, changes = []) {
    this._assertWrite();
    const entry = this._findByDn(dn);
    if (!entry) throw ldapError('NO_SUCH_OBJECT', String(dn));
    if (!entry.attrs) throw ldapError('INSUFFICIENT_ACCESS', 'OU/GPO 请使用专用接口修改');
    for (const ch of changes) {
      const op = String(ch.operation || ch.op || 'replace').toLowerCase();
      const name = ch.modification?.name || ch.name || ch.attribute;
      const values = ch.modification?.values ?? ch.values;
      if (!name) continue;
      if (op === 'add') entry.attrs.add(name, values);
      else if (op === 'delete' || op === 'remove') {
        if (values === undefined) entry.attrs.del(name);
        else for (const v of asArray(values)) entry.attrs.remove(name, v);
      } else entry.attrs.set(name, values);
    }
    return { dn: entry.dn };
  }
  async modifyAttributes(dn, patch = {}) {
    return this.modify(dn, Object.entries(patch).map(([name, values]) => ({ operation: 'replace', modification: { name, values: asArray(values) } })));
  }
  async del(dn) {
    this._assertWrite();
    const target = String(dn || '').toLowerCase();
    if (!this._findByDn(dn)) throw ldapError('NO_SUCH_OBJECT', String(dn));
    const all = mockAllEntries(this.data);
    const idx = all.findIndex(e => e.dn.toLowerCase() === target);
    if (idx >= 0) all.splice(idx, 1);
    else {
      const oi = this.data.ous.findIndex(o => o.dn.toLowerCase() === target);
      if (oi >= 0) this.data.ous.splice(oi, 1);
      else { const gi = this.data.gpos.findIndex(g => g.dn.toLowerCase() === target); if (gi >= 0) this.data.gpos.splice(gi, 1); }
    }
    return { dn: String(dn) };
  }
  async rename(dn, newRdn) {
    this._assertWrite();
    const entry = this._findByDn(dn);
    if (!entry) throw ldapError('NO_SUCH_OBJECT', String(dn));
    const newDn = `${newRdn},${parentDn(dn)}`;
    if (newDn.toLowerCase() !== String(dn).toLowerCase() && this._findByDn(newDn)) throw ldapError('ENTRY_IN_USE', newDn);
    entry.dn = newDn;
    if (entry.attrs) { const key = String(newRdn).split('=')[0]; entry.attrs.set(key, decodeFilterValue(String(newRdn).split('=').slice(1).join('='))); }
    return { dn: newDn };
  }
  async move(dn, newParentDn) {
    this._assertWrite();
    const entry = this._findByDn(dn);
    if (!entry) throw ldapError('NO_SUCH_OBJECT', String(dn));
    const newDn = `${rdnOf(dn)},${newParentDn}`;
    if (this._findByDn(newDn)) throw ldapError('ENTRY_IN_USE', newDn);
    entry.dn = newDn; return { dn: newDn };
  }
  async modifyPassword(dn, newPassword) {
    this._assertWrite();
    const entry = this._findByDn(dn);
    if (!entry) throw ldapError('NO_SUCH_OBJECT', String(dn));
    if (mockEntryType(entry.dn, entry.attrs || makeAttrs({})) !== 'user') throw ldapError('INSUFFICIENT_ACCESS', '只能重置用户密码');
    if (!newPassword || String(newPassword).length < 8) throw ldapError('PASSWORD_POLICY', '密码至少 8 位');
    this.data.passwords.set(entry.id, String(newPassword));
    entry.attrs.set('pwdLastSet', String(Date.now())); return { dn: entry.dn };
  }
  async changeState(dn, enabled) {
    this._assertWrite();
    const entry = this._findByDn(dn);
    if (!entry) throw ldapError('NO_SUCH_OBJECT', String(dn));
    const type = entry.attrs ? mockEntryType(entry.dn, entry.attrs) : 'other';
    entry.attrs.set('userAccountControl', String(type === 'computer' ? (enabled ? 4096 : 4098) : (enabled ? 512 : 514)));
    return { dn: entry.dn, enabled };
  }
  async unlock(dn) {
    this._assertWrite();
    const entry = this._findByDn(dn);
    if (!entry) throw ldapError('NO_SUCH_OBJECT', String(dn));
    entry.attrs.set('lockoutTime', '0'); return { dn: entry.dn };
  }
  async addGroupMember(groupDn, memberDn) {
    this._assertWrite();
    const group = this.data.groups.find(g => g.dn.toLowerCase() === String(groupDn).toLowerCase());
    if (!group) throw ldapError('NO_SUCH_OBJECT', String(groupDn));
    group.attrs.add('member', memberDn);
    const id = mockAllEntries(this.data).find(e => e.dn.toLowerCase() === String(memberDn).toLowerCase())?.id;
    const user = this.data.users.find(u => u.id === id);
    if (user) user.attrs.add('memberOf', group.dn);
    return { dn: group.dn, member: memberDn };
  }
  async removeGroupMember(groupDn, memberDn) {
    this._assertWrite();
    const group = this.data.groups.find(g => g.dn.toLowerCase() === String(groupDn).toLowerCase());
    if (!group) throw ldapError('NO_SUCH_OBJECT', String(groupDn));
    group.attrs.remove('member', memberDn);
    const id = mockAllEntries(this.data).find(e => e.dn.toLowerCase() === String(memberDn).toLowerCase())?.id;
    const user = this.data.users.find(u => u.id === id);
    if (user) user.attrs.remove('memberOf', group.dn);
    return { dn: group.dn, member: memberDn };
  }
  async listGroupMembers(groupDn) {
    this._assertBound();
    const group = this.data.groups.find(g => g.dn.toLowerCase() === String(groupDn).toLowerCase());
    if (!group) throw ldapError('NO_SUCH_OBJECT', String(groupDn));
    return group.attrs.get('member').map(dn => ({ dn, id: mockAllEntries(this.data).find(e => e.dn.toLowerCase() === String(dn).toLowerCase())?.id || null }));
  }
  async listOU() { this._assertBound(); return this.data.ous.map(o => ({ ...o })); }
  async createOU(name, parentId) {
    this._assertWrite();
    const parent = this.data.ous.find(o => o.id === parentId) || this.data.ous[0];
    if (!parent) throw ldapError('NO_SUCH_OBJECT', String(parentId));
    const id = `ou-${randomUUID()}`;
    const dn = `ou=${name},${parent.dn}`;
    if (this.data.ous.some(o => o.dn.toLowerCase() === dn.toLowerCase())) throw ldapError('ENTRY_IN_USE', dn);
    const ou = { id, name, dn, parentId: parent.id }; this.data.ous.push(ou); return ou;
  }
  async renameOU(id, name) {
    this._assertWrite();
    const ou = this.data.ous.find(o => o.id === id);
    if (!ou) throw ldapError('NO_SUCH_OBJECT', String(id));
    const oldDn = ou.dn; ou.name = name; ou.dn = `ou=${name},${parentDn(oldDn)}`;
    this.data.ous.filter(o => o.dn.toLowerCase().endsWith(`,${oldDn.toLowerCase()}`)).forEach(o => { o.dn = `${o.dn.slice(0, o.dn.length - oldDn.length)}${ou.dn}`; });
    this._repointEntries(oldDn, ou.dn); return ou;
  }
  async moveOU(id, newParentId) {
    this._assertWrite();
    const ou = this.data.ous.find(o => o.id === id);
    const parent = this.data.ous.find(o => o.id === newParentId);
    if (!ou || !parent) throw ldapError('NO_SUCH_OBJECT', id || newParentId);
    const oldDn = ou.dn; const newBase = `${rdnOf(oldDn)},${parent.dn}`;
    ou.dn = newBase; ou.parentId = parent.id;
    this.data.ous.filter(o => o.id !== id && o.dn.toLowerCase().endsWith(`,${oldDn.toLowerCase()}`)).forEach(o => { o.dn = `${o.dn.slice(0, o.dn.length - oldDn.length)}${newBase}`; });
    this._repointEntries(oldDn, newBase); return ou;
  }
  _repointEntries(oldDn, newDn) {
    for (const e of mockAllEntries(this.data)) if (e.dn.toLowerCase().endsWith(`,${oldDn.toLowerCase()}`)) e.dn = `${e.dn.slice(0, e.dn.length - oldDn.length)}${newDn}`;
    for (const g of this.data.groups) g.attrs.get('member').forEach((m, i, arr) => {
      if (String(m).toLowerCase().endsWith(`,${oldDn.toLowerCase()}`)) arr[i] = `${String(m).slice(0, String(m).length - oldDn.length)}${newDn}`;
    });
  }
  async deleteOU(id) {
    this._assertWrite();
    const ou = this.data.ous.find(o => o.id === id);
    if (!ou) throw ldapError('NO_SUCH_OBJECT', String(id));
    if (this.data.ous.some(o => o.parentId === id)) throw ldapError('ENTRY_IN_USE', '请先删除或移动子 OU');
    if (mockAllEntries(this.data).some(e => isDnWithin(e.dn, ou.dn))) throw ldapError('ENTRY_IN_USE', 'OU 下仍有对象');
    this.data.ous.splice(this.data.ous.indexOf(ou), 1); return ou;
  }
  async listOUObjects(id) {
    this._assertBound();
    const ou = this.data.ous.find(o => o.id === id);
    if (!ou) throw ldapError('NO_SUCH_OBJECT', String(id));
    return mockAllEntries(this.data).filter(e => parentDn(e.dn).toLowerCase() === ou.dn.toLowerCase()).map(e => mockAttrsOf(e));
  }
  async listGPO() { this._assertBound(); return this.data.gpos.map(g => ({ ...g, linkedOUs: [...g.linkedOUs] })); }
  async getGPO(id) {
    this._assertBound();
    const g = this.data.gpos.find(x => x.id === id);
    if (!g) throw ldapError('NO_SUCH_OBJECT', String(id));
    return { ...g, linkedOUs: [...g.linkedOUs] };
  }
  async toggleGPO(id, enabled) {
    this._assertWrite();
    const g = this.data.gpos.find(x => x.id === id);
    if (!g) throw ldapError('NO_SUCH_OBJECT', String(id));
    g.enabled = !!enabled; return { ...g };
  }
  async bindGPO(id, ouId) {
    this._assertWrite();
    const g = this.data.gpos.find(x => x.id === id);
    const ou = this.data.ous.find(o => o.id === ouId);
    if (!g || !ou) throw ldapError('NO_SUCH_OBJECT', id || ouId);
    if (!g.linkedOUs.includes(ouId)) g.linkedOUs.push(ouId);
    return { ...g };
  }
  async unbindGPO(id, ouId) {
    this._assertWrite();
    const g = this.data.gpos.find(x => x.id === id);
    if (!g) throw ldapError('NO_SUCH_OBJECT', String(id));
    g.linkedOUs = g.linkedOUs.filter(x => x !== ouId); return { ...g };
  }
  async findByField(kind, field, value) {
    this._assertBound();
    const list = kind === 'user' ? this.data.users : kind === 'computer' ? this.data.computers : kind === 'group' ? this.data.groups : [];
    const key = String(field).toLowerCase();
    const hit = list.find(e => String(e.attrs.first(key) ?? '').toLowerCase() === String(value ?? '').toLowerCase()
      || e.id === value || String(e.dn).toLowerCase() === String(value ?? '').toLowerCase());
    // 必须与 search() 的返回结构一致：{ dn, id, dnRaw, attributes }，供目录服务的 attr() 读取
    return hit ? { dn: hit.dn, dnRaw: hit.dn, id: hit.id, attributes: hit.attrs.plain() } : null;
  }
}

/* ===== LdapjsLdapClient：真实 ldapjs 驱动 ===== */
class LdapjsLdapClient {
  constructor(cfg, ldapjs) { this.cfg = cfg; this.ldapjs = ldapjs; this.client = null; this.bound = false; }
  async connect() {
    const { ldapjs, cfg } = this;
    if (!ldapjs) throw ldapError('CONN_REFUSED', '缺少 ldapjs 依赖，请设置 LDAP_CLIENT_DRIVER=mock 或安装 ldapjs');
    // SSL(LDAPS) 与 StartTLS 都需要宽松证书校验（企业域多为自签名证书）。
    // 注意：必须在 createClient 时传入 tlsOptions，SSL 模式才会生效。
    const tlsOptions = (cfg.ssl || cfg.tls) ? { rejectUnauthorized: false } : undefined;
    this.client = ldapjs.createClient({ url: cfg.url, timeout: cfg.timeout, connectTimeout: cfg.timeout, tlsOptions });
    // 吞掉空闲/关闭时的迟到 error 事件，避免 unbind 后的 ECONNRESET 冒泡
    this.client.on('error', () => {});

    // 步骤 1：等待 TCP/TLS 连接建立
    await new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(ldapError('TIMEOUT')), cfg.timeout);
      const done = err => { clearTimeout(timer); err ? reject(mapLdapError(err)) : resolve() };
      this.client.once('connect', () => done());
      this.client.once('error', err => done(err));
    });

    // 步骤 2：StartTLS（仅 tls=true，ldap:// 连接上后再升级加密）。
    // 必须在 bind 之前完成，否则 AD 会以 Strong Auth Required 拒绝明文绑定。
    if (cfg.tls && !cfg.ssl) {
      await new Promise((resolve, reject) => {
        const timer = setTimeout(() => reject(ldapError('TIMEOUT')), cfg.timeout);
        this.client.starttls(tlsOptions, null, (err) => {
          clearTimeout(timer);
          err ? reject(mapLdapError(err)) : resolve();
        });
      });
    }

    // 步骤 3：连接（及可选的 StartTLS）完成后再绑定
    if (cfg.bindDN) {
      await new Promise((resolve, reject) => {
        const timer = setTimeout(() => reject(ldapError('TIMEOUT')), cfg.timeout);
        this.client.bind(cfg.bindDN, cfg.bindPassword, (err) => {
          clearTimeout(timer);
          err ? reject(mapLdapError(err)) : resolve();
        });
      });
      this.bound = true;
    }
    return this;
  }
  async bind(dn = this.cfg.bindDN, password = this.cfg.bindPassword) {
    return new Promise((resolve, reject) => {
      this.client.bind(dn || '', password || '', err => err ? reject(ldapError('BIND_FAILED', err.message, err)) : (this.bound = true, resolve(this)));
    });
  }
  async unbind() { if (this.client) { try { this.client.unbind(); } catch { /* ignore */ } this.client = null; } }
  _assertBound() { if (!this.client) throw ldapError('CONN_REFUSED'); }
  async search(base, options = {}) {
    this._assertBound();
    const opts = {
      scope: options.scope || 'sub', filter: options.filter || '(objectClass=*)',
      attributes: options.attributes || DEFAULT_ATTRIBUTES,
      ...(options.sizeLimit ? { sizeLimit: options.sizeLimit } : {}),
      ...(options.timeLimit ? { timeLimit: options.timeLimit } : {}),
    };
    return new Promise((resolve, reject) => {
      const rows = [];
      const timer = setTimeout(() => reject(ldapError('TIMEOUT')), this.cfg.timeout);
      this.client.search(base || this.cfg.baseDN, opts, (err, res) => {
        if (err) { clearTimeout(timer); return reject(mapLdapError(err)); }
        res.on('searchEntry', entry => rows.push(serializeEntry(entry)));
        res.on('error', e => { clearTimeout(timer); reject(mapLdapError(e)); });
        res.on('end', result => {
          clearTimeout(timer);
          if (result && result.status === 4) return reject(ldapError('SIZE_LIMIT'));
          resolve(rows);
        });
      });
    });
  }
  /** PagedResultControl OID 1.2.840.113556.1.4.319 */
  async searchPaged(base, options = {}) {
    this._assertBound();
    const pageSize = Math.min(options.pageSize || this.cfg.pageSize || 100, PAGE_SIZE_MAX);
    if ((options.pageSize || 0) > PAGE_SIZE_MAX) throw ldapError('PAGE_LIMIT', `pageSize=${options.pageSize}`);
    const targetPage = Math.max(1, options.page || 1);
    const { PagedResultsControl } = this.ldapjs;

    // 单次搜索：带分页控件请求；服务端支持则每页返回 pageSize 条并带 cookie。
    const collect = cookie => new Promise((resolve, reject) => {
      const controls = [];
      if (PagedResultsControl) {
        controls.push(new PagedResultsControl({ value: { size: pageSize, cookie: cookie || Buffer.alloc(0) } }));
      }
      const timer = setTimeout(() => reject(ldapError('TIMEOUT')), this.cfg.timeout);
      this.client.search(base || this.cfg.baseDN, {
        scope: options.scope || 'sub', filter: options.filter || '(objectClass=*)',
        attributes: options.attributes || DEFAULT_ATTRIBUTES, controls,
      }, (err, res) => {
        if (err) { clearTimeout(timer); return reject(mapLdapError(err)); }
        const items = [];
        let cookieOut = null;
        const readCookie = result => {
          const ctrl = (result.controls || []).find(c => String(c.type).includes(PAGED_RESULT_OID));
          if (ctrl && ctrl.controlValue && ctrl.controlValue.cookie) {
            cookieOut = Buffer.isBuffer(ctrl.controlValue.cookie) ? ctrl.controlValue.cookie : Buffer.from(String(ctrl.controlValue.cookie));
          }
        };
        res.on('searchEntry', entry => items.push(serializeEntry(entry)));
        res.on('page', (result) => readCookie(result));
        res.on('error', e => { clearTimeout(timer); reject(mapLdapError(e)); });
        res.on('end', result => { clearTimeout(timer); readCookie(result); resolve({ items, cookie: cookieOut }); });
      });
    });

    // 先取第一页；若服务端返回了非空 cookie，说明真正支持服务端分页，按需翻页。
    const first = await collect(null);
    const hasServerPaging = first.cookie && first.cookie.length > 0;
    if (hasServerPaging) {
      let items = first.items;
      let total = first.items.length;
      let cookie = first.cookie;
      // 翻到目标页
      for (let p = 2; p <= targetPage && cookie && cookie.length; p++) {
        const r = await collect(cookie);
        items = r.items; total += r.items.length; cookie = r.cookie;
      }
      // 探测剩余页统计总数
      let probes = 0;
      while (cookie && cookie.length && probes < 200) {
        const r = await collect(cookie);
        total += r.items.length; cookie = r.cookie; probes++;
      }
      return { items, total, page: targetPage, pageSize, pages: Math.max(1, Math.ceil(total / pageSize)) };
    }

    // 服务端未返回分页 cookie（部分 AD/网关）：退化为客户端分页。
    // 第一页 collect 已拉到全部条目，直接本地切片。
    const all = first.items;
    const start = (targetPage - 1) * pageSize;
    return {
      items: all.slice(start, start + pageSize),
      total: all.length,
      page: targetPage,
      pageSize,
      pages: Math.max(1, Math.ceil(all.length / pageSize)),
    };
  }
  async searchOne(base, options = {}) { const rows = await this.search(base, { ...options, scope: 'base', sizeLimit: 1 }); return rows[0] || null; }
  _promiseCall(method, ...args) {
    this._assertBound();
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(ldapError('TIMEOUT')), this.cfg.timeout);
      this.client[method](...args, err => { clearTimeout(timer); if (err) return reject(mapLdapError(err)); resolve({ ok: true }); });
    });
  }
  // ldapjs 3.x 的 modify 要求 modification 为 Attribute 实例，不能是普通对象。
  _attr(name, values) {
    const Attribute = this.ldapjs && this.ldapjs.Attribute;
    if (!Attribute) return { name, values }; // 兼容旧版 ldapjs
    return new Attribute({ type: name, values: Array.isArray(values) ? values : [values] });
  }
  async add(dn, attrs) { return this._promiseCall('add', dn, attrs); }
  async modify(dn, changes) { return this._promiseCall('modify', dn, changes); }
  async modifyAttributes(dn, patch = {}) {
    return this.modify(dn, Object.entries(patch).map(([name, values]) => ({
      operation: 'replace',
      modification: this._attr(name, Array.isArray(values) ? values : [values]),
    })));
  }
  async del(dn) { return this._promiseCall('del', dn); }
  async rename(dn, newRdn) { return this._promiseCall('rename', dn, newRdn); }
  async move(dn, newParent) { return this._promiseCall('modifyDN', dn, rdnOf(dn), newParent, true); }
  async modifyPassword(dn, newPassword) { return this.modifyAttributes(dn, { userPassword: newPassword, pwdLastSet: '0' }); }
  async changeState(dn, enabled) {
    const entry = await this.searchOne(dn, { attributes: ['userAccountControl'] });
    const uac = Number(first(attributesValue(entry, 'userAccountControl')) || 0);
    return this.modifyAttributes(dn, { userAccountControl: String(enabled ? (uac & ~2) : (uac | 2)) });
  }
  async unlock(dn) { return this.modifyAttributes(dn, { lockoutTime: '0' }); }
  async addGroupMember(g, m) { return this.modify(g, [{ operation: 'add', modification: this._attr('member', [m]) }]); }
  async removeGroupMember(g, m) { return this.modify(g, [{ operation: 'delete', modification: this._attr('member', [m]) }]); }
  async listGroupMembers(g) {
    const rows = await this.search(g, { scope: 'base', attributes: ['member'] });
    return asArray(attributesValue(rows[0], 'member')).map(dn => ({ dn }));
  }
  async listOU() {
    const root = rootDnOf(this.cfg.baseDN) || this.cfg.baseDN;
    try {
      return await this.search(this.cfg.baseDN, { filter: '(objectClass=organizationalUnit)', attributes: ['ou', 'description'] });
    } catch (err) {
      if (err && err.code === 'NO_SUCH_OBJECT' && root.toLowerCase() !== String(this.cfg.baseDN).toLowerCase()) {
        return this.search(root, { filter: '(objectClass=organizationalUnit)', attributes: ['ou', 'description'] });
      }
      throw err;
    }
  }
  async createOU(name, parentId) {
    const dn = `ou=${escapeFilter(name)},${parentId || this.cfg.baseDN}`;
    await this.add(dn, { objectClass: ['top', 'organizationalUnit'], ou: name });
    return { id: dn, name, dn, parentId: parentId || this.cfg.baseDN };
  }
  async renameOU(id, name) { return this.rename(id, `ou=${escapeFilter(name)}`); }
  async moveOU(id, parent) { return this.move(id, parent); }
  async deleteOU(id) {
    const rows = await this.search(id, { scope: 'one', attributes: ['cn', 'ou'] });
    if (rows.length) throw ldapError('ENTRY_IN_USE', 'OU 非空');
    return this.del(id);
  }
  async listOUObjects(id) { return this.search(id, { scope: 'one' }); }
  async listGPO() {
    const root = rootDnOf(this.cfg.baseDN) || this.cfg.baseDN;
    // AD 中 GPO 实际位于 CN=Policies,CN=System,<root>；先试标准路径，失败再试根下直接路径
    const candidates = [`cn=Policies,cn=System,${root}`, `cn=Policies,${root}`];
    let lastErr = null;
    for (const base of candidates) {
      try {
        return await this.search(base, { filter: '(objectClass=groupPolicyContainer)', attributes: ['cn', 'displayName', 'flags'] });
      } catch (err) {
        lastErr = err;
        if (!err || err.code !== 'NO_SUCH_OBJECT') throw err;
      }
    }
    throw lastErr || ldapError('NO_SUCH_OBJECT');
  }
  async getGPO(id) {
    const rows = await this.search(id, { scope: 'base' });
    if (!rows[0]) throw ldapError('NO_SUCH_OBJECT', String(id));
    return rows[0];
  }
  async toggleGPO(id, enabled) { return this.modifyAttributes(id, { flags: enabled ? '0' : '1' }); }
  async bindGPO(id, ou) { return this.modify(ou, [{ operation: 'add', modification: this._attr('gPLink', [`[LDAP://${id};0]`]) }]); }
  async unbindGPO(id, ou) { return this.modify(ou, [{ operation: 'delete', modification: this._attr('gPLink', [`[LDAP://${id};0]`]) }]); }
  async findByField(kind, field, value) {
    const oc = kind === 'user' ? 'user' : kind === 'computer' ? 'computer' : 'group';
    const v = String(value == null ? '' : value);

    // id 不是 LDAP 属性。列表返回的 id 通常是 DN 或登录名/ cn。
    // 1) 若看起来是 DN（含 '='），直接用 base scope 读取，最可靠。
    if (field === 'id' && /=/.test(v)) {
      try {
        const rows = await this.search(v, { scope: 'base', attributes: DEFAULT_ATTRIBUTES });
        if (rows[0]) return rows[0];
      } catch (e) { /* 落到下面的属性查找 */ }
    }
    // 2) 依次按该对象类型的候选属性查找（id 可能是 sAMAccountName / uid / cn）
    const candidates = field === 'id'
      ? (kind === 'user' ? ['sAMAccountName', 'uid', 'cn'] : ['cn', 'sAMAccountName'])
      : [field];
    for (const attr of candidates) {
      try {
        let rows;
        try {
          rows = await this.search(this.cfg.baseDN, {
            filter: `(&(objectClass=${oc})(${escapeFilter(attr)}=${escapeFilter(v)}))`,
            attributes: DEFAULT_ATTRIBUTES,
          });
        } catch (e) {
          if (!e || e.code !== 'NO_SUCH_OBJECT') throw e;
          const root = rootDnOf(this.cfg.baseDN) || this.cfg.baseDN;
          rows = await this.search(root, {
            filter: `(&(objectClass=${oc})(${escapeFilter(attr)}=${escapeFilter(v)}))`,
            attributes: DEFAULT_ATTRIBUTES,
          });
        }
        if (rows[0]) return rows[0];
      } catch (e) { /* 继续下一个候选属性 */ }
    }
    return null;
  }
}

function attributesValue(entry, name) {
  if (!entry) return undefined;
  const attrs = entry.attributes || entry.attrs || entry;
  if (Array.isArray(attrs)) {
    const hit = attrs.find(a => String(a.type || a.name || '').toLowerCase() === String(name).toLowerCase());
    return hit ? hit.values : undefined;
  }
  const key = Object.keys(attrs).find(k => k.toLowerCase() === String(name).toLowerCase());
  return key ? attrs[key] : undefined;
}
/**
 * 解码 RFC4514/LDAP 的十六进制字节转义（\\e6\\96\\87 -> 中文）。
 * ldapjs 对非 ASCII DN 会返回 \\XX 转义形式，UI 需要显示可读的简体中文。
 */
export function decodeDnEscapes(value) {
  if (Array.isArray(value)) return value.map(decodeDnEscapes);
  if (typeof value !== 'string') return value;
  if (!/\\([0-9a-fA-F]{2})/.test(value)) return value;
  let out = ''
  let hexBuf = ''
  const flush = () => {
    if (!hexBuf) return
    try { out += Buffer.from(hexBuf, 'hex').toString('utf8') } catch (e) { out += '\\' + hexBuf }
    hexBuf = ''
  }
  for (let i = 0; i < value.length; i++) {
    const ch = value[i]
    if (ch === '\\' && i + 2 < value.length && /^[0-9a-fA-F]{2}$/.test(value.slice(i + 1, i + 3))) {
      hexBuf += value.slice(i + 1, i + 3)
      i += 2
    } else {
      flush()
      out += ch
    }
  }
  flush()
  return out
}

function serializeEntry(entry) {
  const rawDn = entry.dn && entry.dn.toString ? entry.dn.toString() : String(entry.dn || '');
  // dn 用于显示（解码中文）；dnRaw 保留服务器原始转义 DN，用于 LDAP 写操作。
  const out = { dn: decodeDnEscapes(rawDn), dnRaw: rawDn };
  // ldapjs 的 entry.pojo.attributes 是 [{type, values}] 数组；
  // 某些实现给出 {name: values} 对象。两种都要支持，且绝不能产生数字键。
  const src = (entry.pojo && entry.pojo.attributes) || entry.attributes || [];
  if (Array.isArray(src)) {
    for (const a of src) {
      if (!a || a.type == null) continue;
      out[String(a.type)] = asArray(a.values);
    }
  } else if (src && typeof src === 'object') {
    for (const [k, v] of Object.entries(src)) {
      out[k] = asArray(v && v.values !== undefined ? v.values : v);
    }
  }
  // 对 DN 类字段统一解码中文转义
  for (const key of ['memberOf', 'member', 'manager', 'managedBy', 'dn']) {
    if (out[key] !== undefined) out[key] = decodeDnEscapes(out[key]);
  }
  out.id = out.id || out.dn;
  return out;
}

export function mapLdapError(err) {
  if (!err) return ldapError('UNKNOWN');
  if (err instanceof LdapError) return err;
  const code = err.code || err.errno || err.name || '';
  const msg = String(err.message || '');
  const c = String(code).toLowerCase();
  if (['econnrefused', 'connectionrefused', 'enotfound', 'ehostunreach'].includes(c) || /connect|refused|socket hang up/i.test(msg)) return ldapError('CONN_REFUSED', msg, err);
  if (['etimeout', 'timeout'].includes(c) || /timeout|timed out/i.test(msg)) return ldapError('TIMEOUT', msg, err);
  // AD 的 Strong Auth Required 必须先于通用 49/invalid credentials 判断，
  // 否则会被误报为"账号或密码错误"，掩盖真正的加密方式问题。
  if (/strong auth|stronger auth/i.test(msg)) return ldapError('STRONG_AUTH_REQUIRED', msg, err);
  if (c === 'invalidcredentials' || /49\b|invalidcredentials|bind failed/i.test(msg)) return ldapError('BIND_FAILED', msg, err);
  if (c === 'insufficientaccess' || /50\b|insufficientaccess|unwilling to perform|access denied/i.test(msg)) return ldapError('INSUFFICIENT_ACCESS', msg, err);
  if (c === 'nosuchobject' || /32\b|nosuchobject|no such object/i.test(msg)) return ldapError('NO_SUCH_OBJECT', msg, err);
  if (/19\b|constraintviolation|password policy|pwdpolicy|password/i.test(msg)) return ldapError('PASSWORD_POLICY', msg, err);
  if (/68\b|entryalreadyexists|entry in use/i.test(msg)) return ldapError('ENTRY_IN_USE', msg, err);
  if (/4\b|sizelimitexceeded|size limit/i.test(msg)) return ldapError('SIZE_LIMIT', msg, err);
  if (/page.?limit|page size/i.test(msg)) return ldapError('PAGE_LIMIT', msg, err);
  if (/tls|ssl|certificate/i.test(msg)) return ldapError('TLS_FAILED', msg, err);
  return ldapError('UNKNOWN', msg || code, err);
}

/**
 * 创建 LDAP 客户端，自动选择 mock / ldapjs 驱动。
 * @param {object} cfg { url, port, ssl, tls, bindDN, bindPassword, baseDN, timeout, pageSize, driver }
 * @returns {Promise<object>} 已连接并绑定的客户端
 */
export async function createLdapClient(cfg = {}) {
  const config = normalizeConfig(cfg);
  const wantMock = config.driver === 'mock' || config.driver === 'memory';
  const wantReal = config.driver === 'ldapjs';

  // 演示模式：用户显式选择，直接使用内置内存驱动
  if (wantMock) {
    const client = new MockLdapClient(config);
    await client.connect();
    if (config.bindDN) await client.bind(config.bindDN, config.bindPassword);
    client.driverUsed = 'mock';
    return client;
  }

  // 真实/自动模式：尝试 ldapjs
  let ldapjs = null;
  try { ldapjs = require('ldapjs'); } catch { /* 依赖缺失 */ }
  if (ldapjs) {
    // 有 ldapjs：真实连接失败必须如实报错，绝不静默回退到演示数据。
    // 否则用户填了真实域却看到假数据，会误以为连接成功。
    const client = new LdapjsLdapClient(config, ldapjs);
    await client.connect(); // connect() 内已按正确时序完成连接→StartTLS→bind
    client.driverUsed = 'ldapjs';
    return client;
  }

  // 无 ldapjs：仅当 auto（用户未强制真实）时回退演示驱动
  if (wantReal) throw ldapError('CONN_REFUSED', '缺少 ldapjs 依赖，无法连接真实 LDAP');
  const client = new MockLdapClient(config);
  await client.connect();
  if (config.bindDN) await client.bind(config.bindDN, config.bindPassword);
  client.driverUsed = 'mock';
  client.mockFallbackReason = '缺少 ldapjs 依赖，已自动切换到内置演示驱动（安装 ldapjs 可连接真实域）';
  return client;
}

export { MockLdapClient, LdapjsLdapClient, normalizeConfig };
export default createLdapClient;
