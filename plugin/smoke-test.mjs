/** 端到端冒烟测试：Node 环境直接调用 Host 集成层，mock 驱动跑通全部命令 */
process.env.LDAP_CLIENT_DRIVER = 'mock'
process.env.MARKET_MOCK = '1'
process.env.DSL_AD_DATA_DIR = process.env.DSL_AD_DATA_DIR || undefined

import { apply } from './index.js'
import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'

// 用临时数据目录，避免污染插件包
const testDir = fs.mkdtempSync(path.join(os.tmpdir(), 'dm-test-'))
process.env.DSL_AD_DATA_DIR = testDir

const effects = []
const ctx = {
  effect(fn) { const d = fn(); effects.push(d); return d },
  logger: { info() {}, warn() {}, error() {} },
}
console.log('BOOT: creating plugin')
const plugin = apply(ctx, {})
console.log('BOOT: plugin created')
const call = (cmd, params = {}) => {
  console.log('CALL:', cmd)
  return plugin.execute(cmd, { ...params, actor: params.actor || { role: 'admin', name: 'tester' } })
}

let pass = 0, failCount = 0
function check(name, cond, extra) {
  if (cond) { pass++; console.log('  PASS', name) }
  else { failCount++; console.log('  FAIL', name, extra ? JSON.stringify(extra) : '') }
}

const r = (x) => x

console.log('\n== 1. 域配置 ==')
let res = await call('domainConfig.list')
check('list 初始为空', res.ok && Array.isArray(res.data) && res.data.length === 0, res)
const cfg = { id: 'd1', name: '演示域', host: 'dc.example.com', port: 389, ssl: false, tls: false, bindDN: 'cn=admin,dc=example,dc=com', bindPassword: 'Secret@123', baseDN: 'dc=example,dc=com', timeout: 5000, pageSize: 100 }
res = await call('domainConfig.save', { config: cfg })
check('保存域配置', res.ok, res)
res = await call('domainConfig.list')
check('读取配置返回还原密码', res.ok && res.data[0].bindPassword === 'Secret@123', res)
const raw = fs.readFileSync(path.join(testDir, 'configs.json'), 'utf8')
check('明文密码未落盘（密文密封）', !raw.includes('Secret@123') && raw.includes('v1:'), { raw: raw.slice(0, 400) })
res = await call('domainConfig.get', { id: 'd1' })
check('读取时密码还原', res.ok && res.data.bindPassword === 'Secret@123', res)
res = await call('domainConfig.test', cfg)
check('测试连接成功', res.ok && res.data.connected === true, res)
res = await call('domainConfig.setActive', { id: 'd1' })
check('设置当前域', res.ok, res)

console.log('\n== 2. 域对象列表（分页/搜索）==')
for (const [name, cmd] of [['用户', 'directory.listUsers'], ['计算机', 'directory.listComputers'], ['组', 'directory.listGroups'], ['OU', 'directory.listOUs'], ['GPO', 'directory.listGPOs']]) {
  res = await call(cmd, { page: 1, pageSize: 10 })
  check(`${name}列表`, res.ok && res.data.total > 0 && Array.isArray(res.data.items), res)
}
res = await call('directory.listUsers', { keyword: '张三', page: 1, pageSize: 10 })
check('用户模糊搜索命中张三', res.ok && res.data.items.some(x => x.username === 'zhangsan'), res)
res = await call('directory.listUsers', { filters: { enabled: false }, page: 1, pageSize: 10 })
check('条件筛选禁用用户', res.ok && res.data.items.some(x => x.enabled === false), res)
res = await call('directory.listUsers', { page: 1, pageSize: 2 })
check('分页 pageSize=2', res.ok && res.data.items.length === 2 && res.data.total === 3, res)

console.log('\n== 3. 用户 CRUD / 密码 / 状态 ==')
res = await call('directory.createUser', { name: '测试用户', username: 'testuser', email: 'test@example.com', ouDn: 'ou=信息技术部,ou=总部,dc=example,dc=com' })
check('新建用户', res.ok, res)
const newUid = res.data && res.data.id
res = await call('directory.resetPassword', { id: newUid, password: 'NewPass@123' })
check('重置密码需二次确认', !res.ok && res.error.code === 'CONFIRM_REQUIRED', res)
res = await call('directory.resetPassword', { id: newUid, password: 'NewPass@123', confirmToken: 'CONFIRMED' })
check('重置密码成功', res.ok && res.data.changed === true, res)
res = await call('directory.toggleUser', { id: newUid, enabled: false })
check('禁用用户', res.ok && res.data.enabled === false, res)
res = await call('directory.unlockUser', { id: 'u-lisi' })
check('解锁用户', res.ok && res.data.unlocked === true, res)
res = await call('directory.moveUser', { id: newUid, ouDn: 'ou=分支机构,dc=example,dc=com' })
check('移动用户 OU', res.ok, res)
res = await call('directory.getUserGroups', { id: 'u-zhangsan' })
check('查看用户所属组', res.ok && res.data.total >= 2, res)
res = await call('directory.deleteUser', { id: newUid })
check('删除用户需二次确认', !res.ok && res.error.code === 'CONFIRM_REQUIRED', res)
res = await call('directory.deleteUser', { id: newUid, confirmToken: 'CONFIRMED' })
check('删除用户成功', res.ok && res.data.deleted === true, res)

