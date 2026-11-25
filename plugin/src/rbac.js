// src/rbac.js — 角色权限校验（ARCHITECTURE.md 2.5）
// viewer 只读；operator 对象增删改但不含重置密码/删除/GPO 绑定；admin 全部。

export const ROLES = Object.freeze({ VIEWER: 'viewer', OPERATOR: 'operator', ADMIN: 'admin' });

export const ACTIONS = Object.freeze({
  CONFIG_READ: 'config.read', CONFIG_WRITE: 'config.write',
  OBJECT_READ: 'object.read', OBJECT_WRITE: 'object.write', OBJECT_DELETE: 'object.delete',
  PASSWORD_RESET: 'password.reset', GPO_WRITE: 'gpo.write',
  AUDIT_READ: 'audit.read', MARKET_READ: 'market.read', MARKET_UPDATE: 'market.update',
  PLUGIN_UPDATE: 'plugin.update',
});

export const ROLE_LABELS = Object.freeze({ viewer: '只读观察者', operator: '操作员', admin: '管理员' });

export const ACTION_LABELS = Object.freeze({
  'config.read': '查看连接配置', 'config.write': '修改连接配置',
  'object.read': '查看域对象', 'object.write': '新增或修改域对象', 'object.delete': '删除域对象',
  'password.reset': '重置用户密码', 'gpo.write': '管理 GPO 绑定与状态',
  'audit.read': '查看审计日志', 'market.read': '查看市场',
  'market.update': '安装或更新市场插件', 'plugin.update': '更新插件',
});

// 权限矩阵：viewer 仅读；operator 可写对象但不可删除/重置密码/改 GPO/改配置；admin 全部
const MATRIX = Object.freeze({
  viewer: new Set([ACTIONS.CONFIG_READ, ACTIONS.OBJECT_READ, ACTIONS.AUDIT_READ, ACTIONS.MARKET_READ]),
  operator: new Set([ACTIONS.CONFIG_READ, ACTIONS.OBJECT_READ, ACTIONS.OBJECT_WRITE, ACTIONS.AUDIT_READ, ACTIONS.MARKET_READ]),
  admin: new Set(Object.values(ACTIONS)),
});

export class RbacError extends Error {
  constructor(role, action) {
    super(`权限不足：角色「${ROLE_LABELS[role] || role || '未知'}」无权执行「${ACTION_LABELS[action] || action}」操作。`);
    this.name = 'RbacError';
    this.code = 'INSUFFICIENT_ACCESS';
    this.role = role;
    this.action = action;
  }
}

export function can(role, action) { return !!(MATRIX[role] && MATRIX[role].has(action)); }

export function assert(role, action) { if (!can(role, action)) throw new RbacError(role, action); return true; }

export function actionsOf(role) { return [...(MATRIX[role] || [])]; }

export function createRbac(options = {}) {
  const defaultRole = options.defaultRole || ROLES.VIEWER;
  return {
    ROLES, ACTIONS, ROLE_LABELS, ACTION_LABELS,
    roles: Object.values(ROLES),
    actions: Object.values(ACTIONS),
    can(role, action) { return can(role || defaultRole, action); },
    assert(role, action) { return assert(role || defaultRole, action); },
    actionsOf(role) { return actionsOf(role || defaultRole); },
  };
}

export default createRbac;
