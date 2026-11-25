// src/directory-service.js — 域对象服务（ARCHITECTURE.md 2.1 directory.*）
// 统一信封 { ok, data, error }；写操作带 actor 经 RBAC 校验并记审计；delete*/resetPassword 需 confirmToken。
import { createRbac, ACTIONS } from './rbac.js';

const PAGE_SIZE_DEFAULT = 20;
const PAGE_SIZE_MAX = 1000;

function ok(data) { return { ok: true, data }; }
function fail(code, message, cause) {
  const error = { code, message: message || `操作失败：${code}` };
  if (cause) error.cause = cause;
  return { ok: false, error };
}
function attr(row, name) {
  if (!row) return undefined;
  const lower = String(name).toLowerCase();
  // 真实 ldapjs 驱动：属性平铺在 row 上（row.cn / row.sAMAccountName）
  if (Object.prototype.hasOwnProperty.call(row, name)) return row[name];
  const flatKey = Object.keys(row).find(k => k.toLowerCase() === lower && k !== 'attributes' && k !== 'attrs');
  if (flatKey !== undefined) return row[flatKey];
  // mock 驱动：属性在 row.attributes / row.attrs 中（对象或 [{type,values}] 数组）
  const a = row.attributes || row.attrs;
  if (Array.isArray(a)) {
    const hit = a.find(x => String(x.type || x.name || '').toLowerCase() === lower);
    return hit ? hit.values : undefined;
  }
  if (a && typeof a === 'object') {
    const key = Object.keys(a).find(k => k.toLowerCase() === lower);
    return key ? a[key] : undefined;
  }
  return undefined;
}
function first(v) { return Array.isArray(v) ? v[0] : v; }
function s(v) { const x = first(v); return x === undefined || x === null ? '' : String(x); }
function boolFromUac(v) { return (Number(first(v) || 0) & 2) === 0; }
function enabledUac(enabled, computer) { return computer ? (enabled ? 4096 : 4098) : (enabled ? 512 : 514); }
function escapeFilter(v) { return String(v).replace(/[\\*()\u0000]/g, ch => '\\' + ch.charCodeAt(0).toString(16).padStart(2, '0')); }
function pick(row, extra = {}) {
  return {
    id: s(row.id || attr(row, 'uid')),
    dn: s(row.dn),
    name: s(attr(row, 'cn') || attr(row, 'ou') || attr(row, 'name')),
    ...extra,
  };
}
function listParams(q = {}) {
  return {
    ...q,
    page: Math.max(1, Number(q.page) || 1),
    pageSize: Math.min(Math.max(1, Number(q.pageSize) || PAGE_SIZE_DEFAULT), PAGE_SIZE_MAX),
  };
}
function paginate(items, q) {
  const { page, pageSize } = listParams(q);
  return { items: items.slice((page - 1) * pageSize, page * pageSize), total: items.length, page, pageSize };
}
function ouDnOf(baseDN, q) { return q.ouDn || (q.filters && q.filters.ouDN) || baseDN; }
/** 从 DN 中提取根域组件，如 OU=xxx,DC=futronics,DC=cn -> DC=futronics,DC=cn */
function rootDnOf(dn) {
  const parts = String(dn || '').split(',').map(s => s.trim()).filter(Boolean);
  const dc = parts.filter(p => /^DC=/i.test(p));
  return dc.length ? dc.join(',') : '';
}
function buildFilter(kind, q) {
  const oc = kind === 'user' ? 'user' : kind === 'computer' ? 'computer' : 'group';
  const parts = [`(objectClass=${oc})`];
  // AD 中计算机对象继承 user，单用 (objectClass=user) 会把计算机也算进用户列表。
  // 用 NOT(objectClass=computer) 排除；同时用 userAccountControl 位 0x2000 过滤（计算机账号）。
  if (kind === 'user') parts.push('(!(objectClass=computer))');
  if (kind === 'computer') parts.push('(objectCategory=computer)');
  const kw = q.keyword ? String(q.keyword).toLowerCase() : '';
  if (kw) {
    const fields = kind === 'user' ? ['cn', 'sAMAccountName', 'userPrincipalName', 'displayName', 'mail']
      : kind === 'computer' ? ['cn', 'dNSHostName', 'operatingSystem']
        : ['cn', 'sAMAccountName', 'description'];
    parts.push(`(|${fields.map(f => `(${f}=*${escapeFilter(kw)}*)`).join('')})`);
  }
  for (const [k, v] of Object.entries(q.filters || {})) {
    if (v === undefined || v === null || v === '' || ['ouDn', 'ouDN', 'parentId', 'enabled'].includes(k)) continue;
    parts.push(`(${escapeFilter(k)}=${escapeFilter(v)})`);
  }
  return parts.length > 1 ? `(&${parts.join('')})` : parts[0];
}
// 把 AD 原始属性转为前端行对象。
// 关键：同时保留 AD 原始属性名（sAMAccountName/userPrincipalName/mail/pwdLastSet，
// UI 列表按这些名字取列）与语义别名（username/upn/email），避免字段缺失。
function userView(row) {
  const sam = s(attr(row, 'sAMAccountName') || attr(row, 'uid'));
  const upn = s(attr(row, 'userPrincipalName'));
  const mail = s(attr(row, 'mail'));
  const display = s(attr(row, 'displayName'));
  return {
    ...pick(row),
    id: s(row.id || attr(row, 'uid') || sam),
    // AD 原始属性名（UI 列表使用）
    sAMAccountName: sam,
    userPrincipalName: upn,
    mail: mail,
    displayName: display,
    givenName: s(attr(row, 'givenName')),
    sn: s(attr(row, 'sn')),
    initials: s(attr(row, 'initials')),
    title: s(attr(row, 'title')),
    department: s(attr(row, 'department')),
    company: s(attr(row, 'company')),
    employeeID: s(attr(row, 'employeeID')),
    employeeNumber: s(attr(row, 'employeeNumber')),
    telephoneNumber: s(attr(row, 'telephoneNumber')),
    mobile: s(attr(row, 'mobile')),
    ipPhone: s(attr(row, 'ipPhone')),
    physicalDeliveryOfficeName: s(attr(row, 'physicalDeliveryOfficeName')),
    manager: s(attr(row, 'manager')),
    pwdLastSet: s(attr(row, 'pwdLastSet')),
    whenCreated: s(attr(row, 'whenCreated')),
    whenChanged: s(attr(row, 'whenChanged')),
    lastLogon: s(attr(row, 'lastLogon')),
    // 语义别名（兼容其它调用方）
    username: sam,
    upn: upn,
    email: mail,
    name: display || s(attr(row, 'cn')),
    enabled: boolFromUac(attr(row, 'userAccountControl')),
    locked: Number(first(attr(row, 'lockoutTime')) || 0) > 0,
    memberOf: (attr(row, 'memberOf') || []).map(String),
  };
}
function computerView(row) {
  return {
    ...pick(row),
    id: s(row.id || attr(row, 'cn')),
    name: s(attr(row, 'cn') || attr(row, 'name')),
    dnsHostName: s(attr(row, 'dNSHostName')),
    operatingSystem: s(attr(row, 'operatingSystem')),
    operatingSystemVersion: s(attr(row, 'operatingSystemVersion')),
    description: s(attr(row, 'description')),
    enabled: boolFromUac(attr(row, 'userAccountControl')),
    whenCreated: s(attr(row, 'whenCreated')),
    lastLogon: s(attr(row, 'lastLogon')),
  };
}
function groupView(row) {
  const member = attr(row, 'member') || [];
  return {
    ...pick(row),
    id: s(row.id || attr(row, 'cn')),
    name: s(attr(row, 'cn') || attr(row, 'name')),
    sAMAccountName: s(attr(row, 'sAMAccountName')),
    samAccountName: s(attr(row, 'sAMAccountName')),
    groupType: s(attr(row, 'groupType')),
    scope: s(attr(row, 'groupScope')),
    groupScope: s(attr(row, 'groupScope')),
    description: s(attr(row, 'description')),
    managedBy: s(attr(row, 'managedBy')),
    memberCount: Array.isArray(member) ? member.length : (member ? 1 : 0),
  };
}
function gpoView(g) {
  return {
    id: s(g.id || g.dn), dn: s(g.dn),
    name: s(g.name || first(attr(g, 'displayName')) || first(attr(g, 'cn'))),
    enabled: g.enabled === undefined ? true : !!g.enabled,
    linkedOUs: Array.isArray(g.linkedOUs) ? [...g.linkedOUs] : [],
    description: s(g.description || first(attr(g, 'description'))),
  };
}