console.log('\n== 4. 计算机 / 组 / OU / GPO ==')
res = await call('directory.createComputer', { name: 'PC-99', dnsHostName: 'pc99.example.com', operatingSystem: 'Windows 11' })
check('新建计算机', res.ok, res)
const cid = res.data && res.data.id
res = await call('directory.toggleComputer', { id: cid, enabled: false })
check('禁用计算机', res.ok, res)
res = await call('directory.deleteComputer', { id: cid, confirmToken: 'CONFIRMED' })
check('删除计算机', res.ok, res)
res = await call('directory.createGroup', { name: '测试组', scope: 'Global' })
check('新建组', res.ok, res)
const gid = res.data && res.data.id
res = await call('directory.addGroupMembers', { id: gid, members: ['cn=张三,ou=信息技术部,ou=总部,dc=example,dc=com'] })
check('添加组成员', res.ok && res.data.added === 1, res)
res = await call('directory.listGroupMembers', { id: gid })
check('查看组成员', res.ok && res.data.total === 1, res)
res = await call('directory.removeGroupMembers', { id: gid, members: ['cn=张三,ou=信息技术部,ou=总部,dc=example,dc=com'] })
check('移除组成员', res.ok, res)
res = await call('directory.deleteGroup', { id: gid, confirmToken: 'CONFIRMED' })
check('删除组', res.ok, res)
res = await call('directory.createOU', { name: '新部门', parentId: 'ou-root' })
check('新建 OU', res.ok, res)
const oid = res.data && res.data.id
res = await call('directory.renameOU', { id: oid, name: '新部门2' })
check('重命名 OU', res.ok, res)
res = await call('directory.listOUObjects', { id: 'ou-it', page: 1, pageSize: 20 })
check('查看 OU 下对象', res.ok && res.data.total > 0, res)
res = await call('directory.deleteOU', { id: oid, confirmToken: 'CONFIRMED' })
check('删除 OU', res.ok, res)
res = await call('directory.toggleGPO', { id: 'gpo-usb', enabled: true })
check('启用 GPO', res.ok && res.data.enabled === true, res)
res = await call('directory.bindGPO', { id: 'gpo-usb', ou: 'ou-hq' })
check('绑定 GPO', res.ok && res.data.linkedOUs.includes('ou-hq'), res)
res = await call('directory.unbindGPO', { id: 'gpo-usb', ou: 'ou-hq' })
check('解绑 GPO', res.ok && !res.data.linkedOUs.includes('ou-hq'), res)
res = await call('directory.getGPO', { id: 'gpo-pwd' })
check('GPO 详情', res.ok && res.data.name === '全局密码策略', res)

console.log('\n== 5. 全局检索 / 审计 ==')
res = await call('directory.search', { keyword: '财务', page: 1, pageSize: 20 })
check('全局检索命中', res.ok && res.data.total > 0, res)
res = await call('audit.list', { page: 1, pageSize: 5 })
check('审计日志有记录', res.ok && res.data.total > 5 && res.data.items.length === 5, res)

console.log('\n== 6. RBAC 权限隔离 ==')
res = await call('directory.deleteUser', { id: 'u-wangwu', confirmToken: 'CONFIRMED', actor: { role: 'viewer', name: 'viewer1' } })
check('viewer 无删除权限', !res.ok && res.error.code === 'INSUFFICIENT_ACCESS', res)
res = await call('directory.resetPassword', { id: 'u-wangwu', password: 'Abcd@12345', confirmToken: 'CONFIRMED', actor: { role: 'operator', name: 'op1' } })
check('operator 无重置密码权限', !res.ok && res.error.code === 'INSUFFICIENT_ACCESS', res)
res = await call('rbac.can', { action: 'market.read', actor: { role: 'viewer' } })
check('viewer 可查看市场', res.ok && res.data === true, res)
res = await call('rbac.can', { action: 'plugin.update', actor: { role: 'viewer' } })
check('viewer 不可更新插件', res.ok && res.data === false, res)

console.log('\n== 7. 市场 / 更新 / 回滚 ==')
res = await call('market.detail')
check('市场详情', res.ok && !!res.data.name, res)
res = await call('market.versions')
check('版本历史', res.ok && res.data.total >= 2, res)
res = await call('market.checkUpdate')
check('检查更新', res.ok && typeof res.data.hasUpdate === 'boolean', res)
res = await call('market.getLicense')
check('授权状态', res.ok && res.data.localUsable === true, res)
res = await call('market.setChannel', { channel: 'gray' })
check('切换灰度渠道', res.ok && res.data.channel === 'gray', res)
res = await call('market.update', { version: '1.1.0' })
check('更新需二次确认', !res.ok && res.error.code === 'CONFIRM_REQUIRED', res)
res = await call('market.update', { version: '1.1.0', confirmToken: 'CONFIRMED' })
check('在线更新成功', res.ok && res.data.updated === true, res)
check('更新前已备份', !!res.data.backupPath && fs.existsSync(res.data.backupPath), res)
res = await call('market.rollback')
check('回滚成功', res.ok && res.data.rolledBack === true, res)
res = await call('market.operations', { page: 1, pageSize: 20 })
check('操作记录', res.ok && res.data.total >= 3, res)

console.log(`\n=== 汇总：PASS=${pass} FAIL=${failCount} ===`)
effects.forEach(d => { try { if (typeof d === 'function') d() } catch {} })
fs.rmSync(testDir, { recursive: true, force: true })
process.exit(failCount ? 1 : 0)