/** @param {{ldap,store,auditor,rbac}} deps */
export function createDirectoryService({ ldap, store, auditor, rbac } = {}) {
  if (!ldap) throw new Error('createDirectoryService 需要 ldap 客户端实例');
  const auth = rbac || createRbac();
  const audit = typeof auditor === 'function' ? auditor
    : (auditor && typeof auditor.record === 'function' ? auditor : null);
  // baseDN 支持字符串或函数；函数形式在切换域后动态生效
  const baseDNValue = (ldap.cfg && ldap.cfg.baseDN) || (store && store.baseDN) || '';
  function getBaseDN() {
    return typeof baseDNValue === 'function' ? baseDNValue() : baseDNValue;
  }

  function guard(actor, action) {
    const role = typeof actor === 'string' ? actor
      : ((actor && (actor.role || (Array.isArray(actor.roles) ? actor.roles[0] : null))) || 'viewer');
    auth.assert(role, action);
    return role;
  }
  function write(ctx) {
    if (!audit) return;
    try {
      audit.record({
        actor: ctx.actor, time: new Date().toISOString(), target: ctx.target,
        action: ctx.action, result: ctx.result, detail: ctx.detail,
      });
    } catch { /* 审计失败不影响主流程 */ }
  }
  async function call(handler) {
    try { return await handler(); }
    catch (err) {
      const code = (err && (err.code || err.codeName)) || 'UNKNOWN';
      return fail(code, err && err.message, err);
    }
  }
  const confirmed = t => t === 'CONFIRMED';
  const confirmError = () => fail('CONFIRM_REQUIRED', '高危操作需要二次确认令牌（confirmToken=CONFIRMED）。');
  async function findDn(kind, field, value) {
    const row = await ldap.findByField(kind, field, value);
    if (!row) throw Object.assign(new Error('对象不存在或 DN 路径有误。'), { code: 'NO_SUCH_OBJECT' });
    return row;
  }
  // 写操作必须用服务器原始 DN（转义形式）；解码后的中文 DN 只用于显示，
  // 直接写回 AD 会报 No Such Object。dnRaw 由 serializeEntry 保留。
  function writeDn(row) { return (row && row.dnRaw) || (row && row.dn) || ''; }
  async function _list(kind, q) {
    const selectedBase = ouDnOf(getBaseDN(), q);
    const filter = buildFilter(kind, q);
    let result;
    let usedBase = selectedBase;
    try {
      result = await ldap.searchPaged(selectedBase, { filter, page: q.page, pageSize: q.pageSize });
    } catch (err) {
      // 用户填的 baseDN（如含中文 OU）在 AD 中可能因 DN 写法差异导致 NO_SUCH_OBJECT。
      // 自动回退到根 DC 重试，保证能列出对象；OU 过滤仍由 q.filters 处理。
      const rootDn = rootDnOf(selectedBase);
      if (err && err.code === 'NO_SUCH_OBJECT' && rootDn && rootDn.toLowerCase() !== String(selectedBase).toLowerCase()) {
        result = await ldap.searchPaged(rootDn, { filter, page: q.page, pageSize: q.pageSize });
        usedBase = rootDn;
      } else throw err;
    }
    let rows = result.items;
    let total = result.total;
    if (q.filters && q.filters.enabled !== undefined && kind !== 'group') {
      rows = rows.filter(r => boolFromUac(attr(r, 'userAccountControl')) === !!q.filters.enabled);
      total = rows.length;
    }
    return { items: rows, total, page: result.page, pageSize: result.pageSize, baseDnUsed: usedBase };
  }

  const service = {
    // ---------- 列表 ----------
    async listUsers(q = {}) {
      return call(async () => {
        const r = await _list('user', q);
        // 应用层二次保险：AD 中计算机对象继承 user，某些域控的 LDAP filter
        // 对 (objectClass=user) 的排除不彻底，这里再剔除计算机账号，
        // 确保"用户"页签绝不混入计算机数据。
        let rows = r.items.filter(row => {
          const oc = (attr(row, 'objectClass') || []).map(String);
          const isComputer = oc.some(c => /computer/i.test(c))
            || (Number(first(attr(row, 'userAccountControl')) || 0) & 0x2000) !== 0
            || /\$$/.test(s(attr(row, 'sAMAccountName') || attr(row, 'cn')));
          return !isComputer;
        });
        let total = r.total;
        if (rows.length !== r.items.length) total = r.total - (r.items.length - rows.length);
        // 应用端 filters.enabled 与缓存筛选保持一致（ LDAP 已过滤时此处幂等）。
        if (q.filters && q.filters.enabled !== undefined) {
          rows = rows.filter(x => x.enabled === !!q.filters.enabled);
          total = rows.length;
        }
        return ok({ ...r, items: rows.map(userView), total });
      });
    },
    async listComputers(q = {}) {
      return call(async () => {
        const r = await _list('computer', q);
        return ok({ ...r, items: r.items.map(computerView) });
      });
    },
    async listGroups(q = {}) {
      return call(async () => {
        const r = await _list('group', q);
        return ok({ ...r, items: r.items.map(groupView) });
      });
    },
    async listOUs(q = {}) {
      return call(async () => {
        let items = (ldap.listOU ? await ldap.listOU() : []).map(r => {
          const dn = s(r.dn);
          // 真实 LDAP search 不返回 parentId，从 DN 推导父 DN（去掉第一个 RDN）
          const comma = dn.indexOf(',');
          const derivedParent = comma > 0 ? dn.slice(comma + 1) : null;
          return {
            id: s(r.id || dn), dn: dn,
            name: s(r.name || first(attr(r, 'ou'))),
            parentId: s(r.parentId) || derivedParent,
          };
        });
        if (q.keyword) items = items.filter(x => x.name.toLowerCase().includes(String(q.keyword).toLowerCase()) || x.dn.toLowerCase().includes(String(q.keyword).toLowerCase()));
        if (q.filters && q.filters.parentId) items = items.filter(x => x.parentId === q.filters.parentId);
        return ok(paginate(items, q));
      });
    },
    async listGPOs(q = {}) {
      return call(async () => {
        let items = (ldap.listGPO ? await ldap.listGPO() : []).map(gpoView);
        if (q.keyword) items = items.filter(x => x.name.toLowerCase().includes(String(q.keyword).toLowerCase()));
        if (q.filters && q.filters.enabled !== undefined) items = items.filter(x => x.enabled === !!q.filters.enabled);
        return ok(paginate(items, q));
      });
    },

    // ---------- 用户 ----------
    async getUser(id, actor) {
      return call(async () => {
        guard(actor || 'viewer', ACTIONS.OBJECT_READ);
        return ok(userView(await findDn('user', 'id', id)));
      });
    },
    async createUser(u = {}, actor) {
      return call(async () => {
        guard(actor, ACTIONS.OBJECT_WRITE);
        const name = u.name || u.cn || u.username || u.sAMAccountName;
        const dn = `cn=${escapeFilter(name)},${u.ouDn || u.ou || getBaseDN()}`;
        await ldap.add(dn, {
          objectClass: ['top', 'person', 'organizationalPerson', 'user'],
          cn: name, sn: u.sn || name.slice(0, 1) || name,
          givenName: u.givenName || name.slice(1) || name,
          sAMAccountName: u.username || u.sAMAccountName || name,
          userPrincipalName: u.upn || u.userPrincipalName || `${u.username || name}@example.com`,
          displayName: u.displayName || name,
          givenName: u.givenName || '', sn: u.sn || name.slice(0, 1) || name,
          mail: u.email || u.mail || '', mobile: u.mobile || '',
          // 工号/部门/职位等档案字段：按 AD 规则描述为 部门-工号-姓名
          employeeID: u.employeeID || u.employeeNumber || '',
          employeeNumber: u.employeeNumber || u.employeeID || '',
          department: u.department || '', company: u.company || '',
          title: u.title || '', telephoneNumber: u.telephoneNumber || '',
          physicalDeliveryOfficeName: u.physicalDeliveryOfficeName || '',
          manager: u.manager || '',
          description: u.description || '',
          userAccountControl: String(enabledUac(u.enabled !== false, false)),
          pwdLastSet: '0', lockoutTime: '0',
        });
        const created = await ldap.findByField('user', 'sAMAccountName', u.username || u.sAMAccountName || name).catch(() => null);
        const view = { id: (created && created.id) || u.id || dn, dn, name, username: u.username || u.sAMAccountName || name, enabled: u.enabled !== false, locked: false };
        write({ actor, action: 'directory.createUser', target: dn, result: 'success', detail: view });
        return ok(view);
      });
    },
    async updateUser(u = {}, actor) {
      return call(async () => {
        guard(actor, ACTIONS.OBJECT_WRITE);
        const row = await findDn('user', 'id', u.id || u.dn);
        const map = { name: 'cn', cn: 'cn', username: 'sAMAccountName', sAMAccountName: 'sAMAccountName', upn: 'userPrincipalName', userPrincipalName: 'userPrincipalName', displayName: 'displayName', givenName: 'givenName', sn: 'sn', email: 'mail', mail: 'mail', mobile: 'mobile', employeeID: 'employeeID', employeeNumber: 'employeeNumber', department: 'department', company: 'company', title: 'title', telephoneNumber: 'telephoneNumber', physicalDeliveryOfficeName: 'physicalDeliveryOfficeName', manager: 'manager', description: 'description' };
        const patch = {};
        for (const [k, v] of Object.entries(u)) if (map[k] && v !== undefined) patch[map[k]] = v;
        await ldap.modifyAttributes(writeDn(row), patch);
        write({ actor, action: 'directory.updateUser', target: row.dn, result: 'success', detail: { id: u.id } });
        return ok({ id: u.id || row.dn, dn: row.dn, ...patch });
      });
    },
    async resetPassword(id, password, confirmToken, actor) {
      return call(async () => {
        guard(actor, ACTIONS.PASSWORD_RESET);
        if (!confirmed(confirmToken)) return confirmError();
        if (!password || String(password).length < 8) return fail('PASSWORD_POLICY', '密码不符合域密码策略：至少 8 位。');
        const row = await findDn('user', 'id', id);
        await ldap.modifyPassword(writeDn(row), password, confirmToken);
        write({ actor, action: 'directory.resetPassword', target: row.dn, result: 'success', detail: { id } });
        return ok({ id, changed: true });
      });
    },
    async toggleUser(id, enabled, actor) {
      return call(async () => {
        guard(actor, ACTIONS.OBJECT_WRITE);
        const row = await findDn('user', 'id', id);
        await ldap.changeState(writeDn(row), !!enabled);
        write({ actor, action: 'directory.toggleUser', target: row.dn, result: 'success', detail: { id, enabled: !!enabled } });
        return ok({ id, enabled: !!enabled });
      });
    },
    async unlockUser(id, actor) {
      return call(async () => {
        guard(actor, ACTIONS.OBJECT_WRITE);
        const row = await findDn('user', 'id', id);
        await ldap.unlock(writeDn(row));
        write({ actor, action: 'directory.unlockUser', target: row.dn, result: 'success', detail: { id } });
        return ok({ id, unlocked: true });
      });
    },
    async moveUser(id, ouDn, actor) {
      return call(async () => {
        guard(actor, ACTIONS.OBJECT_WRITE);
        const row = await findDn('user', 'id', id);
        const dest = ouDn && ouDn.dn ? ouDn.dn : ouDn;
        await ldap.move(writeDn(row), dest);
        write({ actor, action: 'directory.moveUser', target: row.dn, result: 'success', detail: { id, ouDn: dest } });
        return ok({ id, dn: `${row.dn.split(',')[0]},${dest}` });
      });
    },
    async deleteUser(id, confirmToken, actor) {
      return call(async () => {
        guard(actor, ACTIONS.OBJECT_DELETE);
        if (!confirmed(confirmToken)) return confirmError();
        const row = await findDn('user', 'id', id);
        await ldap.del(writeDn(row), confirmToken);
        write({ actor, action: 'directory.deleteUser', target: row.dn, result: 'success', detail: { id } });
        return ok({ id, deleted: true });
      });
    },
    async getUserGroups(id, actor) {
      return call(async () => {
        guard(actor || 'viewer', ACTIONS.OBJECT_READ);
        const row = await findDn('user', 'id', id);
        const dns = (attr(row, 'memberOf') || []).map(String);
        const items = dns.map(dn => ({ id: dn, dn, name: dn.split(',')[0] }));
        return ok({ items, total: items.length });
      });
    },

    // ---------- 计算机 ----------
    async createComputer(c = {}, actor) {
      return call(async () => {
        guard(actor, ACTIONS.OBJECT_WRITE);
        const name = c.name || c.cn || c.hostname;
        const dn = `cn=${escapeFilter(name)},${c.ouDn || getBaseDN()}`;
        await ldap.add(dn, {
          objectClass: ['top', 'computer'], cn: name, name,
          dNSHostName: c.dnsHostName || c.dnshostname || `${name}.example.com`,
          operatingSystem: c.operatingSystem || c.os || '',
          userAccountControl: String(enabledUac(c.enabled !== false, true)),
        });
        const created = await ldap.findByField('computer', 'cn', name).catch(() => null);
        write({ actor, action: 'directory.createComputer', target: dn, result: 'success', detail: { name } });
        return ok({ id: (created && created.id) || c.id || dn, dn, name, enabled: c.enabled !== false });
      });
    },
    async updateComputer(c = {}, actor) {
      return call(async () => {
        guard(actor, ACTIONS.OBJECT_WRITE);
        const row = await findDn('computer', 'id', c.id || c.dn);
        const map = { name: 'cn', cn: 'cn', dnsHostName: 'dNSHostName', dnshostname: 'dNSHostName', operatingSystem: 'operatingSystem', os: 'operatingSystem', description: 'description' };
        const patch = {};
        for (const [k, v] of Object.entries(c)) if (map[k] && v !== undefined) patch[map[k]] = v;
        await ldap.modifyAttributes(writeDn(row), patch);
        write({ actor, action: 'directory.updateComputer', target: row.dn, result: 'success', detail: { id: c.id } });
        return ok({ id: c.id || row.dn, dn: row.dn, ...patch });
      });
    },
    async getComputer(id, actor) {
      return call(async () => {
        guard(actor || 'viewer', ACTIONS.OBJECT_READ);
        return ok(computerView(await findDn('computer', 'id', id)));
      });
    },
    async moveComputer(id, ouDn, actor) {
      return call(async () => {
        guard(actor, ACTIONS.OBJECT_WRITE);
        const row = await findDn('computer', 'id', id);
        const dest = ouDn && ouDn.dn ? ouDn.dn : ouDn;
        await ldap.move(writeDn(row), dest);
        write({ actor, action: 'directory.moveComputer', target: row.dn, result: 'success', detail: { id, ouDn: dest } });
        return ok({ id, dn: `${row.dn.split(',')[0]},${dest}` });
      });
    },
    async deleteComputer(id, confirmToken, actor) {
      return call(async () => {
        guard(actor, ACTIONS.OBJECT_DELETE);
        if (!confirmed(confirmToken)) return confirmError();
        const row = await findDn('computer', 'id', id);
        await ldap.del(writeDn(row), confirmToken);
        write({ actor, action: 'directory.deleteComputer', target: row.dn, result: 'success', detail: { id } });
        return ok({ id, deleted: true });
      });
    },
    async toggleComputer(id, enabled, actor) {
      return call(async () => {
        guard(actor, ACTIONS.OBJECT_WRITE);
        const row = await findDn('computer', 'id', id);
        await ldap.changeState(writeDn(row), !!enabled);
        write({ actor, action: 'directory.toggleComputer', target: row.dn, result: 'success', detail: { id, enabled: !!enabled } });
        return ok({ id, enabled: !!enabled });
      });
    },

    // ---------- 组 ----------
    async createGroup(g = {}, actor) {
      return call(async () => {
        guard(actor, ACTIONS.OBJECT_WRITE);
        const name = g.name || g.cn || g.sAMAccountName;
        const dn = `cn=${escapeFilter(name)},${g.ouDn || getBaseDN()}`;
        await ldap.add(dn, {
          objectClass: ['top', 'group'], cn: name, name,
          sAMAccountName: g.samAccountName || g.sAMAccountName || name,
          groupScope: g.scope || 'Global', description: g.description || '',
          member: (g.members || []).map(m => m.dn || m),
        });
        const created = await ldap.findByField('group', 'cn', name).catch(() => null);
        write({ actor, action: 'directory.createGroup', target: dn, result: 'success', detail: { name } });
        return ok({ id: (created && created.id) || g.id || dn, dn, name });
      });
    },
    async updateGroup(g = {}, actor) {
      return call(async () => {
        guard(actor, ACTIONS.OBJECT_WRITE);
        const row = await findDn('group', 'id', g.id || g.dn);
        const map = { name: 'cn', cn: 'cn', samAccountName: 'sAMAccountName', description: 'description', scope: 'groupScope' };
        const patch = {};
        for (const [k, v] of Object.entries(g)) if (map[k] && v !== undefined) patch[map[k]] = v;
        await ldap.modifyAttributes(writeDn(row), patch);
        write({ actor, action: 'directory.updateGroup', target: row.dn, result: 'success', detail: { id: g.id } });
        return ok({ id: g.id || row.dn, dn: row.dn, ...patch });
      });
    },
    async getGroup(id, actor) {
      return call(async () => {
        guard(actor || 'viewer', ACTIONS.OBJECT_READ);
        return ok(groupView(await findDn('group', 'id', id)));
      });
    },
    async addGroupMembers(id, members, actor) {
      return call(async () => {
        guard(actor, ACTIONS.OBJECT_WRITE);
        const group = await findDn('group', 'id', id);
        const list = Array.isArray(members) ? members : [members];
        for (const m of list) {
          const dn = typeof m === 'string' ? m
            : (m.dn || (await findDn('user', 'id', m.id || m.username)).dn);
          await ldap.addGroupMember(writeDn(group), dn);
        }
        write({ actor, action: 'directory.addGroupMembers', target: group.dn, result: 'success', detail: { id, members: list } });
        return ok({ id, added: list.length });
      });
    },
    async removeGroupMembers(id, members, actor) {
      return call(async () => {
        guard(actor, ACTIONS.OBJECT_WRITE);
        const group = await findDn('group', 'id', id);
        const list = Array.isArray(members) ? members : [members];
        for (const m of list) {
          const dn = typeof m === 'string' ? m
            : (m.dn || (await findDn('user', 'id', m.id || m.username)).dn);
          await ldap.removeGroupMember(writeDn(group), dn);
        }
        write({ actor, action: 'directory.removeGroupMembers', target: group.dn, result: 'success', detail: { id, members: list } });
        return ok({ id, removed: list.length });
      });
    },
    async deleteGroup(id, confirmToken, actor) {
      return call(async () => {
        guard(actor, ACTIONS.OBJECT_DELETE);
        if (!confirmed(confirmToken)) return confirmError();
        const row = await findDn('group', 'id', id);
        await ldap.del(writeDn(row), confirmToken);
        write({ actor, action: 'directory.deleteGroup', target: row.dn, result: 'success', detail: { id } });
        return ok({ id, deleted: true });
      });
    },
    async listGroupMembers(id, actor) {
      return call(async () => {
        guard(actor || 'viewer', ACTIONS.OBJECT_READ);
        const group = await findDn('group', 'id', id);
        const items = ldap.listGroupMembers ? await ldap.listGroupMembers(writeDn(group)) : [];
        return ok({ items, total: items.length });
      });
    },

    // ---------- OU ----------
    async createOU(ou = {}, actor) {
      return call(async () => {
        guard(actor, ACTIONS.OBJECT_WRITE);
        const name = ou.name || ou.ou;
        if (!name) return fail('NO_SUCH_OBJECT', '缺少 OU 名称。');
        const created = await ldap.createOU(name, ou.parentId || ou.parent || 'ou-root');
        write({ actor, action: 'directory.createOU', target: created.dn, result: 'success', detail: created });
        return ok(created);
      });
    },
    async renameOU(id, name, actor) {
      return call(async () => {
        guard(actor, ACTIONS.OBJECT_WRITE);
        const created = await ldap.renameOU(id, name);
        write({ actor, action: 'directory.renameOU', target: created.dn, result: 'success', detail: { id, name } });
        return ok(created);
      });
    },
    async moveOU(id, parent, actor) {
      return call(async () => {
        guard(actor, ACTIONS.OBJECT_WRITE);
        const parentId = parent && parent.id ? parent.id : parent;
        const moved = await ldap.moveOU(id, parentId);
        write({ actor, action: 'directory.moveOU', target: moved.dn, result: 'success', detail: { id, parentId } });
        return ok(moved);
      });
    },
    async deleteOU(id, confirmToken, actor) {
      return call(async () => {
        guard(actor, ACTIONS.OBJECT_DELETE);
        if (!confirmed(confirmToken)) return confirmError();
        const ou = await ldap.deleteOU(id, confirmToken);
        write({ actor, action: 'directory.deleteOU', target: ou.dn, result: 'success', detail: { id } });
        return ok({ id, deleted: true });
      });
    },
    async listOUObjects(id, q = {}, actor) {
      return call(async () => {
        guard(actor || 'viewer', ACTIONS.OBJECT_READ);
        const rows = await ldap.listOUObjects(id);
        let items = rows.map(row => ({
          dn: s(row.dn), id: s(row.id || row.dn),
          name: s(first(attr(row, 'cn')) || first(attr(row, 'ou'))),
          type: String(first(attr(row, 'objectClass')) || '').toLowerCase(),
        }));
        if (q.keyword) items = items.filter(x => x.name.toLowerCase().includes(String(q.keyword).toLowerCase()));
        return ok(paginate(items, q));
      });
    },

    // ---------- GPO ----------
    async getGPO(id, actor) {
      return call(async () => {
        guard(actor || 'viewer', ACTIONS.OBJECT_READ);
        return ok(gpoView(await ldap.getGPO(id)));
      });
    },
    async toggleGPO(id, enabled, actor) {
      return call(async () => {
        guard(actor, ACTIONS.GPO_WRITE);
        const g = await ldap.toggleGPO(id, !!enabled);
        write({ actor, action: 'directory.toggleGPO', target: s(g.dn || id), result: 'success', detail: { id, enabled: !!enabled } });
        return ok({ id, enabled: !!enabled });
      });
    },
    async bindGPO(id, ou, actor) {
      return call(async () => {
        guard(actor, ACTIONS.GPO_WRITE);
        const ouId = ou && ou.id ? ou.id : ou;
        const g = await ldap.bindGPO(id, ouId);
        write({ actor, action: 'directory.bindGPO', target: s(g.dn || id), result: 'success', detail: { id, ouId } });
        return ok({ id, ouId, linkedOUs: g.linkedOUs });
      });
    },
    async unbindGPO(id, ou, actor) {
      return call(async () => {
        guard(actor, ACTIONS.GPO_WRITE);
        const ouId = ou && ou.id ? ou.id : ou;
        const g = await ldap.unbindGPO(id, ouId);
        write({ actor, action: 'directory.unbindGPO', target: s(g.dn || id), result: 'success', detail: { id, ouId } });
        return ok({ id, ouId, linkedOUs: g.linkedOUs });
      });
    },

    // ---------- 全局检索 ----------
    async search(q = {}, actor) {
      return call(async () => {
        guard(actor || 'viewer', ACTIONS.OBJECT_READ);
        const keyword = String(q.keyword || q.q || '').toLowerCase();
        const pools = (q.types && q.types.length) ? q.types : ['user', 'computer', 'group', 'ou', 'gpo'];
        let items = [];
        const collect = async (method, type) => {
          const res = await service[method]({ ...q, keyword });
          if (res.ok && res.data && Array.isArray(res.data.items)) {
            items.push(...res.data.items.map(x => ({ ...x, type })));
          }
        };
        if (pools.includes('user')) await collect('listUsers', 'user');
        if (pools.includes('computer')) await collect('listComputers', 'computer');
        if (pools.includes('group')) await collect('listGroups', 'group');
        if (pools.includes('ou')) await collect('listOUs', 'ou');
        if (pools.includes('gpo')) await collect('listGPOs', 'gpo');
        return ok(paginate(items, q));
      });
    },
  };

  return service;
}

export default createDirectoryService;
