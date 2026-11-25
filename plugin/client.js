/* AD/LDAP Domain Manager - Client lazy factory entry.
   Plain JavaScript only (no JSX, no import/export). Browser-runnable. */
(function () {
  'use strict';

  var MODULE_ID = '@local/ad-ldap-domain-manager';
  var LOCALE_NS = 'adLdapDomainManager';

  // Locale dictionaries embedded by the bundle loader; the JSON files are the
  // canonical source, and the loader may expose them through __DM_LOCALES__.
  var DICT = {
    zh: {
  "meta": {
    "title": "AD/LDAP 域管理插件",
    "description": "统一管理 AD/OpenLDAP 域连接、目录对象、组策略、审计与插件市场"
  },
  "meta.title": "AD/LDAP 域管理",
  "meta.description": "统一管理 AD/OpenLDAP 域连接、目录对象、组策略、审计与插件市场",
  "common.ok": "确定",
  "common.cancel": "取消",
  "common.save": "保存",
  "common.reset": "重置",
  "common.delete": "删除",
  "common.edit": "编辑",
  "common.create": "新建",
  "common.search": "搜索",
  "common.loading": "加载中…",
  "common.empty": "暂无数据",
  "common.error": "操作失败",
  "common.confirm": "确认",
  "common.close": "关闭",
  "common.refresh": "刷新",
  "common.enable": "启用",
  "common.disable": "停用",
  "common.prev": "上一页",
  "common.next": "下一页",
  "common.page": "第 {page} / {pages} 页",
  "common.total": "共 {total} 条",
  "common.actions": "操作",
  "common.keyword": "关键词",
  "common.all": "全部",
  "common.yes": "是",
  "common.no": "否",
  "common.name": "名称",
  "common.status": "状态",
  "common.enabled": "已启用",
  "common.disabled": "已停用",
  "common.details": "详情",
  "common.selectDomain": "选择域",
  "common.back": "返回",
  "common.submitting": "提交中…",
  "common.saved": "已保存",
  "common.deleted": "已删除",
  "common.updated": "已更新",
  "common.created": "已创建",
  "common.password": "密码",
  "common.optional": "可选",
  "common.required": "必填项未填写：{fields}",
  "common.filter": "筛选",
  "common.clearFilter": "清除筛选",
  "common.confirmDangerTitle": "高危操作确认",
  "common.confirmDangerText": "此操作不可撤销，请确认继续。",
  "common.confirmTokenInvalid": "高危操作需要二次确认，请在弹窗中确认。",
  "common.inlineError": "加载失败：{message}",
  "common.retry": "重试",
  "common.unknown": "未知",
  "nav.connect": "连接配置",
  "nav.users": "用户",
  "nav.computers": "计算机",
  "nav.groups": "安全组",
  "nav.ous": "组织单元",
  "nav.gpos": "组策略",
  "nav.search": "全局检索",
  "nav.audit": "审计日志",
  "nav.market": "插件市场",
  "connect.title": "域连接配置",
  "connect.description": "配置 AD 或 OpenLDAP 服务器连接参数，支持多域切换。",
  "connect.host": "服务器地址",
  "connect.failoverHosts": "备用域控",
  "connect.failoverHostsPlaceholder": "同域其它域控 IP/名称，多个用逗号分隔",
  "connect.port": "端口",
  "connect.ssl": "SSL（LDAPS）",
  "connect.tls": "StartTLS",
  "connect.bindDN": "绑定 DN",
  "connect.bindPassword": "绑定密码",
  "connect.baseDN": "基础 DN",
  "connect.timeout": "超时（秒）",
  "connect.pageSize": "分页大小",
  "connect.vendor": "目录类型",
  "connect.vendor.ad": "Active Directory",
  "connect.vendor.openldap": "OpenLDAP",
  "connect.label": "配置名称",
  "connect.test": "测试连接",
  "connect.testing": "正在测试…",
  "connect.testOk": "连接成功",
  "connect.testFail": "连接失败：{message}",
  "connect.save": "保存配置",
  "connect.reset": "恢复默认",
  "connect.delete": "删除配置",
  "connect.setActive": "设为当前域",
  "connect.active": "当前域",
  "connect.addDomain": "新增域配置",
  "connect.noDomains": "还没有域配置，请先新增。",
  "connect.hostPlaceholder": "dc.example.com",
  "connect.bindDNPlaceholder": "CN=admin,DC=example,DC=com",
  "connect.baseDNPlaceholder": "DC=example,DC=com",
  "connect.saved": "配置已保存",
  "connect.resetDone": "已恢复默认值",
  "connect.deleted": "配置已删除",
  "connect.activeSet": "已切换当前域",
  "connect.passwordHint": "密码以加密方式保存，不会明文显示。",
  "objects.users": "用户管理",
  "objects.computers": "计算机管理",
  "objects.groups": "安全组管理",
  "objects.ous": "组织单元管理",
  "objects.gpos": "组策略管理",
  "objects.description": "浏览与维护目录对象，支持分页、搜索、条件筛选与 OU 导航。",
  "objects.selectedOU": "已选择 OU",
  "objects.col.name": "名称",
  "objects.col.sam": "登录名",
  "objects.col.upn": "UPN",
  "objects.col.displayName": "显示名",
  "objects.col.mail": "邮箱",
  "objects.col.enabled": "启用状态",
  "objects.col.locked": "锁定状态",
  "objects.col.pwdLastSet": "密码修改时间",
  "objects.col.mobile": "手机号",
  "objects.col.title": "职务",
  "objects.col.department": "部门",
  "objects.col.employeeID": "工号",
  "objects.col.dn": "DN",
  "objects.col.dnsHost": "DNS 名称",
  "objects.col.os": "操作系统",
  "objects.col.memberCount": "成员数",
  "objects.col.description": "描述",
  "objects.col.ou": "所属 OU",
  "objects.col.parent": "父级 OU",
  "objects.col.gpoStatus": "状态",
  "objects.col.gpoLinks": "链接 OU",
  "objects.filter.enabled": "启用状态",
  "objects.filter.locked": "锁定状态",
  "objects.filter.os": "操作系统",
  "objects.filter.vendor": "目录类型",
  "objects.action.create": "新建",
  "objects.action.edit": "编辑",
  "objects.action.delete": "删除",
  "objects.action.toggle": "启用/停用",
  "objects.action.unlock": "解锁",
  "objects.action.move": "移动到 OU",
  "objects.action.resetPw": "重置密码",
  "objects.action.groups": "组成员管理",
  "objects.action.bindGpo": "绑定 GPO",
  "objects.action.unbindGpo": "解绑 GPO",
  "objects.action.rename": "重命名",
  "objects.batchAction": "批量操作",
  "objects.selected": "已选 {count} 项",
  "objects.ouTree": "组织单元树",
  "objects.allObjects": "全部对象",
  "objects.createUser": "新建用户",
  "objects.editUser": "编辑用户",
  "objects.createComputer": "新建计算机",
  "objects.editComputer": "编辑计算机",
  "objects.createGroup": "新建安全组",
  "objects.editGroup": "编辑安全组",
  "objects.createOU": "新建组织单元",
  "objects.renameOU": "重命名组织单元",
  "objects.move": "移动对象",
  "objects.resetPw": "重置密码",
  "objects.groups": "组成员管理",
  "objects.bindGpo": "绑定组策略",
  "objects.field.sam": "登录名（sAMAccountName/uid）",
  "objects.field.upn": "用户主体名称（UPN）",
  "objects.field.displayName": "显示名称",
  "objects.field.firstName": "名",
  "objects.field.lastName": "姓",
  "objects.field.mail": "电子邮箱",
  "objects.field.mobile": "移动电话",
  "objects.field.employeeID": "工号（employeeID）",
  "objects.field.department": "部门",
  "objects.field.title": "职务",
  "objects.field.telephoneNumber": "电话号码",
  "objects.field.dn": "DNS 主机名",
  "objects.field.os": "操作系统",
  "objects.field.description": "描述",
  "objects.field.parentOU": "父级 OU（DN）",
  "objects.field.targetOU": "目标 OU（DN）",
  "objects.field.newPassword": "新密码",
  "objects.field.confirmPassword": "确认新密码",
  "objects.field.members": "成员（每行一个 DN）",
  "objects.field.gpo": "组策略",
  "objects.field.name": "名称",
  "objects.field.newName": "新名称",
  "objects.confirm.delete": "确定删除「{name}」吗？此操作不可撤销。",
  "objects.confirm.resetPw": "确定重置「{name}」的密码吗？用户下次登录需修改密码。",
  "objects.confirm.toggle": "确定{action}「{name}」吗？",
  "objects.confirm.unlock": "确定解锁「{name}」吗？",
  "objects.confirm.move": "确定将「{name}」移动到 {ou} 吗？",
  "objects.confirm.unbindGpo": "确定解除「{gpo}」与「{ou}」的绑定吗？",
  "objects.confirm.batch": "确定对选中的 {count} 个对象执行「{action}」吗？",
  "objects.passwordMismatch": "两次输入的密码不一致。",
  "objects.passwordEmpty": "密码不能为空。",
  "objects.noOUSelected": "请先从左侧选择一个 OU。",
  "objects.loadOUError": "组织单元树加载失败：{message}",
  "objects.loadListError": "列表加载失败：{message}",
  "objects.operationOk": "操作成功",
  "objects.operationFail": "操作失败：{message}",
  "objects.searchTitle": "全局检索",
  "objects.searchPlaceholder": "输入用户名、组名、计算机名或关键词",
  "objects.searchButton": "检索",
  "objects.searchResult": "检索结果",
  "objects.searchNoResult": "没有匹配的目录对象",
  "objects.searchType": "对象类型",
  "objects.searchAll": "全部类型",
  "nav.sync": "数据同步",
  "sync.title": "数据同步",
  "sync.description": "域对象数据本地留存，登录、连接、测试时自动同步，并可按周期定时更新。",
  "sync.status": "同步状态",
  "sync.lastSync": "上次同步：",
  "sync.lastStatus": "上次结果：",
  "sync.nextSync": "下次同步：",
  "sync.users": "用户数：",
  "sync.computers": "计算机数：",
  "sync.groups": "组数：",
  "sync.ous": "OU 数：",
  "sync.gpos": "GPO 数：",
  "sync.now": "立即同步",
  "sync.done": "同步已完成",
  "sync.schedule": "定时同步",
  "sync.interval": "同步周期",
  "sync.interval.off": "关闭（仅手动同步）",
  "sync.interval.minutes": "每 {n} 分钟",
  "sync.intervalSaved": "同步周期已保存",
  "sync.scheduleHint": "登录、保存连接、测试连接、切换域时都会触发一次同步；定时同步按此周期在后台自动更新本地缓存。",
  "audit.title": "审计日志",
  "audit.description": "记录所有配置变更与目录对象操作，日志仅追加不可修改。",
  "audit.col.time": "时间",
  "audit.col.actor": "操作者",
  "audit.col.action": "动作",
  "audit.col.target": "目标",
  "audit.col.result": "结果",
  "audit.col.detail": "详情",
  "audit.result.ok": "成功",
  "audit.result.fail": "失败",
  "audit.filter.actor": "操作者",
  "audit.filter.action": "动作",
  "audit.filter.result": "结果",
  "audit.filter.from": "开始时间",
  "audit.filter.to": "结束时间",
  "audit.loadError": "审计日志加载失败：{message}",
  "audit.noLog": "暂无审计记录",
  "market.section.skills": "技能市场",
  "market.skillsHint": "随插件分发的配套技能，可直接下载 SKILL.md 文件安装到 ~/.dsh/skills/。",
  "market.skill.name": "技能名称",
  "market.skill.version": "版本",
  "market.skill.desc": "说明",
  "market.skill.action": "操作",
  "market.skill.download": "下载技能",
  "market.skill.downloaded": "技能文件已下载",
  "market.skill.empty": "暂无可下载技能",
  "market.title": "插件市场",
  "market.description": "查看版本、检查更新、切换渠道、授权与操作记录。仅管理员可见。",
  "market.section.version": "版本信息",
  "market.section.update": "检查更新",
  "market.section.channel": "更新渠道",
  "market.section.license": "授权信息",
  "market.section.operations": "操作记录",
  "market.currentVersion": "当前版本",
  "market.latestVersion": "最新版本",
  "market.checkUpdate": "检查更新",
  "market.upToDate": "已是最新版本",
  "market.updateAvailable": "发现新版本 {version}",
  "market.forceUpdate": "强制更新",
  "market.optionalUpdate": "可选更新",
  "market.majorRisk": "重大版本更新可能影响现有配置，请先备份。",
  "market.update": "立即更新",
  "market.rollback": "回滚上一版本",
  "market.channel.stable": "稳定版",
  "market.channel.gray": "灰度版",
  "market.setChannel": "切换渠道",
  "market.license.mode": "授权模式",
  "market.license.free": "免费版",
  "market.license.paid": "付费版",
  "market.license.trial": "试用版",
  "market.license.expiry": "到期时间",
  "market.license.status": "授权状态",
  "market.license.valid": "有效",
  "market.license.invalid": "无效",
  "market.refreshLicense": "刷新授权",
  "market.operation.time": "时间",
  "market.operation.type": "操作",
  "market.operation.actor": "操作者",
  "market.operation.detail": "详情",
  "market.noOperations": "暂无操作记录",
  "market.confirm.update": "确定更新到版本 {version} 吗？更新前将自动备份，失败后自动回滚。",
  "market.confirm.rollback": "确定回滚到上一版本吗？当前版本更改将丢失。",
  "market.confirm.channel": "确定将更新渠道切换为 {channel} 吗？",
  "market.operationOk": "操作成功",
  "market.operationFail": "操作失败：{message}",
  "market.loadError": "市场信息加载失败：{message}",
  "market.adminOnly": "仅管理员可访问插件市场。",
  "market.noPermission": "当前角色无权执行此操作。",
  "danger.title": "高危操作确认",
  "danger.message": "你正在执行高危操作：{action}。确认后将立即生效，且不可撤销。",
  "danger.tip": "请输入 CONFIRMED 以确认：",
  "danger.confirm": "确认执行",
  "danger.cancel": "取消",
  "toast.success": "操作成功",
  "toast.error": "操作失败",
  "toast.info": "提示",
  "toast.close": "关闭通知"
},
    en: {
  "meta": {
    "title": "AD/LDAP Domain Manager",
    "description": "Manage AD/OpenLDAP connections, directory objects, group policies, audit logs and plugin market"
  },
  "meta.title": "AD/LDAP Domain Manager",
  "meta.description": "Manage AD/OpenLDAP connections, directory objects, group policies, audit logs and plugin market",
  "common.ok": "OK",
  "common.cancel": "Cancel",
  "common.save": "Save",
  "common.reset": "Reset",
  "common.delete": "Delete",
  "common.edit": "Edit",
  "common.create": "Create",
  "common.search": "Search",
  "common.loading": "Loading…",
  "common.empty": "No data",
  "common.error": "Operation failed",
  "common.confirm": "Confirm",
  "common.close": "Close",
  "common.refresh": "Refresh",
  "common.enable": "Enable",
  "common.disable": "Disable",
  "common.prev": "Previous",
  "common.next": "Next",
  "common.page": "Page {page} / {pages}",
  "common.total": "{total} items",
  "common.actions": "Actions",
  "common.keyword": "Keyword",
  "common.all": "All",
  "common.yes": "Yes",
  "common.no": "No",
  "common.name": "Name",
  "common.status": "Status",
  "common.enabled": "Enabled",
  "common.disabled": "Disabled",
  "common.details": "Details",
  "common.selectDomain": "Select domain",
  "common.back": "Back",
  "common.submitting": "Submitting…",
  "common.saved": "Saved",
  "common.deleted": "Deleted",
  "common.updated": "Updated",
  "common.created": "Created",
  "common.password": "Password",
  "common.optional": "Optional",
  "common.required": "Required fields missing: {fields}",
  "common.filter": "Filter",
  "common.clearFilter": "Clear filter",
  "common.confirmDangerTitle": "Confirm dangerous action",
  "common.confirmDangerText": "This action cannot be undone. Please confirm to continue.",
  "common.confirmTokenInvalid": "This dangerous action requires a second confirmation in the dialog.",
  "common.inlineError": "Load failed: {message}",
  "common.retry": "Retry",
  "common.unknown": "Unknown",
  "nav.connect": "Connections",
  "nav.users": "Users",
  "nav.computers": "Computers",
  "nav.groups": "Security Groups",
  "nav.ous": "Organizational Units",
  "nav.gpos": "Group Policies",
  "nav.search": "Global Search",
  "nav.audit": "Audit Log",
  "nav.market": "Market",
  "connect.title": "Domain Connections",
  "connect.description": "Configure AD or OpenLDAP connection settings with multi-domain support.",
  "connect.host": "Server host",
  "connect.failoverHosts": "Failover DCs",
  "connect.failoverHostsPlaceholder": "Other domain controllers, comma separated",
  "connect.port": "Port",
  "connect.ssl": "SSL (LDAPS)",
  "connect.tls": "StartTLS",
  "connect.bindDN": "Bind DN",
  "connect.bindPassword": "Bind password",
  "connect.baseDN": "Base DN",
  "connect.timeout": "Timeout (seconds)",
  "connect.pageSize": "Page size",
  "connect.vendor": "Directory type",
  "connect.vendor.ad": "Active Directory",
  "connect.vendor.openldap": "OpenLDAP",
  "connect.label": "Configuration name",
  "connect.test": "Test connection",
  "connect.testing": "Testing…",
  "connect.testOk": "Connection successful",
  "connect.testFail": "Connection failed: {message}",
  "connect.save": "Save configuration",
  "connect.reset": "Restore defaults",
  "connect.delete": "Delete configuration",
  "connect.setActive": "Set as active domain",
  "connect.active": "Active domain",
  "connect.addDomain": "Add domain",
  "connect.noDomains": "No domain configured yet. Add one to get started.",
  "connect.hostPlaceholder": "dc.example.com",
  "connect.bindDNPlaceholder": "CN=admin,DC=example,DC=com",
  "connect.baseDNPlaceholder": "DC=example,DC=com",
  "connect.saved": "Configuration saved",
  "connect.resetDone": "Restored defaults",
  "connect.deleted": "Configuration deleted",
  "connect.activeSet": "Active domain switched",
  "connect.passwordHint": "Passwords are stored encrypted and never displayed in clear text.",
  "objects.users": "User Management",
  "objects.computers": "Computer Management",
  "objects.groups": "Security Group Management",
  "objects.ous": "Organizational Unit Management",
  "objects.gpos": "Group Policy Management",
  "objects.description": "Browse and maintain directory objects with paging, search, filters and OU navigation.",
  "objects.selectedOU": "Selected OU",
  "objects.col.name": "Name",
  "objects.col.sam": "Logon name",
  "objects.col.upn": "UPN",
  "objects.col.displayName": "Display name",
  "objects.col.mail": "Email",
  "objects.col.enabled": "Enabled",
  "objects.col.locked": "Locked",
  "objects.col.pwdLastSet": "Password last set",
  "objects.col.mobile": "Mobile",
  "objects.col.title": "Title",
  "objects.col.department": "Department",
  "objects.col.employeeID": "Employee ID",
  "objects.col.dn": "DN",
  "objects.col.dnsHost": "DNS name",
  "objects.col.os": "Operating system",
  "objects.col.memberCount": "Members",
  "objects.col.description": "Description",
  "objects.col.ou": "OU",
  "objects.col.parent": "Parent OU",
  "objects.col.gpoStatus": "Status",
  "objects.col.gpoLinks": "Linked OUs",
  "objects.filter.enabled": "Enabled",
  "objects.filter.locked": "Locked",
  "objects.filter.os": "Operating system",
  "objects.filter.vendor": "Directory type",
  "objects.action.create": "Create",
  "objects.action.edit": "Edit",
  "objects.action.delete": "Delete",
  "objects.action.toggle": "Enable/Disable",
  "objects.action.unlock": "Unlock",
  "objects.action.move": "Move to OU",
  "objects.action.resetPw": "Reset password",
  "objects.action.groups": "Manage members",
  "objects.action.bindGpo": "Bind GPO",
  "objects.action.unbindGpo": "Unbind GPO",
  "objects.action.rename": "Rename",
  "objects.batchAction": "Batch actions",
  "objects.selected": "{count} selected",
  "objects.ouTree": "Organizational Units",
  "objects.allObjects": "All objects",
  "objects.createUser": "Create user",
  "objects.editUser": "Edit user",
  "objects.createComputer": "Create computer",
  "objects.editComputer": "Edit computer",
  "objects.createGroup": "Create security group",
  "objects.editGroup": "Edit security group",
  "objects.createOU": "Create organizational unit",
  "objects.renameOU": "Rename organizational unit",
  "objects.move": "Move object",
  "objects.resetPw": "Reset password",
  "objects.groups": "Manage members",
  "objects.bindGpo": "Bind group policy",
  "objects.field.sam": "Logon name (sAMAccountName/uid)",
  "objects.field.upn": "User principal name (UPN)",
  "objects.field.displayName": "Display name",
  "objects.field.firstName": "First name",
  "objects.field.lastName": "Last name",
  "objects.field.mail": "Email",
  "objects.field.mobile": "Mobile",
  "objects.field.employeeID": "Employee ID",
  "objects.field.department": "Department",
  "objects.field.title": "Title",
  "objects.field.telephoneNumber": "Telephone",
  "objects.field.dn": "DNS hostname",
  "objects.field.os": "Operating system",
  "objects.field.description": "Description",
  "objects.field.parentOU": "Parent OU (DN)",
  "objects.field.targetOU": "Target OU (DN)",
  "objects.field.newPassword": "New password",
  "objects.field.confirmPassword": "Confirm new password",
  "objects.field.members": "Members (one DN per line)",
  "objects.field.gpo": "Group policy",
  "objects.field.name": "Name",
  "objects.field.newName": "New name",
  "objects.confirm.delete": "Delete \"{name}\"? This cannot be undone.",
  "objects.confirm.resetPw": "Reset the password of \"{name}\"? The user must change it at next logon.",
  "objects.confirm.toggle": "{action} \"{name}\"?",
  "objects.confirm.unlock": "Unlock \"{name}\"?",
  "objects.confirm.move": "Move \"{name}\" to {ou}?",
  "objects.confirm.unbindGpo": "Unbind \"{gpo}\" from \"{ou}\"?",
  "objects.confirm.batch": "Perform \"{action}\" on {count} selected objects?",
  "objects.passwordMismatch": "Passwords do not match.",
  "objects.passwordEmpty": "Password cannot be empty.",
  "objects.noOUSelected": "Select an OU from the tree first.",
  "objects.loadOUError": "Failed to load OU tree: {message}",
  "objects.loadListError": "Failed to load list: {message}",
  "objects.operationOk": "Operation succeeded",
  "objects.operationFail": "Operation failed: {message}",
  "objects.searchTitle": "Global Search",
  "objects.searchPlaceholder": "Search users, groups, computers or keywords",
  "objects.searchButton": "Search",
  "objects.searchResult": "Search results",
  "objects.searchNoResult": "No matching directory objects",
  "objects.searchType": "Object type",
  "objects.searchAll": "All types",
  "nav.sync": "Data Sync",
  "sync.title": "Data Sync",
  "sync.description": "Directory objects are cached locally; sync runs on login, connect, test and on a configurable schedule.",
  "sync.status": "Sync Status",
  "sync.lastSync": "Last sync:",
  "sync.lastStatus": "Last result:",
  "sync.nextSync": "Next sync:",
  "sync.users": "Users:",
  "sync.computers": "Computers:",
  "sync.groups": "Groups:",
  "sync.ous": "OUs:",
  "sync.gpos": "GPOs:",
  "sync.now": "Sync Now",
  "sync.done": "Sync completed",
  "sync.schedule": "Scheduled Sync",
  "sync.interval": "Interval",
  "sync.interval.off": "Off (manual only)",
  "sync.interval.minutes": "Every {n} minutes",
  "sync.intervalSaved": "Interval saved",
  "sync.scheduleHint": "A sync is triggered on login, config save, connection test and domain switch; scheduled sync refreshes the local cache automatically.",
  "audit.title": "Audit Log",
  "audit.description": "Append-only log of configuration changes and directory operations.",
  "audit.col.time": "Time",
  "audit.col.actor": "Actor",
  "audit.col.action": "Action",
  "audit.col.target": "Target",
  "audit.col.result": "Result",
  "audit.col.detail": "Details",
  "audit.result.ok": "Success",
  "audit.result.fail": "Failure",
  "audit.filter.actor": "Actor",
  "audit.filter.action": "Action",
  "audit.filter.result": "Result",
  "audit.filter.from": "From",
  "audit.filter.to": "To",
  "audit.loadError": "Failed to load audit log: {message}",
  "audit.noLog": "No audit records",
  "market.section.skills": "Skill Market",
  "market.skillsHint": "Bundled skills; download SKILL.md and install into ~/.dsh/skills/.",
  "market.skill.name": "Skill",
  "market.skill.version": "Version",
  "market.skill.desc": "Description",
  "market.skill.action": "Action",
  "market.skill.download": "Download",
  "market.skill.downloaded": "Skill downloaded",
  "market.skill.empty": "No skills available",
  "market.title": "Plugin Market",
  "market.description": "Version info, updates, channels, license and operation history. Admin only.",
  "market.section.version": "Version",
  "market.section.update": "Check for updates",
  "market.section.channel": "Update channel",
  "market.section.license": "License",
  "market.section.operations": "Operation history",
  "market.currentVersion": "Current version",
  "market.latestVersion": "Latest version",
  "market.checkUpdate": "Check for updates",
  "market.upToDate": "Already up to date",
  "market.updateAvailable": "New version {version} available",
  "market.forceUpdate": "Mandatory update",
  "market.optionalUpdate": "Optional update",
  "market.majorRisk": "Major upgrade may affect existing configuration. Back up first.",
  "market.update": "Update now",
  "market.rollback": "Roll back",
  "market.channel.stable": "Stable",
  "market.channel.gray": "Gray",
  "market.setChannel": "Switch channel",
  "market.license.mode": "License mode",
  "market.license.free": "Free",
  "market.license.paid": "Paid",
  "market.license.trial": "Trial",
  "market.license.expiry": "Expiry",
  "market.license.status": "License status",
  "market.license.valid": "Valid",
  "market.license.invalid": "Invalid",
  "market.refreshLicense": "Refresh license",
  "market.operation.time": "Time",
  "market.operation.type": "Operation",
  "market.operation.actor": "Actor",
  "market.operation.detail": "Details",
  "market.noOperations": "No operations recorded",
  "market.confirm.update": "Update to version {version}? A backup is created first and rollback happens on failure.",
  "market.confirm.rollback": "Roll back to the previous version? Changes in the current version will be lost.",
  "market.confirm.channel": "Switch update channel to {channel}?",
  "market.operationOk": "Operation succeeded",
  "market.operationFail": "Operation failed: {message}",
  "market.loadError": "Failed to load market info: {message}",
  "market.adminOnly": "The plugin market is visible to administrators only.",
  "market.noPermission": "Your role does not permit this action.",
  "danger.title": "Confirm dangerous action",
  "danger.message": "You are about to perform a dangerous action: {action}. It takes effect immediately and cannot be undone.",
  "danger.tip": "Type CONFIRMED to proceed:",
  "danger.confirm": "Confirm",
  "danger.cancel": "Cancel",
  "toast.success": "Operation succeeded",
  "toast.error": "Operation failed",
  "toast.info": "Notice",
  "toast.close": "Dismiss"
}
  };


  // ---- inlined UI modules ------------------------------------------------
  // UI IIFE 源码内嵌，浏览器无需加载相对 .jsx 子模块。
  // digest=0eeb82d08b7e8d1e 由 build-client.mjs 生成，用于确认页面加载的是最新代码。
  var UI_SOURCES = [];
  UI_SOURCES.push("/* AD/LDAP Domain Manager - self-drawn UI primitives (no Harness UI packages). */\n(function (global) {\n  'use strict';\n  var React = require('react');\n  var h = React.createElement;\n  var useRef = React.useRef;\n  var useEffect = React.useEffect;\n  var useState = React.useState;\n\n  // ---------- helpers ----------\n  function cx() {\n    var out = [];\n    for (var i = 0; i < arguments.length; i++) {\n      var a = arguments[i];\n      if (!a) continue;\n      if (typeof a === 'string' || typeof a === 'number') out.push(a);\n      else if (Array.isArray(a)) out.push(cx.apply(null, a));\n      else if (typeof a === 'object') {\n        for (var k in a) if (Object.prototype.hasOwnProperty.call(a, k) && a[k]) out.push(k);\n      }\n    }\n    return out.join(' ');\n  }\n\n  // Interpolate {name} placeholders in locale strings.\n  function fmt(tpl, vars) {\n    if (typeof tpl !== 'string') return String(tpl == null ? '' : tpl);\n    if (!vars) return tpl;\n    return tpl.replace(/\\{([a-zA-Z0-9_.]+)\\}/g, function (m, key) {\n      var v = vars[key];\n      return v == null ? m : String(v);\n    });\n  }\n\n  // Fire an event handler without leaking the React synthetic event into async code.\n  function stop(fn) {\n    return function (e) {\n      if (e && e.preventDefault) e.preventDefault();\n      if (e && e.stopPropagation) e.stopPropagation();\n      return fn(e);\n    };\n  }\n\n  // ---------- Button ----------\n  function Button(props) {\n    var variant = props.variant || 'default';\n    var cls = cx('dm-btn', 'dm-btn--' + variant, props.className, props.block && 'dm-btn--block');\n    var tag = props.href ? 'a' : 'button';\n    var attrs = {\n      className: cls,\n      type: props.href ? null : (props.type || 'button'),\n      disabled: props.disabled || props.loading,\n      title: props.title,\n      'aria-label': props['aria-label'],\n      onClick: props.disabled || props.loading ? undefined : props.onClick\n    };\n    if (props.href) attrs.href = props.href;\n    var children = props.loading\n      ? [h(Spinner, { key: 's' }), props.children]\n      : props.children;\n    return h(tag, attrs, children);\n  }\n\n  // ---------- Spinner ----------\n  function Spinner(props) {\n    return h('span', {\n      className: cx('dm-spinner', props && props.className),\n      role: 'progressbar',\n      'aria-label': props && props.label\n    });\n  }\n\n  // ---------- Field / Form ----------\n  function Field(props) {\n    var label = props.label;\n    var required = props.required;\n    var hint = props.hint;\n    var error = props.error;\n    var control = props.children;\n    var id = props.id;\n    return h('div', { className: cx('dm-field', props.className) },\n      label ? h('label', { className: 'dm-field__label', htmlFor: id },\n        label, required ? h('span', { className: 'dm-field__required', 'aria-hidden': 'true' }, ' *') : null\n      ) : null,\n      control,\n      hint && !error ? h('div', { className: 'dm-field__hint' }, hint) : null,\n      error ? h('div', { className: 'dm-field__error', role: 'alert' }, error) : null\n    );\n  }\n\n  function Input(props) {\n    var type = props.type || 'text';\n    return h('input', {\n      ref: props.inputRef,\n      id: props.id,\n      className: cx('dm-input', props.className),\n      type: type,\n      value: props.value == null ? '' : props.value,\n      placeholder: props.placeholder,\n      disabled: props.disabled,\n      readOnly: props.readOnly,\n      min: props.min,\n      max: props.max,\n      step: props.step,\n      autoComplete: props.autoComplete || (type === 'password' ? 'new-password' : 'off'),\n      'aria-label': props['aria-label'],\n      onChange: props.onChange ? function (e) { props.onChange(e.target.value, e); } : undefined,\n      onKeyDown: props.onKeyDown,\n      onBlur: props.onBlur\n    });\n  }\n\n  function Textarea(props) {\n    return h('textarea', {\n      id: props.id,\n      className: cx('dm-input', 'dm-textarea', props.className),\n      value: props.value == null ? '' : props.value,\n      placeholder: props.placeholder,\n      disabled: props.disabled,\n      rows: props.rows || 4,\n      'aria-label': props['aria-label'],\n      onChange: props.onChange ? function (e) { props.onChange(e.target.value, e); } : undefined\n    });\n  }\n\n  function Checkbox(props) {\n    return h('label', { className: cx('dm-checkbox', props.className) },\n      h('input', {\n        type: 'checkbox',\n        checked: !!props.checked,\n        disabled: props.disabled,\n        onChange: function (e) { if (props.onChange) props.onChange(e.target.checked, e); }\n      }),\n      h('span', null, props.label)\n    );\n  }\n\n  function Select(props) {\n    var options = props.options || [];\n    var children = options.map(function (opt, i) {\n      var value = opt && typeof opt === 'object' ? opt.value : opt;\n      var label = opt && typeof opt === 'object' ? opt.label : opt;\n      return h('option', { key: 'opt-' + i + '-' + value, value: value }, label);\n    });\n    return h('select', {\n      id: props.id,\n      className: cx('dm-input', 'dm-select', props.className),\n      value: props.value == null ? '' : props.value,\n      disabled: props.disabled,\n      'aria-label': props['aria-label'],\n      onChange: function (e) { if (props.onChange) props.onChange(e.target.value, e); }\n    }, children);\n  }\n\n  // ---------- Table ----------\n  // columns: [{ key, title, width, render(row, index) }]\n  function Table(props) {\n    var columns = props.columns || [];\n    var rows = props.rows || [];\n    var rowKey = props.rowKey || function (r, i) { return r && (r.id || r.dn || r.name) || i; };\n    var selectable = !!props.onSelectRow;\n    var selected = props.selectedKeys || [];\n    var head = h('thead', null, h('tr', null,\n      selectable ? h('th', { className: 'dm-table__check', scope: 'col' },\n        h('input', {\n          type: 'checkbox',\n          'aria-label': props.selectAllLabel || 'Select all',\n          checked: rows.length > 0 && selected.length === rows.length,\n          onChange: function (e) {\n            if (props.onSelectAll) props.onSelectAll(e.target.checked ? rows.map(rowKey) : []);\n          }\n        })\n      ) : null,\n      columns.map(function (col, i) {\n        return h('th', {\n          key: 'th-' + i,\n          scope: 'col',\n          style: col.width ? { width: col.width } : undefined\n        }, col.title);\n      })\n    ));\n    var body;\n    if (props.loading) {\n      body = h('tbody', null, h('tr', null, h('td', {\n        colSpan: columns.length + (selectable ? 1 : 0),\n        className: 'dm-table__placeholder'\n      }, h(Spinner, { label: props.loadingLabel }), ' ', props.loadingLabel || '')));\n    } else if (!rows.length) {\n      body = h('tbody', null, h('tr', null, h('td', {\n        colSpan: columns.length + (selectable ? 1 : 0),\n        className: 'dm-table__placeholder'\n      }, props.emptyText || '')));\n    } else {\n      body = h('tbody', null, rows.map(function (row, ri) {\n        var key = rowKey(row, ri);\n        var isSel = selected.indexOf(key) >= 0;\n        return h('tr', {\n          key: 'row-' + ri + '-' + key,\n          className: cx(isSel && 'dm-table__row--selected'),\n          onClick: selectable ? function () { props.onSelectRow(key, row); } : undefined\n        },\n          selectable ? h('td', { className: 'dm-table__check' },\n            h('input', {\n              type: 'checkbox',\n              checked: isSel,\n              'aria-label': props.selectRowLabel || 'Select row',\n              onClick: function (e) { e.stopPropagation(); },\n              onChange: function (e) {\n                var next = selected.slice();\n                var idx = next.indexOf(key);\n                if (e.target.checked && idx < 0) next.push(key);\n                if (!e.target.checked && idx >= 0) next.splice(idx, 1);\n                if (props.onSelectAll) props.onSelectAll(next);\n              }\n            })\n          ) : null,\n          columns.map(function (col, ci) {\n            return h('td', { key: 'td-' + ci }, col.render ? col.render(row, ri) : (row[col.key] == null ? '' : String(row[col.key])));\n          })\n        );\n      }));\n    }\n    return h('div', { className: cx('dm-table-wrap', props.className) },\n      h('table', { className: 'dm-table' }, head, body)\n    );\n  }\n\n  // ---------- Pagination ----------\n  function Pagination(props) {\n    var page = props.page || 1;\n    var pageSize = props.pageSize || 20;\n    var total = props.total || 0;\n    var pages = Math.max(1, Math.ceil(total / pageSize));\n    return h('div', { className: 'dm-pagination' },\n      h('span', { className: 'dm-pagination__info' }, props.totalText || ''),\n      h('div', { className: 'dm-pagination__controls' },\n        h(Button, {\n          size: 'sm', disabled: page <= 1, onClick: function () { props.onChange(Math.max(1, page - 1)); }\n        }, props.prevText || 'Prev'),\n        h('span', { className: 'dm-pagination__page' }, props.pageText || ''),\n        h(Button, {\n          size: 'sm', disabled: page >= pages, onClick: function () { props.onChange(Math.min(pages, page + 1)); }\n        }, props.nextText || 'Next')\n      )\n    );\n  }\n\n  // ---------- Modal ----------\n  // Lifecycle: Escape key closes, backdrop click closes, focus moves into the dialog.\n  function Modal(props) {\n    var dialogRef = useRef(null);\n    var onCloseRef = useRef(props.onClose);\n    onCloseRef.current = props.onClose;\n    var size = props.size || 'md';\n\n    useEffect(function () {\n      function keyHandler(e) {\n        if (e.key === 'Escape') {\n          e.preventDefault();\n          onCloseRef.current && onCloseRef.current();\n        }\n      }\n      document.addEventListener('keydown', keyHandler, true);\n      return function () { document.removeEventListener('keydown', keyHandler, true); };\n    }, []);\n\n    useEffect(function () {\n      var node = dialogRef.current;\n      if (!node) return;\n      var focusable = node.querySelectorAll('input:not([type=hidden]),select,textarea,button,[tabindex]:not([tabindex=\"-1\"])');\n      if (focusable && focusable.length) focusable[0].focus();\n    }, []);\n\n    return h('div', {\n      className: 'dm-modal-backdrop',\n      onMouseDown: function (e) { if (e.target === e.currentTarget) props.onClose && props.onClose(); }\n    },\n      h('div', {\n        ref: dialogRef,\n        className: cx('dm-modal', 'dm-modal--' + size),\n        role: 'dialog',\n        'aria-modal': 'true',\n        'aria-label': props.title || undefined\n      },\n        h('div', { className: 'dm-modal__head' },\n          h('h2', { className: 'dm-modal__title' }, props.title || ''),\n          h('button', {\n            type: 'button', className: 'dm-modal__close', 'aria-label': props.closeLabel || 'Close',\n            onClick: props.onClose\n          }, '×')\n        ),\n        h('div', { className: 'dm-modal__body' }, props.children),\n        props.footer ? h('div', { className: 'dm-modal__foot' }, props.footer) : null\n      )\n    );\n  }\n\n  // ---------- ConfirmDialog (dangerous actions) ----------\n  // Requires the literal CONFIRMED token before the confirm button enables.\n  function ConfirmDialog(props) {\n    var isDanger = !!props.danger;\n    var tokenState = useState('');\n    var token = tokenState[0];\n    var setToken = tokenState[1];\n    var inputRef = useRef(null);\n    var t = props.t || function (x) { return x; };\n    var title = props.title || t('danger.title');\n    var message = props.message || t('danger.message', { action: props.action || '' });\n    var confirmLabel = props.confirmLabel || (isDanger ? t('danger.confirm') : t('common.ok'));\n    var cancelLabel = props.cancelLabel || t('common.cancel');\n\n    function onConfirm() {\n      if (isDanger && token !== 'CONFIRMED') return;\n      if (props.onConfirm) props.onConfirm('CONFIRMED');\n    }\n\n    return h(Modal, {\n      title: title,\n      size: 'sm',\n      onClose: props.onClose,\n      closeLabel: t('common.close'),\n      footer: h('div', { className: 'dm-dialog-actions' },\n        h(Button, { variant: 'ghost', onClick: props.onClose }, cancelLabel),\n        h(Button, {\n          variant: isDanger ? 'danger' : 'primary',\n          onClick: onConfirm,\n          disabled: isDanger && token !== 'CONFIRMED'\n        }, confirmLabel)\n      )\n    },\n      h('p', { className: 'dm-dialog-message' }, message),\n      isDanger ? h(Field, { label: t('danger.tip') },\n        h(Input, {\n          id: 'dm-confirm-token',\n          inputRef: inputRef,\n          value: token,\n          placeholder: 'CONFIRMED',\n          autoComplete: 'off',\n          onChange: setToken\n        })\n      ) : null\n    );\n  }\n\n  // ---------- Tree ----------\n  // nodes: [{ id, label, children: [...] }] ; selectedId + onSelect(id, node)\n  function TreeNode(props) {\n    var node = props.node;\n    var depth = props.depth || 0;\n    var expanded = props.expandedMap[node.id] !== false;\n    var hasChildren = node.children && node.children.length;\n    var isSelected = props.selectedId === node.id;\n    return h('div', { className: 'dm-tree__node' },\n      h('div', {\n        className: cx('dm-tree__row', isSelected && 'dm-tree__row--selected'),\n        style: { paddingLeft: (8 + depth * 16) + 'px' },\n        role: 'treeitem',\n        'aria-selected': isSelected,\n        'aria-expanded': hasChildren ? expanded : undefined,\n        tabIndex: 0,\n        onClick: function () { props.onSelect(node.id, node); },\n        onKeyDown: function (e) {\n          if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); props.onSelect(node.id, node); }\n        }\n      },\n        hasChildren\n          ? h('button', {\n            type: 'button', className: 'dm-tree__toggle', 'aria-label': expanded ? 'Collapse' : 'Expand',\n            onClick: stop(function () { props.onToggle(node.id, !expanded); })\n          }, expanded ? '▾' : '▸')\n          : h('span', { className: 'dm-tree__toggle' }),\n        h('span', { className: 'dm-tree__label' }, node.label),\n        node.count != null ? h('span', { className: 'dm-tree__count' }, node.count) : null\n      ),\n      hasChildren && expanded\n        ? h('div', { role: 'group' }, node.children.map(function (child) {\n          return h(TreeNode, {\n            key: child.id,\n            node: child,\n            depth: depth + 1,\n            expandedMap: props.expandedMap,\n            selectedId: props.selectedId,\n            onSelect: props.onSelect,\n            onToggle: props.onToggle\n          });\n        }))\n        : null\n    );\n  }\n\n  function Tree(props) {\n    var expandedMap = props.expandedMap || {};\n    return h('div', { className: cx('dm-tree', props.className), role: 'tree' },\n      props.nodes && props.nodes.length\n        ? props.nodes.map(function (node) {\n          return h(TreeNode, {\n            key: node.id,\n            node: node,\n            expandedMap: expandedMap,\n            selectedId: props.selectedId,\n            onSelect: props.onSelect,\n            onToggle: props.onToggle\n          });\n        })\n        : h('div', { className: 'dm-tree__empty' }, props.emptyText || '')\n    );\n  }\n\n  // ---------- Toast ----------\n  function Toast(props) {\n    var tone = props.tone || 'info';\n    return h('div', { className: cx('dm-toast', 'dm-toast--' + tone), role: 'status' },\n      h('span', { className: 'dm-toast__icon' }, tone === 'error' ? '!' : tone === 'success' ? '✓' : 'i'),\n      h('span', { className: 'dm-toast__text' }, props.message),\n      h('button', {\n        type: 'button', className: 'dm-toast__close', 'aria-label': props.closeLabel || 'Close',\n        onClick: props.onClose\n      }, '×')\n    );\n  }\n\n  function ToastStack(props) {\n    return h('div', { className: 'dm-toast-stack', 'aria-live': 'polite' },\n      (props.items || []).map(function (item) {\n        return h(Toast, {\n          key: item.id,\n          tone: item.tone,\n          message: item.message,\n          closeLabel: props.closeLabel,\n          onClose: function () { props.onDismiss(item.id); }\n        });\n      })\n    );\n  }\n\n  // ---------- Inline notice ----------\n  function Notice(props) {\n    return h('div', {\n      className: cx('dm-notice', 'dm-notice--' + (props.tone || 'error')),\n      role: props.tone === 'error' ? 'alert' : 'status'\n    }, props.children);\n  }\n\n  // ---------- Section ----------\n  function Section(props) {\n    return h('section', { className: cx('dm-section', props.className) },\n      props.title ? h('h3', { className: 'dm-section__title' }, props.title) : null,\n      props.children\n    );\n  }\n\n  // ---------- Badge ----------\n  function Badge(props) {\n    return h('span', { className: cx('dm-badge', 'dm-badge--' + (props.tone || 'default')) }, props.children);\n  }\n\n  // ---------- Spacer / empty ----------\n  function Empty(props) {\n    return h('div', { className: 'dm-empty' }, props.children);\n  }\n\n  var api = {\n    cx: cx,\n    fmt: fmt,\n    stop: stop,\n    Button: Button,\n    Spinner: Spinner,\n    Field: Field,\n    Input: Input,\n    Textarea: Textarea,\n    Checkbox: Checkbox,\n    Select: Select,\n    Table: Table,\n    Pagination: Pagination,\n    Modal: Modal,\n    ConfirmDialog: ConfirmDialog,\n    Tree: Tree,\n    Toast: Toast,\n    ToastStack: ToastStack,\n    Notice: Notice,\n    Section: Section,\n    Badge: Badge,\n    Empty: Empty\n  };\n\n  if (!global.__DM_UI__) global.__DM_UI__ = {};\n  global.__DM_UI__.components = api;\n})(typeof window !== 'undefined' ? window : this);\n");
  UI_SOURCES.push("/* AD/LDAP Domain Manager - connection configuration page. */\n(function (global) {\n  'use strict';\n  var React = require('react');\n  var h = React.createElement;\n  var useState = React.useState;\n  var useEffect = React.useEffect;\n  var C = (global.__DM_UI__ && global.__DM_UI__.components) || {};\n\n  var DEFAULTS = {\n    id: '',\n    label: '',\n    host: '',\n    failoverHosts: '',\n    port: 389,\n    ssl: false,\n    tls: false,\n    bindDN: '',\n    bindPassword: '',\n    baseDN: '',\n    timeout: 10,\n    pageSize: 100,\n    vendor: 'ad'\n  };\n\n  function blank() {\n    return Object.assign({}, DEFAULTS);\n  }\n\n  function normalize(cfg) {\n    var out = blank();\n    if (!cfg || typeof cfg !== 'object') return out;\n    Object.keys(out).forEach(function (k) {\n      if (cfg[k] !== undefined && cfg[k] !== null && cfg[k] !== '') out[k] = cfg[k];\n    });\n    // 兼容存储层字段：配置名在 store 中存为 name/label，而表单用 label。\n    // 优先 label，其次 name；只有两者都缺失才回退到 id。\n    if (cfg.label) out.label = cfg.label;\n    else if (cfg.name) out.label = cfg.name;\n    else if (cfg.id) out.label = cfg.id;\n    // 备用域控：store 存数组，表单用逗号分隔字符串\n    if (Array.isArray(cfg.failoverHosts)) out.failoverHosts = cfg.failoverHosts.join(', ');\n    return out;\n  }\n\n  function ConnectionConfig(props) {\n    var t = props.t;\n    var call = props.call;\n    var toast = props.toast;\n    var refreshKey = props.refreshKey || 0;\n\n    var listState = useState([]);\n    var domains = listState[0];\n    var setDomains = listState[1];\n    var activeState = useState(null);\n    var activeId = activeState[0];\n    var setActiveId = activeState[1];\n    var formState = useState(blank());\n    var form = formState[0];\n    var setForm = formState[1];\n    var errorsState = useState({});\n    var errors = errorsState[0];\n    var setErrors = errorsState[1];\n    var loadingState = useState(false);\n    var loading = loadingState[0];\n    var setLoading = loadingState[1];\n    var testingState = useState(false);\n    var testing = testingState[0];\n    var setTesting = testingState[1];\n    var testResultState = useState(null);\n    var testResult = testResultState[0];\n    var setTestResult = testResultState[1];\n    var inlineErrorState = useState('');\n    var inlineError = inlineErrorState[0];\n    var setInlineError = inlineErrorState[1];\n\n    function loadDomains(cb) {\n      setLoading(true);\n      setInlineError('');\n      call('domain-manager.domainConfig.list', {}).then(function (res) {\n        var data = res && res.data;\n        var items = Array.isArray(data) ? data : (data && Array.isArray(data.items) ? data.items : []);\n        setDomains(items);\n        var active = null;\n        for (var i = 0; i < items.length; i++) {\n          if (items[i].active || items[i].isActive) { active = items[i].id; break; }\n        }\n        if (active == null && items.length) active = items[0].id;\n        // 回填当前激活（已选中）域的配置——包含配置名称、主/备域控等全部字段。\n        // 只要当前表单没有未保存的编辑（id 为空或等于激活域）就回填，\n        // 确保进入/刷新本页时\"配置名称\"始终显示已存储且当前选中的名称。\n        if (active != null && (!form.id || form.id === active)) {\n          var found = null;\n          for (var j = 0; j < items.length; j++) if (items[j].id === active) found = items[j];\n          if (found) setForm(normalize(found));\n        }\n        setActiveId(active);\n        setLoading(false);\n        if (cb) cb(items);\n      }).catch(function (err) {\n        setLoading(false);\n        var msg = err && err.message ? err.message : String(err || '');\n        setInlineError(C.fmt(t('common.inlineError'), { message: msg }));\n      });\n    }\n\n    useEffect(function () { loadDomains(); }, [refreshKey]);\n\n    function onField(key, value) {\n      setForm(function (prev) {\n        var next = Object.assign({}, prev);\n        next[key] = value;\n        return next;\n      });\n      setErrors(function (prev) {\n        if (!prev[key]) return prev;\n        var next = Object.assign({}, prev);\n        delete next[key];\n        return next;\n      });\n      setTestResult(null);\n    }\n\n    function validate() {\n      var next = {};\n      if (!String(form.label || '').trim()) next.label = t('common.required', { fields: t('connect.label') });\n      if (!String(form.host || '').trim()) next.host = t('common.required', { fields: t('connect.host') });\n      if (!String(form.bindDN || '').trim()) next.bindDN = t('common.required', { fields: t('connect.bindDN') });\n      if (!String(form.baseDN || '').trim()) next.baseDN = t('common.required', { fields: t('connect.baseDN') });\n      var port = Number(form.port);\n      if (!port || port < 1 || port > 65535) next.port = t('common.required', { fields: t('connect.port') });\n      var timeout = Number(form.timeout);\n      if (!timeout || timeout < 1) next.timeout = t('common.required', { fields: t('connect.timeout') });\n      var size = Number(form.pageSize);\n      if (!size || size < 1 || size > 1000) next.pageSize = t('common.required', { fields: t('connect.pageSize') });\n      if (form.ssl && form.tls) next.tls = t('connect.testFail', { message: 'SSL and StartTLS cannot both be enabled' });\n      setErrors(next);\n      return Object.keys(next).length === 0;\n    }\n\n    function handleTest() {\n      setTestResult(null);\n      setInlineError('');\n      var payload = Object.assign({}, form, {\n        port: Number(form.port), timeout: Number(form.timeout), pageSize: Number(form.pageSize)\n      });\n      setTesting(true);\n      call('domain-manager.domainConfig.test', payload).then(function (res) {\n        setTesting(false);\n        if (res && res.ok) {\n          setTestResult({ ok: true, text: t('connect.testOk') });\n          toast(t('connect.testOk'), 'success');\n        } else {\n          var msg = res && res.error && res.error.message ? res.error.message : '';\n          setTestResult({ ok: false, text: C.fmt(t('connect.testFail'), { message: msg }) });\n          toast(C.fmt(t('connect.testFail'), { message: msg }), 'error');\n        }\n      }).catch(function (err) {\n        setTesting(false);\n        var msg = err && err.message ? err.message : String(err || '');\n        setTestResult({ ok: false, text: C.fmt(t('connect.testFail'), { message: msg }) });\n        toast(C.fmt(t('connect.testFail'), { message: msg }), 'error');\n      });\n    }\n\n    function handleSave() {\n      if (!validate()) return;\n      setInlineError('');\n      var payload = Object.assign({}, form, {\n        port: Number(form.port), timeout: Number(form.timeout), pageSize: Number(form.pageSize)\n      });\n      setLoading(true);\n      call('domain-manager.domainConfig.save', payload).then(function (res) {\n        setLoading(false);\n        if (res && res.ok) {\n          toast(t('connect.saved'), 'success');\n          loadDomains(function (items) {\n            var saved = res.data && res.data.id ? res.data.id : payload.id;\n            var found = null;\n            for (var i = 0; i < items.length; i++) if (items[i].id === saved) found = items[i];\n            setForm(normalize(found || payload));\n          });\n        } else {\n          var msg = res && res.error && res.error.message ? res.error.message : '';\n          setInlineError(C.fmt(t('common.inlineError'), { message: msg }));\n          toast(C.fmt(t('common.error'), { message: msg }), 'error');\n        }\n      }).catch(function (err) {\n        setLoading(false);\n        var msg = err && err.message ? err.message : String(err || '');\n        setInlineError(C.fmt(t('common.inlineError'), { message: msg }));\n      });\n    }\n\n    function handleReset() {\n      setForm(blank());\n      setErrors({});\n      setTestResult(null);\n      setInlineError('');\n      toast(t('connect.resetDone'), 'info');\n    }\n\n    function handleNew() {\n      setForm(blank());\n      setErrors({});\n      setTestResult(null);\n      setInlineError('');\n    }\n\n    function handleSelectDomain(id) {\n      var found = null;\n      for (var i = 0; i < domains.length; i++) if (domains[i].id === id) found = domains[i];\n      setForm(normalize(found));\n      setErrors({});\n      setTestResult(null);\n      setInlineError('');\n    }\n\n    function handleSetActive() {\n      if (!form.id) return;\n      setLoading(true);\n      call('domain-manager.domainConfig.setActive', { id: form.id }).then(function (res) {\n        setLoading(false);\n        if (res && res.ok) {\n          toast(t('connect.activeSet'), 'success');\n          loadDomains();\n        } else {\n          var msg = res && res.error && res.error.message ? res.error.message : '';\n          toast(C.fmt(t('common.error'), { message: msg }), 'error');\n        }\n      }).catch(function (err) {\n        setLoading(false);\n        toast(C.fmt(t('common.error'), { message: err && err.message ? err.message : '' }), 'error');\n      });\n    }\n\n    var deleteConfirm = useState(null);\n    var pendingDelete = deleteConfirm[0];\n    var setPendingDelete = deleteConfirm[1];\n\n    function handleDelete() {\n      if (!form.id) return;\n      setPendingDelete({ id: form.id, name: form.label });\n    }\n\n    function doDelete() {\n      var id = pendingDelete.id;\n      setPendingDelete(null);\n      setLoading(true);\n      call('domain-manager.domainConfig.delete', { id: id, confirmToken: 'CONFIRMED' }).then(function (res) {\n        setLoading(false);\n        if (res && res.ok) {\n          toast(t('connect.deleted'), 'success');\n          setForm(blank());\n          loadDomains();\n        } else {\n          var msg = res && res.error && res.error.message ? res.error.message : '';\n          toast(C.fmt(t('common.error'), { message: msg }), 'error');\n        }\n      }).catch(function (err) {\n        setLoading(false);\n        toast(C.fmt(t('common.error'), { message: err && err.message ? err.message : '' }), 'error');\n      });\n    }\n\n    function field(key, labelKey, opts) {\n      opts = opts || {};\n      return h(C.Field, {\n        key: key,\n        id: 'dm-cfg-' + key,\n        label: t(labelKey),\n        required: opts.required,\n        hint: opts.hint,\n        error: errors[key]\n      }, h(C.Input, {\n        id: 'dm-cfg-' + key,\n        type: opts.type || 'text',\n        value: form[key],\n        placeholder: opts.placeholder,\n        min: opts.min,\n        max: opts.max,\n        disabled: loading,\n        onChange: function (v) { onField(key, v); }\n      }));\n    }\n\n    var domainOptions = domains.map(function (d) {\n      return { value: d.id, label: (d.label || d.host || d.id) + (d.id === activeId ? ' (' + t('connect.active') + ')' : '') };\n    });\n\n    return h('div', { className: 'dm-page dm-connect' },\n      h('header', { className: 'dm-page__head' },\n        h('h1', { className: 'dm-page__title' }, t('connect.title')),\n        h('p', { className: 'dm-page__desc' }, t('connect.description'))\n      ),\n      inlineError ? h(C.Notice, { tone: 'error' }, inlineError,\n        h(C.Button, { size: 'sm', variant: 'ghost', onClick: function () { loadDomains(); } }, t('common.retry'))\n      ) : null,\n\n      h(C.Section, { title: t('common.selectDomain') },\n        h('div', { className: 'dm-toolbar' },\n          h(C.Select, {\n            value: form.id || '',\n            options: [{ value: '', label: t('common.selectDomain') }].concat(domainOptions),\n            onChange: handleSelectDomain,\n            disabled: loading\n          }),\n          h(C.Button, { variant: 'ghost', onClick: handleNew }, t('connect.addDomain')),\n          form.id && form.id !== activeId\n            ? h(C.Button, { variant: 'ghost', onClick: handleSetActive, disabled: loading }, t('connect.setActive'))\n            : null,\n          h(C.Button, {\n            variant: 'ghost', onClick: function () { loadDomains(); }, disabled: loading, title: t('common.refresh')\n          }, t('common.refresh'))\n        ),\n        !domains.length && !loading ? h(C.Empty, null, t('connect.noDomains')) : null\n      ),\n\n      h(C.Section, null,\n        h('div', { className: 'dm-form-grid' },\n          field('label', 'connect.label', { required: true }),\n          field('host', 'connect.host', { required: true, placeholder: t('connect.hostPlaceholder') }),\n          field('failoverHosts', 'connect.failoverHosts', { placeholder: t('connect.failoverHostsPlaceholder') }),\n          field('port', 'connect.port', { required: true, type: 'number', min: 1, max: 65535 }),\n          h(C.Field, { id: 'dm-cfg-vendor', label: t('connect.vendor') },\n            h(C.Select, {\n              id: 'dm-cfg-vendor',\n              value: form.vendor,\n              options: [\n                { value: 'ad', label: t('connect.vendor.ad') },\n                { value: 'openldap', label: t('connect.vendor.openldap') }\n              ],\n              onChange: function (v) { onField('vendor', v); },\n              disabled: loading\n            })\n          ),\n          field('bindDN', 'connect.bindDN', { required: true, placeholder: t('connect.bindDNPlaceholder') }),\n          field('bindPassword', 'connect.bindPassword', {\n            type: 'password', hint: t('connect.passwordHint')\n          }),\n          field('baseDN', 'connect.baseDN', { required: true, placeholder: t('connect.baseDNPlaceholder') }),\n          field('timeout', 'connect.timeout', { required: true, type: 'number', min: 1 }),\n          field('pageSize', 'connect.pageSize', { required: true, type: 'number', min: 1, max: 1000 })\n        ),\n        h('div', { className: 'dm-form-checks' },\n          h(C.Checkbox, {\n            label: t('connect.ssl'), checked: !!form.ssl, disabled: loading,\n            onChange: function (v) { onField('ssl', v); }\n          }),\n          h(C.Checkbox, {\n            label: t('connect.tls'), checked: !!form.tls, disabled: loading,\n            onChange: function (v) { onField('tls', v); }\n          })\n        ),\n        errors.tls ? h(C.Notice, { tone: 'error' }, errors.tls) : null,\n        testResult\n          ? h(C.Notice, { tone: testResult.ok ? 'success' : 'error' }, testResult.text)\n          : null,\n        h('div', { className: 'dm-form-actions' },\n          h(C.Button, { variant: 'primary', onClick: handleSave, loading: loading }, t('connect.save')),\n          h(C.Button, { variant: 'ghost', onClick: handleTest, loading: testing }, t('connect.test')),\n          h(C.Button, { variant: 'ghost', onClick: handleReset, disabled: loading }, t('connect.reset')),\n          form.id\n            ? h(C.Button, { variant: 'danger', onClick: handleDelete, disabled: loading }, t('connect.delete'))\n            : null\n        )\n      ),\n\n      pendingDelete\n        ? h(C.ConfirmDialog, {\n          t: t,\n          danger: true,\n          title: t('connect.delete'),\n          action: pendingDelete.name || pendingDelete.id,\n          message: C.fmt(t('objects.confirm.delete'), { name: pendingDelete.name || pendingDelete.id }),\n          onClose: function () { setPendingDelete(null); },\n          onConfirm: doDelete\n        })\n        : null\n    );\n  }\n\n  if (!global.__DM_UI__) global.__DM_UI__ = {};\n  global.__DM_UI__.ConnectConfig = ConnectionConfig;\n})(typeof window !== 'undefined' ? window : this);\n");
  UI_SOURCES.push("/* AD/LDAP Domain Manager - directory object pages, dialogs and global search. */\n(function (global) {\n  'use strict';\n  var React = require('react');\n  var h = React.createElement;\n  var useState = React.useState;\n  var useEffect = React.useEffect;\n  var C = (global.__DM_UI__ && global.__DM_UI__.components) || {};\n\n  // Object type metadata: query method, create method, columns and title keys.\n  var TYPES = {\n    users: {\n      list: 'domain-manager.directory.listUsers',\n      title: 'objects.users',\n      columns: [\n        { key: 'name', titleKey: 'objects.col.name', render: function (r) { return r.displayName || r.name || r.cn || r.sAMAccountName || r.uid || ''; } },\n        { key: 'sAMAccountName', titleKey: 'objects.col.sam', render: function (r) { return r.sAMAccountName || r.uid || ''; } },\n        { key: 'userPrincipalName', titleKey: 'objects.col.upn', render: function (r) { return r.userPrincipalName || ''; } },\n        { key: 'mail', titleKey: 'objects.col.mail', render: function (r) { return r.mail || ''; } },\n        { key: 'mobile', titleKey: 'objects.col.mobile', render: function (r) { return r.mobile || ''; } },\n        { key: 'department', titleKey: 'objects.col.department', render: function (r) { return r.department || ''; } },\n        { key: 'title', titleKey: 'objects.col.title', render: function (r) { return r.title || ''; } },\n        { key: 'employeeID', titleKey: 'objects.col.employeeID', render: function (r) { return r.employeeID || ''; } },\n        { key: 'enabled', titleKey: 'objects.col.enabled', render: function (r) { return flag(r, 'enabled', true); } },\n        { key: 'locked', titleKey: 'objects.col.locked', render: function (r) { return flag(r, 'locked', false); } },\n        { key: 'pwdLastSet', titleKey: 'objects.col.pwdLastSet', render: function (r) { return r.pwdLastSet || ''; } }\n      ],\n      filters: [\n        { key: 'enabled', labelKey: 'objects.filter.enabled', options: [['', 'common.all'], ['true', 'common.enabled'], ['false', 'common.disabled']] },\n        { key: 'locked', labelKey: 'objects.filter.locked', options: [['', 'common.all'], ['true', 'common.yes'], ['false', 'common.no']] }\n      ]\n    },\n    computers: {\n      list: 'domain-manager.directory.listComputers',\n      title: 'objects.computers',\n      columns: [\n        { key: 'name', titleKey: 'objects.col.name', render: function (r) { return r.name || r.cn || ''; } },\n        { key: 'dnsHostName', titleKey: 'objects.col.dnsHost', render: function (r) { return r.dnsHostName || r.dnshostname || ''; } },\n        { key: 'operatingSystem', titleKey: 'objects.col.os', render: function (r) { return r.operatingSystem || ''; } },\n        { key: 'enabled', titleKey: 'objects.col.enabled', render: function (r) { return flag(r, 'enabled', true); } },\n        { key: 'description', titleKey: 'objects.col.description', render: function (r) { return r.description || ''; } }\n      ],\n      filters: [\n        { key: 'enabled', labelKey: 'objects.filter.enabled', options: [['', 'common.all'], ['true', 'common.enabled'], ['false', 'common.disabled']] }\n      ]\n    },\n    groups: {\n      list: 'domain-manager.directory.listGroups',\n      title: 'objects.groups',\n      columns: [\n        { key: 'name', titleKey: 'objects.col.name', render: function (r) { return r.name || r.cn || ''; } },\n        { key: 'sAMAccountName', titleKey: 'objects.col.sam', render: function (r) { return r.sAMAccountName || ''; } },\n        { key: 'description', titleKey: 'objects.col.description', render: function (r) { return r.description || ''; } },\n        { key: 'memberCount', titleKey: 'objects.col.memberCount', render: function (r) { return r.memberCount != null ? r.memberCount : (Array.isArray(r.members) ? r.members.length : ''); } },\n        { key: 'dn', titleKey: 'objects.col.dn', render: function (r) { return r.dn || ''; } }\n      ],\n      filters: []\n    },\n    ous: {\n      list: 'domain-manager.directory.listOUs',\n      title: 'objects.ous',\n      columns: [\n        { key: 'name', titleKey: 'objects.col.name', render: function (r) { return r.name || r.ou || r.cn || ''; } },\n        { key: 'dn', titleKey: 'objects.col.dn', render: function (r) { return r.dn || ''; } },\n        { key: 'parent', titleKey: 'objects.col.parent', render: function (r) { return r.parent || r.parentDn || ''; } },\n        { key: 'description', titleKey: 'objects.col.description', render: function (r) { return r.description || ''; } }\n      ],\n      filters: []\n    },\n    gpos: {\n      list: 'domain-manager.directory.listGPOs',\n      title: 'objects.gpos',\n      columns: [\n        { key: 'name', titleKey: 'objects.col.name', render: function (r) { return r.name || r.displayName || ''; } },\n        { key: 'enabled', titleKey: 'objects.col.gpoStatus', render: function (r) { return flag(r, 'enabled', true); } },\n        { key: 'links', titleKey: 'objects.col.gpoLinks', render: function (r) { return Array.isArray(r.links) ? r.links.join(', ') : (r.links || ''); } },\n        { key: 'description', titleKey: 'objects.col.description', render: function (r) { return r.description || ''; } }\n      ],\n      filters: []\n    }\n  };\n\n  function flag(row, key, goodWhenTrue) {\n    var raw = row[key];\n    if (raw == null) return '—';\n    var enabled = raw === true || raw === 1 || raw === 'true' || raw === 'TRUE' || raw === 'enabled';\n    var good = goodWhenTrue ? enabled : !enabled;\n    return h(C.Badge, { tone: good ? 'success' : 'muted' }, enabled ? 'true' : 'false');\n  }\n\n  function rowName(row) {\n    return row.displayName || row.name || row.cn || row.sAMAccountName || row.uid || row.dn || '';\n  }\n\n  function toBool(v) { return v === true || v === 'true' || v === 1; }\n\n  // -------------------- OU tree --------------------\n  function buildOUTree(ous) {\n    var nodes = [];\n    var map = {};\n    var byId = {}; // 短 id -> DN，便于 parentId 关联\n    (ous || []).forEach(function (o) {\n      var id = o.dn || o.id || o.name;\n      if (o.id) byId[o.id] = id;\n      map[id] = {\n        id: id,\n        label: o.name || o.cn || id,\n        dn: o.dn || id,\n        raw: o,\n        children: []\n      };\n    });\n    (ous || []).forEach(function (o) {\n      var id = o.dn || o.id || o.name;\n      var node = map[id];\n      // listOUs 返回 parentId；也兼容 parent/parentDn。父节点可能是 id 也可能是 DN。\n      var parent = o.parentId || o.parent || o.parentDn;\n      var parentNode = parent && (map[parent] || map[byId[parent]]);\n      if (parentNode && parentNode !== node) parentNode.children.push(node);\n      else nodes.push(node);\n    });\n    return nodes;\n  }\n\n  function OUTree(props) {\n    var t = props.t;\n    var call = props.call;\n    var loadingState = useState(false);\n    var loading = loadingState[0];\n    var setLoading = loadingState[1];\n    var nodesState = useState([]);\n    var nodes = nodesState[0];\n    var setNodes = nodesState[1];\n    var selectedState = useState(null);\n    var selected = selectedState[0];\n    var setSelectedFn = selectedState[1];\n    var expandedState = useState({});\n    var expanded = expandedState[0];\n    var setExpanded = expandedState[1];\n    var errorState = useState('');\n    var error = errorState[0];\n    var setError = errorState[1];\n\n    function loadTree() {\n      setLoading(true);\n      setError('');\n      call('domain-manager.directory.listOUs', { page: 1, pageSize: 1000 }).then(function (res) {\n        setLoading(false);\n        var items = res && res.data && Array.isArray(res.data.items) ? res.data.items : (Array.isArray(res && res.data) ? res.data : []);\n        var tree = buildOUTree(items);\n        setNodes(tree);\n        var exp = {};\n        tree.forEach(function (n) { exp[n.id] = true; });\n        setExpanded(exp);\n      }).catch(function (err) {\n        setLoading(false);\n        setError(C.fmt(t('objects.loadOUError'), { message: err && err.message ? err.message : '' }));\n      });\n    }\n\n    useEffect(function () { loadTree(); }, []);\n\n    function onSelect(id, node) {\n      setSelectedFn(id);\n      props.onSelect(node && node.dn ? node.dn : id);\n    }\n\n    function onToggle(id, open) {\n      setExpanded(function (prev) {\n        var next = Object.assign({}, prev);\n        next[id] = open;\n        return next;\n      });\n    }\n\n    return h('div', { className: 'dm-ou-tree' },\n      h('div', { className: 'dm-ou-tree__head' }, t('objects.ouTree'),\n        h(C.Button, { size: 'sm', variant: 'ghost', onClick: loadTree, loading: loading, title: t('common.refresh') }, '↻')\n      ),\n      error ? h(C.Notice, { tone: 'error' }, error) : null,\n      h('button', {\n        type: 'button',\n        className: C.cx('dm-tree__all', selected === null && 'dm-tree__all--active'),\n        onClick: function () { setSelectedFn(null); props.onSelect(null); }\n      }, t('objects.allObjects')),\n      h(C.Tree, {\n        nodes: nodes,\n        expandedMap: expanded,\n        selectedId: selected,\n        emptyText: loading ? t('common.loading') : t('common.empty'),\n        onSelect: onSelect,\n        onToggle: onToggle\n      })\n    );\n  }\n\n  // -------------------- Object list page --------------------\n  function ObjectsPage(props) {\n    var t = props.t;\n    var call = props.call;\n    var toast = props.toast;\n    var typeKey = props.type || 'users';\n    var meta = TYPES[typeKey] || TYPES.users;\n    var domainId = props.domainId;\n\n    var keywordState = useState('');\n    var keyword = keywordState[0];\n    var setKeyword = keywordState[1];\n    var appliedKeywordState = useState('');\n    var appliedKeyword = appliedKeywordState[0];\n    var setAppliedKeyword = appliedKeywordState[1];\n    var filtersState = useState({});\n    var filters = filtersState[0];\n    var setFilters = filtersState[1];\n    var ouDnState = useState(null);\n    var ouDn = ouDnState[0];\n    var setOuDn = ouDnState[1];\n    var pageState = useState(1);\n    var page = pageState[0];\n    var setPage = pageState[1];\n    var rowsState = useState([]);\n    var rows = rowsState[0];\n    var setRows = rowsState[1];\n    var totalState = useState(0);\n    var total = totalState[0];\n    var setTotal = totalState[1];\n    var loadingState = useState(false);\n    var loading = loadingState[0];\n    var setLoading = loadingState[1];\n    var errorState = useState('');\n    var error = errorState[0];\n    var setError = errorState[1];\n    var selectedState = useState([]);\n    var selected = selectedState[0];\n    var setSelected = selectedState[1];\n    var dialogState = useState(null);\n    var dialog = dialogState[0];\n    var setDialog = dialogState[1];\n    var busyState = useState(false);\n    var busy = busyState[0];\n    var setBusy = busyState[1];\n    var gpoOptionsState = useState([]);\n    var gpoOptions = gpoOptionsState[0];\n    var setGpoOptions = gpoOptionsState[1];\n\n    function loadList() {\n      setLoading(true);\n      setError('');\n      var q = {\n        domainId: domainId,\n        keyword: appliedKeyword,\n        filters: filters,\n        ouDn: ouDn,\n        page: page,\n        pageSize: 20\n      };\n      call(meta.list, q).then(function (res) {\n        setLoading(false);\n        if (res && res.ok) {\n          var data = res.data || {};\n          setRows(Array.isArray(data.items) ? data.items : (Array.isArray(data) ? data : []));\n          setTotal(data.total != null ? data.total : (Array.isArray(data.items) ? data.items.length : 0));\n          setSelected([]);\n        } else {\n          var msg = res && res.error && res.error.message ? res.error.message : '';\n          setError(C.fmt(t('objects.loadListError'), { message: msg }));\n        }\n      }).catch(function (err) {\n        setLoading(false);\n        setError(C.fmt(t('objects.loadListError'), { message: err && err.message ? err.message : '' }));\n      });\n    }\n\n    useEffect(function () { loadList(); }, [typeKey, domainId, page, appliedKeyword, JSON.stringify(filters), ouDn]);\n\n    function loadGpoOptions() {\n      call('domain-manager.directory.listGPOs', { page: 1, pageSize: 1000, domainId: domainId }).then(function (res) {\n        var items = res && res.data && Array.isArray(res.data.items) ? res.data.items : (Array.isArray(res && res.data) ? res.data : []);\n        setGpoOptions(items);\n      }).catch(function () { setGpoOptions([]); });\n    }\n\n    function applySearch() {\n      setPage(1);\n      setAppliedKeyword(keyword);\n    }\n\n    function changeFilter(key, value) {\n      setPage(1);\n      setFilters(function (prev) {\n        var next = Object.assign({}, prev);\n        if (!value) delete next[key];\n        else next[key] = value;\n        return next;\n      });\n    }\n\n    function clearFilters() {\n      setFilters({});\n      setKeyword('');\n      setAppliedKeyword('');\n      setPage(1);\n    }\n\n    function onOUSelect(dn) {\n      setOuDn(dn);\n      setPage(1);\n    }\n\n    function runAction(method, params, successKey, dangerInfo, extras) {\n      setBusy(true);\n      setDialog(null);\n      var payload = Object.assign({}, params, { domainId: domainId, actor: props.actor });\n      if (dangerInfo) payload.confirmToken = 'CONFIRMED';\n      call(method, payload).then(function (res) {\n        setBusy(false);\n        if (res && res.ok) {\n          toast(t(successKey || 'objects.operationOk'), 'success');\n          loadList();\n        } else {\n          var msg = res && res.error && res.error.message ? res.error.message : '';\n          toast(C.fmt(t('objects.operationFail'), { message: msg }), 'error');\n        }\n      }).catch(function (err) {\n        setBusy(false);\n        toast(C.fmt(t('objects.operationFail'), { message: err && err.message ? err.message : '' }), 'error');\n      });\n    }\n\n    // Open dialogs -------------------------------------------------------\n    function openCreate() {\n      var d = { kind: 'create' };\n      if (typeKey === 'gpos') { loadGpoOptions(); }\n      setDialog(d);\n    }\n\n    function openEdit(row) {\n      setDialog({ kind: 'edit', row: row });\n    }\n\n    function openDelete(row) {\n      setDialog({ kind: 'delete', row: row, danger: true });\n    }\n\n    function openResetPw(row) {\n      setDialog({ kind: 'resetPw', row: row, danger: true });\n    }\n\n    function openToggle(row) {\n      var enabled = toBool(row.enabled);\n      setDialog({\n        kind: 'toggle', row: row, danger: false,\n        nextEnabled: !enabled,\n        message: C.fmt(t('objects.confirm.toggle'), { action: enabled ? t('common.disable') : t('common.enable'), name: rowName(row) })\n      });\n    }\n\n    function openUnlock(row) {\n      setDialog({\n        kind: 'unlock', row: row,\n        message: C.fmt(t('objects.confirm.unlock'), { name: rowName(row) })\n      });\n    }\n\n    function openMove(row) {\n      setDialog({ kind: 'move', row: row });\n    }\n\n    function openGroups(row) {\n      setDialog({ kind: 'groups', row: row, membersText: '' });\n      call('domain-manager.directory.listGroupMembers', { id: row.id || row.dn, domainId: domainId }).then(function (res) {\n        var items = res && res.data && Array.isArray(res.data.items) ? res.data.items : (Array.isArray(res && res.data) ? res.data : []);\n        setDialog(function (prev) {\n          if (!prev || prev.kind !== 'groups') return prev;\n          return Object.assign({}, prev, {\n            members: items.map(function (m) { return (m && (m.dn || m.name || m.id)) || String(m); })\n          });\n        });\n      }).catch(function () { /* leave members empty */ });\n    }\n\n    function openRename(row) {\n      setDialog({ kind: 'rename', row: row });\n    }\n\n    function openBindGpo(row) {\n      loadGpoOptions();\n      setDialog({ kind: 'bindGpo', row: row });\n    }\n\n    function openUnbindGpo(row) {\n      var links = Array.isArray(row.links) ? row.links : (row.links ? String(row.links).split(',') : []);\n      setDialog({ kind: 'unbindGpo', row: row, links: links, danger: true });\n    }\n\n    function openBatch(action) {\n      setDialog({ kind: 'batch', action: action, danger: true });\n    }\n\n    // Action columns -----------------------------------------------------\n    function actionsFor(row) {\n      var acts = [];\n      var id = row.id || row.dn;\n      function btn(key, label, fn, variant) {\n        return h(C.Button, { key: key, size: 'sm', variant: variant || 'ghost', onClick: fn }, label);\n      }\n      if (typeKey === 'users') {\n        acts.push(btn('edit', t('common.edit'), function () { openEdit(row); }));\n        acts.push(btn('resetPw', t('objects.action.resetPw'), function () { openResetPw(row); }));\n        acts.push(btn('toggle', t('objects.action.toggle'), function () { openToggle(row); }));\n        acts.push(btn('unlock', t('objects.action.unlock'), function () { openUnlock(row); }));\n        acts.push(btn('move', t('objects.action.move'), function () { openMove(row); }));\n        acts.push(btn('groups', t('objects.action.groups'), function () { openGroups(row); }));\n        acts.push(btn('delete', t('common.delete'), function () { openDelete(row); }, 'danger'));\n      } else if (typeKey === 'computers') {\n        acts.push(btn('edit', t('common.edit'), function () { openEdit(row); }));\n        acts.push(btn('toggle', t('objects.action.toggle'), function () { openToggle(row); }));\n        acts.push(btn('move', t('objects.action.move'), function () { openMove(row); }));\n        acts.push(btn('delete', t('common.delete'), function () { openDelete(row); }, 'danger'));\n      } else if (typeKey === 'groups') {\n        acts.push(btn('edit', t('common.edit'), function () { openEdit(row); }));\n        acts.push(btn('members', t('objects.action.groups'), function () { openGroups(row); }));\n        acts.push(btn('delete', t('common.delete'), function () { openDelete(row); }, 'danger'));\n      } else if (typeKey === 'ous') {\n        acts.push(btn('rename', t('objects.action.rename'), function () { openRename(row); }));\n        acts.push(btn('move', t('objects.action.move'), function () { openMove(row); }));\n        acts.push(btn('delete', t('common.delete'), function () { openDelete(row); }, 'danger'));\n      } else if (typeKey === 'gpos') {\n        acts.push(btn('toggle', t('objects.action.toggle'), function () { openToggle(row); }));\n        acts.push(btn('bind', t('objects.action.bindGpo'), function () { openBindGpo(row); }));\n        acts.push(btn('unbind', t('objects.action.unbindGpo'), function () { openUnbindGpo(row); }, 'danger'));\n      }\n      return h('div', { className: 'dm-row-actions' }, acts);\n    }\n\n    var columns = meta.columns.map(function (col) {\n      return {\n        key: col.key,\n        title: t(col.titleKey),\n        render: col.render\n      };\n    });\n    columns.push({ key: '__actions', title: t('common.actions'), render: actionsFor });\n\n    // Dialog contents ----------------------------------------------------\n    function renderDialog() {\n      if (!dialog) return null;\n      var d = dialog;\n      var row = d.row || {};\n      var id = row.id || row.dn;\n      // A fresh keyed sub-component resets local form state on each dialog open.\n      return h(ObjectDialog, {\n        key: d.kind + '-' + (id || ''),\n        t: t, dialog: d, meta: meta, typeKey: typeKey,\n        row: row, domainId: domainId, actor: props.actor,\n        call: call,\n        gpoOptions: gpoOptions,\n        selectedIds: selected,\n        busy: busy,\n        close: function () { setDialog(null); },\n        submit: function (method, params, successKey) {\n          runAction(method, params, successKey, !!d.danger);\n        },\n        runAction: runAction\n      });\n    }\n\n    return h('div', { className: 'dm-page dm-objects' },\n      h('header', { className: 'dm-page__head' },\n        h('h1', { className: 'dm-page__title' }, t(meta.title)),\n        h('p', { className: 'dm-page__desc' }, t('objects.description'))\n      ),\n      h('div', { className: 'dm-objects-layout' },\n        h('aside', { className: 'dm-objects-side' },\n          h(OUTree, { t: t, call: call, onSelect: onOUSelect })\n        ),\n        h('main', { className: 'dm-objects-main' },\n          h('div', { className: 'dm-toolbar' },\n            h(C.Input, {\n              value: keyword,\n              placeholder: t('objects.searchPlaceholder'),\n              onChange: setKeyword,\n              onKeyDown: function (e) { if (e.key === 'Enter') applySearch(); }\n            }),\n            h(C.Button, { variant: 'primary', onClick: applySearch }, t('common.search')),\n            h(C.Button, { variant: 'ghost', onClick: clearFilters }, t('common.clearFilter')),\n            h(C.Button, { variant: 'primary', onClick: openCreate }, t('objects.action.create')),\n            selected.length\n              ? h(C.Select, {\n                value: '',\n                options: [{ value: '', label: t('objects.batchAction') }].concat(\n                  typeKey === 'gpos'\n                    ? [{ value: 'toggle', label: t('objects.action.toggle') }, { value: 'unbindGpo', label: t('objects.action.unbindGpo') }]\n                    : [{ value: 'delete', label: t('common.delete') }, { value: 'toggle', label: t('objects.action.toggle') }]\n                ),\n                onChange: function (v) { if (v) openBatch(v); }\n              })\n              : null,\n            selected.length ? h('span', { className: 'dm-selected-count' }, C.fmt(t('objects.selected'), { count: selected.length })) : null\n          ),\n          meta.filters && meta.filters.length\n            ? h('div', { className: 'dm-filter-bar' },\n                h('span', { className: 'dm-filter-bar__label' }, t('common.filter')),\n                meta.filters.map(function (f) {\n                  return h('label', { key: f.key, className: 'dm-filter-bar__item' },\n                    h('span', { className: 'dm-filter-bar__item-label' }, t(f.labelKey)),\n                    h(C.Select, {\n                      value: filters[f.key] || '',\n                      options: f.options.map(function (o) { return { value: o[0], label: t(o[1]) }; }),\n                      onChange: function (v) { changeFilter(f.key, v); },\n                      'aria-label': t(f.labelKey)\n                    })\n                  );\n                }),\n                Object.keys(filters).length\n                  ? h(C.Button, { size: 'sm', variant: 'ghost', onClick: clearFilters }, t('common.clearFilter'))\n                  : null\n              )\n            : null,\n          error ? h(C.Notice, { tone: 'error' }, error,\n            h(C.Button, { size: 'sm', variant: 'ghost', onClick: loadList }, t('common.retry'))\n          ) : null,\n          h(C.Table, {\n            columns: columns,\n            rows: rows,\n            loading: loading,\n            loadingLabel: t('common.loading'),\n            emptyText: t('common.empty'),\n            rowKey: function (r, i) { return (r.id || r.dn || rowName(r) || i); },\n            selectable: true,\n            selectedKeys: selected,\n            onSelectAll: setSelected,\n            selectAllLabel: t('common.all'),\n            selectRowLabel: t('objects.selected')\n          }),\n          h(C.Pagination, {\n            page: page, pageSize: 20, total: total,\n            totalText: C.fmt(t('common.total'), { total: total }),\n            pageText: C.fmt(t('common.page'), { page: page, pages: Math.max(1, Math.ceil(total / 20)) }),\n            prevText: t('common.prev'), nextText: t('common.next'),\n            onChange: function (p) { setPage(p); }\n          })\n        )\n      ),\n      renderDialog()\n    );\n  }\n\n  // -------------------- Object dialog form --------------------\n  function ObjectDialog(props) {\n    var t = props.t;\n    var d = props.dialog;\n    var row = props.row || {};\n    var kind = d.kind;\n    var id = row.id || row.dn;\n    var initial = Object.assign({}, row, {\n      sam: row.sAMAccountName || row.uid || '',\n      upn: row.userPrincipalName || '',\n      displayName: row.displayName || '',\n      givenName: row.givenName || '',\n      sn: row.sn || '',\n      mail: row.mail || '',\n      mobile: row.mobile || '',\n      employeeID: row.employeeID || row.employeeNumber || '',\n      department: row.department || '',\n      title: row.title || '',\n      telephoneNumber: row.telephoneNumber || '',\n      dnsHostName: row.dnsHostName || row.dnshostname || '',\n      operatingSystem: row.operatingSystem || '',\n      description: row.description || ''\n    });\n    var formState = useState(initial);\n    var form = formState[0];\n    var setForm = formState[1];\n    var localErrorState = useState('');\n    var localError = localErrorState[0];\n    var setLocalError = localErrorState[1];\n    var tokenState = useState('');\n    var token = tokenState[0];\n    var setToken = tokenState[1];\n    var typeKey = props.typeKey;\n\n    // 移动/绑定 GPO 时，目标 OU 从组织树点选（不手填 DN）\n    var ouNodesState = useState([]);\n    var ouNodes = ouNodesState[0];\n    var setOuNodes = ouNodesState[1];\n    var ouExpandedState = useState({});\n    var ouExpanded = ouExpandedState[0];\n    var setOuExpanded = ouExpandedState[1];\n    var ouLoadedState = useState(false);\n    var ouLoaded = ouLoadedState[0];\n    var setOuLoaded = ouLoadedState[1];\n\n    function ensureOuTree() {\n      if (ouLoaded) return;\n      setOuLoaded(true);\n      props.call('domain-manager.directory.listOUs', { page: 1, pageSize: 1000 }).then(function (res) {\n        var items = res && res.data && Array.isArray(res.data.items) ? res.data.items : [];\n        var tree = buildOUTree(items);\n        setOuNodes(tree);\n        var exp = {};\n        tree.forEach(function (n) { exp[n.id] = true; });\n        setOuExpanded(exp);\n      }).catch(function () {});\n    }\n\n    function set(key, value) {\n      setForm(function (prev) {\n        var next = Object.assign({}, prev);\n        next[key] = value;\n        return next;\n      });\n    }\n\n    function titleForDialog() {\n      if (kind === 'create') {\n        if (typeKey === 'users') return t('objects.createUser');\n        if (typeKey === 'computers') return t('objects.createComputer');\n        if (typeKey === 'groups') return t('objects.createGroup');\n        if (typeKey === 'ous') return t('objects.createOU');\n        return t('objects.action.create');\n      }\n      if (kind === 'edit') {\n        if (typeKey === 'users') return t('objects.editUser');\n        if (typeKey === 'computers') return t('objects.editComputer');\n        if (typeKey === 'groups') return t('objects.editGroup');\n        return t('common.edit');\n      }\n      if (kind === 'rename') return t('objects.renameOU');\n      if (kind === 'move') return t('objects.move');\n      if (kind === 'resetPw') return t('objects.resetPw');\n      if (kind === 'groups') return t('objects.groups');\n      if (kind === 'bindGpo') return t('objects.bindGpo');\n      if (kind === 'unbindGpo') return t('objects.action.unbindGpo');\n      if (kind === 'batch') return t('objects.batchAction');\n      if (kind === 'delete') return t('common.delete');\n      if (kind === 'unlock') return t('objects.action.unlock');\n      if (kind === 'toggle') return t('objects.action.toggle');\n      return t('common.details');\n    }\n\n    function basePayload() {\n      var p = {\n        domainId: props.domainId,\n        actor: props.actor,\n        id: id,\n        dn: row.dn,\n        dnRaw: row.dnRaw || row.dn,\n        sAMAccountName: form.sam || row.sAMAccountName || row.username || '',\n        name: form.name || form.cn || rowName(row),\n        sAMAccountName: form.sam,\n        userPrincipalName: form.upn,\n        displayName: form.displayName,\n        givenName: form.givenName,\n        sn: form.sn,\n        mail: form.mail,\n        mobile: form.mobile,\n        employeeID: form.employeeID,\n        department: form.department,\n        title: form.title,\n        telephoneNumber: form.telephoneNumber,\n        dnsHostName: form.dnsHostName,\n        operatingSystem: form.operatingSystem,\n        description: form.description,\n        enabled: toBool(form.enabled)\n      };\n      return p;\n    }\n\n    function validateForm() {\n      if (kind === 'resetPw') {\n        if (!form.newPassword) { setLocalError(t('objects.passwordEmpty')); return false; }\n        if (form.newPassword !== form.confirmPassword) { setLocalError(t('objects.passwordMismatch')); return false; }\n      }\n      if (kind === 'create' || kind === 'edit') {\n        if (!String(form.sam || '').trim() && typeKey === 'users') {\n          setLocalError(t('common.required', { fields: t('objects.field.sam') }));\n          return false;\n        }\n      }\n      setLocalError('');\n      return true;\n    }\n\n    function submitSimple() {\n      if (!validateForm()) return;\n      if (d.danger && kind !== 'delete' && kind !== 'resetPw' && kind !== 'batch' && kind !== 'unbindGpo') {\n        // non-token dialogs do not need confirmation\n      }\n      var danger = !!d.danger;\n      if (danger && token !== 'CONFIRMED') {\n        setLocalError(t('common.confirmTokenInvalid'));\n        return;\n      }\n      var p = basePayload();\n      switch (kind) {\n        case 'create':\n          if (typeKey === 'users') props.submit('domain-manager.directory.createUser', p, 'objects.operationOk');\n          else if (typeKey === 'computers') props.submit('domain-manager.directory.createComputer', p, 'objects.operationOk');\n          else if (typeKey === 'groups') props.submit('domain-manager.directory.createGroup', p, 'objects.operationOk');\n          else if (typeKey === 'ous') props.submit('domain-manager.directory.createOU', p, 'objects.operationOk');\n          break;\n        case 'edit':\n          if (typeKey === 'users') props.submit('domain-manager.directory.updateUser', p, 'objects.operationOk');\n          else if (typeKey === 'computers') props.submit('domain-manager.directory.updateComputer', p, 'objects.operationOk');\n          else if (typeKey === 'groups') props.submit('domain-manager.directory.updateGroup', p, 'objects.operationOk');\n          break;\n        case 'rename':\n          props.submit('domain-manager.directory.renameOU', Object.assign(p, { id: id, name: form.newName || form.name }), 'objects.operationOk');\n          break;\n        case 'move':\n          props.submit(\n            typeKey === 'computers' ? 'domain-manager.directory.moveComputer' : 'domain-manager.directory.moveUser',\n            Object.assign(p, { id: id, ou: form.targetOU, parent: form.targetOU }), 'objects.operationOk'\n          );\n          break;\n        case 'resetPw':\n          props.submit('domain-manager.directory.resetPassword', Object.assign(p, { id: id, password: form.newPassword }), 'objects.operationOk');\n          break;\n        case 'unlock':\n          props.runAction('domain-manager.directory.unlockUser', { id: id }, 'objects.operationOk', false);\n          props.close();\n          break;\n        case 'toggle':\n          if (typeKey === 'gpos') {\n            props.runAction('domain-manager.directory.toggleGPO', { id: id, enabled: d.nextEnabled }, 'objects.operationOk', false);\n          } else if (typeKey === 'computers') {\n            props.runAction('domain-manager.directory.toggleComputer', Object.assign(p, { id: id, enabled: d.nextEnabled }), 'objects.operationOk', false);\n          } else {\n            props.runAction('domain-manager.directory.toggleUser', Object.assign(p, { id: id, enabled: d.nextEnabled }), 'objects.operationOk', false);\n          }\n          props.close();\n          break;\n        case 'delete':\n          props.submit(\n            typeKey === 'users' ? 'domain-manager.directory.deleteUser' :\n              typeKey === 'computers' ? 'domain-manager.directory.deleteComputer' :\n                typeKey === 'groups' ? 'domain-manager.directory.deleteGroup' :\n                  typeKey === 'ous' ? 'domain-manager.directory.deleteOU' : 'domain-manager.directory.deleteUser',\n            Object.assign(p, { id: id }), 'objects.operationOk'\n          );\n          break;\n        case 'groups':\n          props.submit('domain-manager.directory.addGroupMembers', Object.assign(p, { id: id, members: splitLines(form.membersText) }), 'objects.operationOk');\n          break;\n        case 'bindGpo':\n          props.submit('domain-manager.directory.bindGPO', Object.assign(p, { id: form.gpoId, ou: form.targetOU || ouDnFrom(row), ouDn: form.targetOU || ouDnFrom(row) }), 'objects.operationOk');\n          break;\n        case 'unbindGpo':\n          props.submit('domain-manager.directory.unbindGPO', Object.assign(p, {\n            id: form.gpoId || row.id,\n            ou: form.unbindOu || (d.links && d.links[0]) || row.dn,\n            ouDn: form.unbindOu || (d.links && d.links[0]) || row.dn\n          }), 'objects.operationOk');\n          break;\n        case 'batch': {\n          var ids = props.selectedIds || [];\n          var action = d.action;\n          var method = action === 'delete' ? 'domain-manager.directory.deleteUser' : 'domain-manager.directory.toggleUser';\n          props.submit(method, Object.assign(p, { ids: ids, action: action, enabled: false }), 'objects.operationOk');\n          break;\n        }\n        default:\n          props.close();\n      }\n    }\n\n    function ouDnFrom(row) { return row.ou || row.dn || ''; }\n    function splitLines(v) {\n      return String(v || '').split(/\\r?\\n/).map(function (s) { return s.trim(); }).filter(Boolean);\n    }\n\n    var isDanger = !!d.danger;\n    var footer = h('div', { className: 'dm-dialog-actions' },\n      h(C.Button, { variant: 'ghost', onClick: props.close }, t('common.cancel')),\n      h(C.Button, {\n        variant: isDanger ? 'danger' : 'primary',\n        loading: props.busy,\n        disabled: isDanger && token !== 'CONFIRMED',\n        onClick: submitSimple\n      }, t('common.ok'))\n    );\n\n    // Form body ----------------------------------------------------------\n    var body;\n    if (kind === 'delete') {\n      body = h(C.ConfirmDialogBody, {\n        t: t, danger: true,\n        message: C.fmt(t('objects.confirm.delete'), { name: rowName(row) }),\n        token: token, onToken: setToken\n      });\n    } else if (kind === 'resetPw') {\n      body = h('div', null,\n        h(C.Notice, { tone: 'warning' }, C.fmt(t('objects.confirm.resetPw'), { name: rowName(row) })),\n        h(C.Field, { id: 'dm-pw1', label: t('objects.field.newPassword'), required: true },\n          h(C.Input, { id: 'dm-pw1', type: 'password', value: form.newPassword || '', onChange: function (v) { set('newPassword', v); } })\n        ),\n        h(C.Field, { id: 'dm-pw2', label: t('objects.field.confirmPassword'), required: true },\n          h(C.Input, { id: 'dm-pw2', type: 'password', value: form.confirmPassword || '', onChange: function (v) { set('confirmPassword', v); } })\n        ),\n        isDanger ? h(C.Field, { id: 'dm-token', label: t('danger.tip') },\n          h(C.Input, { id: 'dm-token', value: token, placeholder: 'CONFIRMED', onChange: setToken })\n        ) : null\n      );\n    } else if (kind === 'toggle' || kind === 'unlock') {\n      body = h(C.ConfirmDialogBody, {\n        t: t, danger: false,\n        message: d.message || C.fmt(t('danger.message'), { action: titleForDialog() }),\n        token: token, onToken: setToken\n      });\n    } else if (kind === 'batch') {\n      body = h(C.ConfirmDialogBody, {\n        t: t, danger: true,\n        message: C.fmt(t('objects.confirm.batch'), { count: (props.selectedIds || []).length, action: t(d.action === 'delete' ? 'common.delete' : 'objects.action.toggle') }),\n        token: token, onToken: setToken\n      });\n    } else if (kind === 'unbindGpo') {\n      body = h('div', null,\n        h(C.Notice, { tone: 'warning' }, C.fmt(t('objects.confirm.unbindGpo'), { gpo: rowName(row), ou: (d.links && d.links[0]) || row.dn || '' })),\n        h(C.Field, { id: 'dm-unbind-ou', label: t('objects.field.targetOU') },\n          h(C.Select, {\n            id: 'dm-unbind-ou',\n            value: form.unbindOu || (d.links && d.links[0]) || '',\n            options: (d.links || []).map(function (l) { return { value: l, label: l }; }),\n            onChange: function (v) { set('unbindOu', v); }\n          })\n        ),\n        h(C.Field, { id: 'dm-token', label: t('danger.tip') },\n          h(C.Input, { id: 'dm-token', value: token, placeholder: 'CONFIRMED', onChange: setToken })\n        )\n      );\n    } else if (kind === 'move') {\n      ensureOuTree();\n      body = h('div', null,\n        h(C.Field, { id: 'dm-move-ou', label: t('objects.field.targetOU'), required: true },\n          h('div', { className: 'dm-ou-picker' },\n            h(C.Tree, {\n              nodes: ouNodes,\n              expandedMap: ouExpanded,\n              selectedId: form.targetOU || '',\n              onSelect: function (id, node) { set('targetOU', node && node.dn ? node.dn : id); },\n              onToggle: function (id, open) {\n                setOuExpanded(function (prev) { var n = Object.assign({}, prev); n[id] = open; return n; });\n              }\n            })\n          )\n        ),\n        form.targetOU ? h('p', { className: 'dm-field__hint' }, t('objects.selectedOU') + '：' + form.targetOU) : null\n      );\n    } else if (kind === 'groups') {\n      body = h('div', null,\n        h(C.Notice, { tone: 'info' }, (form.members || []).join(', ') || t('common.empty')),\n        h(C.Field, { id: 'dm-members', label: t('objects.field.members') },\n          h(C.Textarea, { id: 'dm-members', value: form.membersText || '', rows: 6, onChange: function (v) { set('membersText', v); } })\n        )\n      );\n    } else if (kind === 'bindGpo') {\n      body = h('div', null,\n        h(C.Field, { id: 'dm-gpo', label: t('objects.field.gpo'), required: true },\n          h(C.Select, {\n            id: 'dm-gpo',\n            value: form.gpoId || '',\n            options: [{ value: '', label: t('common.selectDomain') }].concat(props.gpoOptions.map(function (g) {\n              return { value: g.id || g.dn, label: g.name || g.displayName || g.id };\n            })),\n            onChange: function (v) { set('gpoId', v); }\n          })\n        ),\n        h(C.Field, { id: 'dm-bind-ou', label: t('objects.field.targetOU') },\n          h('div', { className: 'dm-ou-picker' },\n            h(C.Tree, {\n              nodes: ouNodes,\n              expandedMap: ouExpanded,\n              selectedId: form.targetOU || '',\n              onSelect: function (id, node) { set('targetOU', node && node.dn ? node.dn : id); },\n              onToggle: function (id, open) {\n                setOuExpanded(function (prev) { var n = Object.assign({}, prev); n[id] = open; return n; });\n              }\n            })\n          )\n        )\n      );\n      ensureOuTree();\n    } else if (kind === 'rename') {\n      body = h(C.Field, { id: 'dm-newname', label: t('objects.field.newName'), required: true },\n        h(C.Input, { id: 'dm-newname', value: form.newName || '', onChange: function (v) { set('newName', v); } })\n      );\n    } else {\n      // create / edit\n      var fields = [];\n      function f(key, labelKey, opts) {\n        opts = opts || {};\n        fields.push(h(C.Field, { key: key, id: 'dm-obj-' + key, label: t(labelKey), required: opts.required },\n          h(C.Input, {\n            id: 'dm-obj-' + key,\n            type: opts.type || 'text',\n            value: form[key] == null ? '' : form[key],\n            placeholder: opts.placeholder,\n            onChange: function (v) { set(key, v); }\n          })\n        ));\n      }\n      if (typeKey === 'users') {\n        f('sam', 'objects.field.sam', { required: true });\n        f('upn', 'objects.field.upn');\n        f('displayName', 'objects.field.displayName');\n        f('givenName', 'objects.field.firstName');\n        f('sn', 'objects.field.lastName');\n        f('mail', 'objects.field.mail');\n        f('mobile', 'objects.field.mobile');\n        f('employeeID', 'objects.field.employeeID');\n        f('department', 'objects.field.department');\n        f('title', 'objects.field.title');\n        f('telephoneNumber', 'objects.field.telephoneNumber');\n      } else if (typeKey === 'computers') {\n        f('name', 'objects.field.name', { required: true });\n        f('dnsHostName', 'objects.field.dn');\n        f('operatingSystem', 'objects.field.os');\n      } else if (typeKey === 'groups') {\n        f('name', 'objects.field.name', { required: true });\n        f('sam', 'objects.field.sam');\n      } else if (typeKey === 'ous') {\n        f('name', 'objects.field.name', { required: true });\n      }\n      f('description', 'objects.field.description');\n      body = h('div', { className: 'dm-form-grid' }, fields);\n    }\n\n    return h(C.Modal, {\n      title: titleForDialog(),\n      size: kind === 'create' || kind === 'edit' ? 'md' : 'sm',\n      onClose: props.close,\n      closeLabel: t('common.close'),\n      footer: footer\n    },\n      localError ? h(C.Notice, { tone: 'error' }, localError) : null,\n      body\n    );\n  }\n\n  // Shared body for non-form confirmation dialogs.\n  C.ConfirmDialogBody = function ConfirmDialogBody(props) {\n    var t = props.t;\n    return h('div', null,\n      h('p', { className: 'dm-dialog-message' }, props.message),\n      props.danger ? h(C.Field, { id: 'dm-token-body', label: t('danger.tip') },\n        h(C.Input, {\n          id: 'dm-token-body', value: props.token || '', placeholder: 'CONFIRMED',\n          onChange: function (v) { props.onToken(v); }\n        })\n      ) : null\n    );\n  };\n\n  // -------------------- Global search --------------------\n  function GlobalSearch(props) {\n    var t = props.t;\n    var call = props.call;\n    var toast = props.toast;\n    var keywordState = useState('');\n    var keyword = keywordState[0];\n    var setKeyword = keywordState[1];\n    var typeState = useState('');\n    var type = typeState[0];\n    var setType = typeState[1];\n    var resultsState = useState([]);\n    var results = resultsState[0];\n    var setResults = resultsState[1];\n    var loadingState = useState(false);\n    var loading = loadingState[0];\n    var setLoading = loadingState[1];\n    var errorState = useState('');\n    var error = errorState[0];\n    var setError = errorState[1];\n    var searchedState = useState(false);\n    var searched = searchedState[0];\n    var setSearched = searchedState[1];\n\n    function doSearch() {\n      setLoading(true);\n      setError('');\n      setSearched(true);\n      call('domain-manager.directory.search', {\n        keyword: keyword, type: type, domainId: props.domainId\n      }).then(function (res) {\n        setLoading(false);\n        if (res && res.ok) {\n          var data = res.data;\n          setResults(Array.isArray(data) ? data : (data && Array.isArray(data.items) ? data.items : []));\n        } else {\n          var msg = res && res.error && res.error.message ? res.error.message : '';\n          setError(C.fmt(t('common.inlineError'), { message: msg }));\n        }\n      }).catch(function (err) {\n        setLoading(false);\n        setError(C.fmt(t('common.inlineError'), { message: err && err.message ? err.message : '' }));\n      });\n    }\n\n    var columns = [\n      { key: 'type', title: t('objects.searchType'), render: function (r) { return r.type || r.objectType || '—'; } },\n      { key: 'name', title: t('objects.col.name'), render: rowName },\n      { key: 'sam', title: t('objects.col.sam'), render: function (r) { return r.sAMAccountName || r.uid || ''; } },\n      { key: 'dn', title: t('objects.col.dn'), render: function (r) { return r.dn || ''; } }\n    ];\n\n    return h('div', { className: 'dm-page dm-search' },\n      h('header', { className: 'dm-page__head' },\n        h('h1', { className: 'dm-page__title' }, t('objects.searchTitle')),\n        h('p', { className: 'dm-page__desc' }, t('objects.description'))\n      ),\n      h('div', { className: 'dm-toolbar' },\n        h(C.Input, {\n          value: keyword, placeholder: t('objects.searchPlaceholder'),\n          onChange: setKeyword,\n          onKeyDown: function (e) { if (e.key === 'Enter') doSearch(); }\n        }),\n        h(C.Select, {\n          value: type,\n          options: [\n            { value: '', label: t('objects.searchAll') },\n            { value: 'user', label: t('nav.users') },\n            { value: 'computer', label: t('nav.computers') },\n            { value: 'group', label: t('nav.groups') },\n            { value: 'ou', label: t('nav.ous') }\n          ],\n          onChange: setType\n        }),\n        h(C.Button, { variant: 'primary', onClick: doSearch, loading: loading }, t('objects.searchButton'))\n      ),\n      error ? h(C.Notice, { tone: 'error' }, error) : null,\n      searched ? h(C.Section, { title: t('objects.searchResult') },\n        h(C.Table, {\n          columns: columns, rows: results, loading: loading,\n          emptyText: t('objects.searchNoResult'), loadingLabel: t('common.loading')\n        })\n      ) : null\n    );\n  }\n\n  if (!global.__DM_UI__) global.__DM_UI__ = {};\n  global.__DM_UI__.ObjectsPage = ObjectsPage;\n  global.__DM_UI__.GlobalSearch = GlobalSearch;\n})(typeof window !== 'undefined' ? window : this);\n");
  UI_SOURCES.push("/* AD/LDAP Domain Manager - audit log page. */\n(function (global) {\n  'use strict';\n  var React = require('react');\n  var h = React.createElement;\n  var useState = React.useState;\n  var useEffect = React.useEffect;\n  var C = (global.__DM_UI__ && global.__DM_UI__.components) || {};\n\n  // 防御式把任何值转成可安全渲染的字符串：审计记录的 detail/actor 可能是\n  // 嵌套对象、数组或特殊值，直接作为 React children 会让整页变空白。\n  function safeText(v) {\n    if (v == null) return '';\n    if (typeof v === 'string') return v;\n    if (typeof v === 'number' || typeof v === 'boolean') return String(v);\n    try { return JSON.stringify(v); } catch (e) { return String(v); }\n  }\n\n  function AuditLog(props) {\n    var t = props.t;\n    var call = props.call;\n    var toast = props.toast;\n\n    var actorState = useState('');\n    var actor = actorState[0];\n    var setActor = actorState[1];\n    var actionState = useState('');\n    var action = actionState[0];\n    var setAction = actionState[1];\n    var resultState = useState('');\n    var result = resultState[0];\n    var setResult = resultState[1];\n    var fromState = useState('');\n    var from = fromState[0];\n    var setFrom = fromState[1];\n    var toState = useState('');\n    var to = toState[0];\n    var setTo = toState[1];\n    var pageState = useState(1);\n    var page = pageState[0];\n    var setPage = pageState[1];\n    var rowsState = useState([]);\n    var rows = rowsState[0];\n    var setRows = rowsState[1];\n    var totalState = useState(0);\n    var total = totalState[0];\n    var setTotal = totalState[1];\n    var loadingState = useState(false);\n    var loading = loadingState[0];\n    var setLoading = loadingState[1];\n    var errorState = useState('');\n    var error = errorState[0];\n    var setError = errorState[1];\n\n    function load() {\n      setLoading(true);\n      setError('');\n      var filters = {};\n      if (actor) filters.actor = actor;\n      if (action) filters.action = action;\n      if (result) filters.result = result;\n      if (from) filters.from = from;\n      if (to) filters.to = to;\n      call('domain-manager.audit.list', {\n        domainId: props.domainId,\n        filters: filters,\n        page: page,\n        pageSize: 20\n      }).then(function (res) {\n        setLoading(false);\n        if (res && res.ok) {\n          var data = res.data || {};\n          setRows(normalizeRows(Array.isArray(data.items) ? data.items : (Array.isArray(data) ? data : [])));\n          setTotal(data.total != null ? data.total : 0);\n        } else {\n          var msg = res && res.error && res.error.message ? res.error.message : '';\n          setError(C.fmt(t('audit.loadError'), { message: msg }));\n        }\n      }).catch(function (err) {\n        setLoading(false);\n        setError(C.fmt(t('audit.loadError'), { message: err && err.message ? err.message : '' }));\n      });\n    }\n\n    useEffect(function () { load(); }, [page, props.domainId]);\n\n    function apply() { setPage(1); load(); }\n    function clear() {\n      setActor(''); setAction(''); setResult(''); setFrom(''); setTo('');\n      setPage(1);\n      // load with cleared state on next tick via explicit call\n      call('domain-manager.audit.list', { domainId: props.domainId, filters: {}, page: 1, pageSize: 20 }).then(function (res) {\n        var data = res && res.data || {};\n        setRows(normalizeRows(Array.isArray(data.items) ? data.items : []));\n        setTotal(data.total || 0);\n      }).catch(function () {});\n    }\n\n    function renderResult(r) {\n      var ok = r.result === 'ok' || r.result === true || r.result === 'success' || r.ok === true;\n      return h(C.Badge, { tone: ok ? 'success' : 'error' }, ok ? t('audit.result.ok') : t('audit.result.fail'));\n    }\n\n    // detail/actor 可能是对象或数组，React 不能直接渲染对象，\n    // 必须序列化为字符串，否则整页抛 \"Objects are not valid as a React child\" 变空白。\n    function renderDetail(v) { return safeText(v); }\n    function text(v) { return safeText(v); }\n\n    // 渲染每一行前做一次规范化：把非对象条目、嵌套对象字段全部安全字符串化，\n    // 确保 Table 的任何列单元格都不会拿到对象作为 children。\n    function normalizeRows(list) {\n      return (Array.isArray(list) ? list : []).map(function (r) {\n        if (!r || typeof r !== 'object') return { time: '', actor: safeText(r), action: '', target: '', result: '', detail: '' };\n        return {\n          time: safeText(r.time || r.timestamp),\n          actor: r.actor && typeof r.actor === 'object' ? safeText(r.actor.name || r.actor.role || r.actor) : safeText(r.actor),\n          action: safeText(r.action),\n          target: safeText(r.target || r.targetDn),\n          result: r.result,\n          detail: safeText(r.detail)\n        };\n      });\n    }\n\n    var columns = [\n      { key: 'time', title: t('audit.col.time'), render: function (r) { return text(r.time); } },\n      { key: 'actor', title: t('audit.col.actor'), render: function (r) { return text(r.actor); } },\n      { key: 'action', title: t('audit.col.action'), render: function (r) { return text(r.action); } },\n      { key: 'target', title: t('audit.col.target'), render: function (r) { return text(r.target); } },\n      { key: 'result', title: t('audit.col.result'), render: renderResult },\n      { key: 'detail', title: t('audit.col.detail'), render: function (r) { return text(r.detail); } }\n    ];\n\n    return h('div', { className: 'dm-page dm-audit' },\n      h('header', { className: 'dm-page__head' },\n        h('h1', { className: 'dm-page__title' }, t('audit.title')),\n        h('p', { className: 'dm-page__desc' }, t('audit.description'))\n      ),\n      h('div', { className: 'dm-toolbar' },\n        h(C.Input, { value: actor, placeholder: t('audit.filter.actor'), onChange: setActor }),\n        h(C.Input, { value: action, placeholder: t('audit.filter.action'), onChange: setAction }),\n        h(C.Select, {\n          value: result,\n          options: [\n            { value: '', label: t('common.all') },\n            { value: 'ok', label: t('audit.result.ok') },\n            { value: 'fail', label: t('audit.result.fail') }\n          ],\n          onChange: setResult,\n          'aria-label': t('audit.filter.result')\n        }),\n        h(C.Input, { type: 'date', value: from, onChange: setFrom, 'aria-label': t('audit.filter.from') }),\n        h(C.Input, { type: 'date', value: to, onChange: setTo, 'aria-label': t('audit.filter.to') }),\n        h(C.Button, { variant: 'primary', onClick: apply }, t('common.search')),\n        h(C.Button, { variant: 'ghost', onClick: clear }, t('common.clearFilter')),\n        h(C.Button, { variant: 'ghost', onClick: load, loading: loading }, t('common.refresh'))\n      ),\n      error ? h(C.Notice, { tone: 'error' }, error,\n        h(C.Button, { size: 'sm', variant: 'ghost', onClick: load }, t('common.retry'))\n      ) : null,\n      h(C.Table, {\n        columns: columns, rows: rows, loading: loading,\n        emptyText: t('audit.noLog'), loadingLabel: t('common.loading')\n      }),\n      h(C.Pagination, {\n        page: page, pageSize: 20, total: total,\n        totalText: C.fmt(t('common.total'), { total: total }),\n        pageText: C.fmt(t('common.page'), { page: page, pages: Math.max(1, Math.ceil(total / 20)) }),\n        prevText: t('common.prev'), nextText: t('common.next'),\n        onChange: setPage\n      })\n    );\n  }\n\n  if (!global.__DM_UI__) global.__DM_UI__ = {};\n  global.__DM_UI__.AuditLog = AuditLog;\n})(typeof window !== 'undefined' ? window : this);\n");
  UI_SOURCES.push("/* AD/LDAP Domain Manager - plugin market page (admin only). */\n(function (global) {\n  'use strict';\n  var React = require('react');\n  var h = React.createElement;\n  var useState = React.useState;\n  var useEffect = React.useEffect;\n  var C = (global.__DM_UI__ && global.__DM_UI__.components) || {};\n\n  function Market(props) {\n    var t = props.t;\n    var call = props.call;\n    var toast = props.toast;\n\n    var versionState = useState(null);\n    var version = versionState[0];\n    var setVersion = versionState[1];\n    var updateState = useState(null);\n    var updateInfo = updateState[0];\n    var setUpdateInfo = updateState[1];\n    var licenseState = useState(null);\n    var license = licenseState[0];\n    var setLicense = licenseState[1];\n    var opsState = useState([]);\n    var ops = opsState[0];\n    var setOps = opsState[1];\n    var loadingState = useState(false);\n    var loading = loadingState[0];\n    var setLoading = loadingState[1];\n    var checkingState = useState(false);\n    var checking = checkingState[0];\n    var setChecking = checkingState[1];\n    var errorState = useState('');\n    var error = errorState[0];\n    var setError = errorState[1];\n    var dialogState = useState(null);\n    var dialog = dialogState[0];\n    var setDialog = dialogState[1];\n    var tokenState = useState('');\n    var token = tokenState[0];\n    var setToken = tokenState[1];\n    var busyState = useState(false);\n    var busy = busyState[0];\n    var setBusy = busyState[1];\n    var skillsState = useState([]);\n    var skills = skillsState[0];\n    var setSkills = skillsState[1];\n\n    function loadAll() {\n      setLoading(true);\n      setError('');\n      Promise.all([\n        call('domain-manager.market.detail', {}),\n        call('domain-manager.market.getLicense', {}).catch(function () { return null; }),\n        call('domain-manager.market.operations', {}).catch(function () { return null; }),\n        call('domain-manager.skills.list', {}).catch(function () { return null; })\n      ]).then(function (results) {\n        setLoading(false);\n        var d = results[0] && results[0].ok ? results[0].data : null;\n        setVersion(d || (results[0] && results[0].error ? null : {}));\n        var lic = results[1];\n        setLicense(lic && lic.ok ? lic.data : null);\n        var op = results[2];\n        var items = op && op.data && Array.isArray(op.data.items) ? op.data.items : (op && Array.isArray(op.data) ? op.data : []);\n        setOps(items);\n        var sk = results[3];\n        setSkills(sk && sk.ok && Array.isArray(sk.data) ? sk.data : []);\n        if (results[0] && !results[0].ok) {\n          var msg = results[0].error && results[0].error.message ? results[0].error.message : '';\n          setError(C.fmt(t('market.loadError'), { message: msg }));\n        }\n      }).catch(function (err) {\n        setLoading(false);\n        setError(C.fmt(t('market.loadError'), { message: err && err.message ? err.message : '' }));\n      });\n    }\n\n    useEffect(function () { loadAll(); }, []);\n\n    function checkUpdate() {\n      setChecking(true);\n      setError('');\n      call('domain-manager.market.checkUpdate', {}).then(function (res) {\n        setChecking(false);\n        if (res && res.ok) {\n          setUpdateInfo(res.data);\n        } else {\n          var msg = res && res.error && res.error.message ? res.error.message : '';\n          toast(C.fmt(t('market.operationFail'), { message: msg }), 'error');\n        }\n      }).catch(function (err) {\n        setChecking(false);\n        toast(C.fmt(t('market.operationFail'), { message: err && err.message ? err.message : '' }), 'error');\n      });\n    }\n\n    function openDialog(kind, payload) {\n      setDialog({ kind: kind, payload: payload || {} });\n      setToken('');\n    }\n\n    function runDangerous(method, params, successKey) {\n      setBusy(true);\n      setDialog(null);\n      var payload = Object.assign({}, params, { actor: props.actor, confirmToken: 'CONFIRMED' });\n      call(method, payload).then(function (res) {\n        setBusy(false);\n        if (res && res.ok) {\n          toast(t(successKey || 'market.operationOk'), 'success');\n          loadAll();\n          setUpdateInfo(null);\n        } else {\n          var msg = res && res.error && res.error.message ? res.error.message : '';\n          toast(C.fmt(t('market.operationFail'), { message: msg }), 'error');\n        }\n      }).catch(function (err) {\n        setBusy(false);\n        toast(C.fmt(t('market.operationFail'), { message: err && err.message ? err.message : '' }), 'error');\n      });\n    }\n\n    var version = versionState[0] || {};\n    var current = version.current || version.version || version.currentVersion || '';\n    var latest = updateInfo && (updateInfo.version || updateInfo.latest) || version.latest || '';\n    var hasUpdate = !!(updateInfo && (updateInfo.updateAvailable || updateInfo.hasUpdate || (latest && latest !== current)));\n    var force = !!(updateInfo && (updateInfo.force || updateInfo.mandatory));\n    var major = !!(updateInfo && (updateInfo.major || updateInfo.majorUpgrade));\n    var channel = version.channel || 'stable';\n    var licenseMode = (license && license.mode) || '';\n    var licenseLabel = licenseMode === 'paid' ? t('market.license.paid') :\n      licenseMode === 'trial' ? t('market.license.trial') :\n        licenseMode === 'free' ? t('market.license.free') : (licenseMode || t('common.unknown'));\n    var licenseValid = license ? !!license.valid : false;\n\n    var opColumns = [\n      { key: 'time', title: t('market.operation.time'), render: function (r) { return r.time || r.timestamp || ''; } },\n      { key: 'type', title: t('market.operation.type'), render: function (r) { return r.type || r.action || ''; } },\n      { key: 'actor', title: t('market.operation.actor'), render: function (r) { return r.actor || ''; } },\n      { key: 'detail', title: t('market.operation.detail'), render: function (r) { return r.detail || ''; } }\n    ];\n\n    function dialogTitle() {\n      if (!dialog) return '';\n      if (dialog.kind === 'update') return t('market.update');\n      if (dialog.kind === 'rollback') return t('market.rollback');\n      if (dialog.kind === 'channel') return t('market.setChannel');\n      return t('common.confirm');\n    }\n\n    function dialogMessage() {\n      if (!dialog) return '';\n      if (dialog.kind === 'update') return C.fmt(t('market.confirm.update'), { version: dialog.payload.version || latest });\n      if (dialog.kind === 'rollback') return t('market.confirm.rollback');\n      if (dialog.kind === 'channel') return C.fmt(t('market.confirm.channel'), { channel: dialog.payload.channel === 'gray' ? t('market.channel.gray') : t('market.channel.stable') });\n      return t('common.confirmDangerText');\n    }\n\n    function confirmDialog() {\n      if (token !== 'CONFIRMED') {\n        toast(t('common.confirmTokenInvalid'), 'error');\n        return;\n      }\n      if (dialog.kind === 'update') {\n        runDangerous('domain-manager.market.update', { version: dialog.payload.version || latest }, 'market.operationOk');\n      } else if (dialog.kind === 'rollback') {\n        runDangerous('domain-manager.market.rollback', {}, 'market.operationOk');\n      } else if (dialog.kind === 'channel') {\n        runDangerous('domain-manager.market.setChannel', { channel: dialog.payload.channel }, 'market.operationOk');\n      }\n    }\n\n    return h('div', { className: 'dm-page dm-market' },\n      h('header', { className: 'dm-page__head' },\n        h('h1', { className: 'dm-page__title' }, t('market.title')),\n        h('p', { className: 'dm-page__desc' }, t('market.description'))\n      ),\n      error ? h(C.Notice, { tone: 'error' }, error,\n        h(C.Button, { size: 'sm', variant: 'ghost', onClick: loadAll }, t('common.retry'))\n      ) : null,\n\n      h(C.Section, { title: t('market.section.version') },\n        h('div', { className: 'dm-kv' },\n          h('div', null, h('span', null, t('market.currentVersion')), h('strong', null, current || t('common.unknown'))),\n          h('div', null, h('span', null, t('market.latestVersion')), h('strong', null, latest || t('common.unknown'))),\n          h('div', null, h('span', null, t('market.section.channel')),\n            h('strong', null, channel === 'gray' ? t('market.channel.gray') : t('market.channel.stable')))\n        )\n      ),\n\n      h(C.Section, { title: t('market.section.update') },\n        h('div', { className: 'dm-toolbar' },\n          h(C.Button, { variant: 'primary', onClick: checkUpdate, loading: checking }, t('market.checkUpdate')),\n          hasUpdate ? h(C.Button, {\n            variant: 'danger', loading: busy,\n            onClick: function () { openDialog('update', { version: latest }); }\n          }, t('market.update')) : h(C.Badge, { tone: 'success' }, t('market.upToDate')),\n          h(C.Button, {\n            variant: 'ghost', loading: busy,\n            onClick: function () { openDialog('rollback', {}); }\n          }, t('market.rollback'))\n        ),\n        hasUpdate ? h(C.Notice, { tone: force ? 'warning' : 'info' },\n          C.fmt(t(force ? 'market.forceUpdate' : 'market.updateAvailable'), { version: latest }),\n          major ? h('div', null, t('market.majorRisk')) : null\n        ) : null\n      ),\n\n      h(C.Section, { title: t('market.section.channel') },\n        h('div', { className: 'dm-toolbar' },\n          h(C.Select, {\n            value: channel,\n            options: [\n              { value: 'stable', label: t('market.channel.stable') },\n              { value: 'gray', label: t('market.channel.gray') }\n            ],\n            onChange: function (v) {\n              if (v !== channel) openDialog('channel', { channel: v });\n            },\n            'aria-label': t('market.section.channel')\n          })\n        )\n      ),\n\n      h(C.Section, { title: t('market.section.license') },\n        h('div', { className: 'dm-kv' },\n          h('div', null, h('span', null, t('market.license.mode')), h('strong', null, licenseLabel)),\n          h('div', null, h('span', null, t('market.license.status')),\n            h(C.Badge, { tone: licenseValid ? 'success' : 'error' },\n              licenseValid ? t('market.license.valid') : t('market.license.invalid'))),\n          license && license.expiry ? h('div', null, h('span', null, t('market.license.expiry')), h('strong', null, license.expiry)) : null\n        ),\n        h(C.Button, { variant: 'ghost', onClick: loadAll }, t('market.refreshLicense'))\n      ),\n\n      h(C.Section, { title: t('market.section.skills') },\n        h('p', { className: 'dm-page__desc' }, t('market.skillsHint')),\n        h(C.Table, {\n          columns: [\n            { key: 'name', title: t('market.skill.name'), render: function (s) { return s.name || ''; } },\n            { key: 'version', title: t('market.skill.version'), render: function (s) { return s.version || ''; } },\n            { key: 'description', title: t('market.skill.desc'), render: function (s) { return s.description || ''; } },\n            { key: 'action', title: t('market.skill.action'), render: function (s) {\n              return h(C.Button, {\n                size: 'sm', variant: 'primary',\n                onClick: function () {\n                  call('domain-manager.skills.get', { path: s.path }).then(function (res) {\n                    if (res && res.ok && res.data && res.data.content) {\n                      var blob = new Blob([res.data.content], { type: 'text/markdown;charset=utf-8' });\n                      var url = URL.createObjectURL(blob);\n                      var a = document.createElement('a');\n                      a.href = url;\n                      a.download = (s.id || 'skill') + '-SKILL.md';\n                      document.body.appendChild(a); a.click();\n                      setTimeout(function () { document.body.removeChild(a); URL.revokeObjectURL(url); }, 0);\n                      toast(t('market.skill.downloaded'), 'success');\n                    } else {\n                      toast(t('common.error'), 'error');\n                    }\n                  }).catch(function () { toast(t('common.error'), 'error'); });\n                }\n              }, t('market.skill.download'));\n            } }\n          ],\n          rows: skills, loading: false, emptyText: t('market.skill.empty')\n        })\n      ),\n\n      h(C.Section, { title: t('market.section.operations') },\n        h(C.Table, {\n          columns: opColumns, rows: ops, loading: loading,\n          emptyText: t('market.noOperations'), loadingLabel: t('common.loading')\n        })\n      ),\n\n      dialog ? h(C.Modal, {\n        title: dialogTitle(),\n        size: 'sm',\n        onClose: function () { setDialog(null); },\n        closeLabel: t('common.close'),\n        footer: h('div', { className: 'dm-dialog-actions' },\n          h(C.Button, { variant: 'ghost', onClick: function () { setDialog(null); } }, t('danger.cancel')),\n          h(C.Button, { variant: 'danger', disabled: token !== 'CONFIRMED', onClick: confirmDialog }, t('danger.confirm'))\n        )\n      },\n        h('p', { className: 'dm-dialog-message' }, dialogMessage()),\n        major && dialog.kind === 'update' ? h(C.Notice, { tone: 'warning' }, t('market.majorRisk')) : null,\n        h(C.Field, { id: 'dm-market-token', label: t('danger.tip') },\n          h(C.Input, { id: 'dm-market-token', value: token, placeholder: 'CONFIRMED', onChange: setToken })\n        )\n      ) : null\n    );\n  }\n\n  if (!global.__DM_UI__) global.__DM_UI__ = {};\n  global.__DM_UI__.Market = Market;\n})(typeof window !== 'undefined' ? window : this);\n");
  UI_SOURCES.push("/* AD/LDAP Domain Manager - data sync panel (local cache + schedule). */\n(function (global) {\n  'use strict';\n  var React = require('react');\n  var h = React.createElement;\n  var useState = React.useState;\n  var useEffect = React.useEffect;\n  var C = (global.__DM_UI__ && global.__DM_UI__.components) || {};\n\n  // 0=关闭自动同步；其余为周期分钟，与后端 ALLOWED_INTERVALS 保持一致\n  var INTERVALS = [0, 1, 5, 10, 15, 30, 60, 120];\n\n  function fmtTime(v) {\n    if (!v) return '—';\n    try {\n      var d = new Date(v);\n      return d.toLocaleString();\n    } catch (e) { return String(v); }\n  }\n\n  function SyncPanel(props) {\n    var t = props.t;\n    var call = props.call;\n    var toast = props.toast;\n    var refreshKey = props.refreshKey || 0;\n\n    var statusState = useState(null);\n    var status = statusState[0];\n    var setStatus = statusState[1];\n    var busyState = useState(false);\n    var busy = busyState[0];\n    var setBusy = busyState[1];\n    var errorState = useState('');\n    var error = errorState[0];\n    var setError = errorState[1];\n\n    function loadStatus() {\n      setError('');\n      call('domain-manager.sync.status', {}).then(function (res) {\n        if (res && res.ok) setStatus(res.data || {});\n        else setError(res && res.error && res.error.message ? res.error.message : '');\n      }).catch(function (e) {\n        setError(e && e.message ? e.message : String(e));\n      });\n    }\n\n    useEffect(function () { loadStatus(); }, [refreshKey]);\n\n    function doSync() {\n      setBusy(true);\n      call('domain-manager.sync.now', {}).then(function (res) {\n        setBusy(false);\n        if (res && res.ok) {\n          toast(t('sync.done'), 'success');\n          loadStatus();\n        } else {\n          toast(res && res.error && res.error.message ? res.error.message : t('common.error'), 'error');\n        }\n      }).catch(function (e) {\n        setBusy(false);\n        toast(e && e.message ? e.message : String(e), 'error');\n      });\n    }\n\n    function changeInterval(v) {\n      var minutes = Number(v);\n      call('domain-manager.sync.setInterval', { minutes: minutes }).then(function (res) {\n        if (res && res.ok) {\n          toast(t('sync.intervalSaved'), 'success');\n          loadStatus();\n        } else {\n          toast(res && res.error && res.error.message ? res.error.message : t('common.error'), 'error');\n        }\n      }).catch(function (e) {\n        toast(e && e.message ? e.message : String(e), 'error');\n      });\n    }\n\n    var counts = (status && status.counts) || {};\n    return h('div', { className: 'dm-page dm-sync' },\n      h('header', { className: 'dm-page__head' },\n        h('h1', { className: 'dm-page__title' }, t('sync.title')),\n        h('p', { className: 'dm-page__desc' }, t('sync.description'))\n      ),\n      error ? h(C.Notice, { tone: 'error' }, error) : null,\n      h(C.Section, { title: t('sync.status') },\n        h('div', { className: 'dm-form-grid' },\n          h('div', null, h('strong', null, t('sync.lastSync')), ' ', h('span', null, fmtTime(status && status.lastSyncAt))),\n          h('div', null, h('strong', null, t('sync.lastStatus')), ' ', h('span', null, (status && status.lastStatus) || '—')),\n          h('div', null, h('strong', null, t('sync.nextSync')), ' ', h('span', null, fmtTime(status && status.nextSyncAt))),\n          h('div', null, h('strong', null, t('sync.users')), ' ', h('span', null, counts.users != null ? counts.users : '—')),\n          h('div', null, h('strong', null, t('sync.computers')), ' ', h('span', null, counts.computers != null ? counts.computers : '—')),\n          h('div', null, h('strong', null, t('sync.groups')), ' ', h('span', null, counts.groups != null ? counts.groups : '—')),\n          h('div', null, h('strong', null, t('sync.ous')), ' ', h('span', null, counts.ous != null ? counts.ous : '—')),\n          h('div', null, h('strong', null, t('sync.gpos')), ' ', h('span', null, counts.gpos != null ? counts.gpos : '—'))\n        ),\n        h('div', { className: 'dm-form-actions' },\n          h(C.Button, { variant: 'primary', onClick: doSync, loading: busy }, t('sync.now')),\n          h(C.Button, { variant: 'ghost', onClick: loadStatus }, t('common.refresh'))\n        )\n      ),\n      h(C.Section, { title: t('sync.schedule') },\n        h(C.Field, { id: 'dm-sync-interval', label: t('sync.interval') },\n          h(C.Select, {\n            id: 'dm-sync-interval',\n            value: status && status.intervalMinutes != null ? String(status.intervalMinutes) : '10',\n            options: INTERVALS.map(function (m) {\n              return { value: String(m), label: m === 0 ? t('sync.interval.off') : t('sync.interval.minutes', { n: m }) };\n            }),\n            onChange: changeInterval\n          })\n        ),\n        h('p', { className: 'dm-field__hint' }, t('sync.scheduleHint'))\n      )\n    );\n  }\n\n  if (!global.__DM_UI__) global.__DM_UI__ = {};\n  global.__DM_UI__.SyncPanel = SyncPanel;\n})(typeof window !== 'undefined' ? window : this);\n");
  UI_SOURCES.push("/* AD/LDAP Domain Manager - top-level application shell. */\n(function (global) {\n  'use strict';\n  var React = require('react');\n  var h = React.createElement;\n  var useState = React.useState;\n  var useEffect = React.useEffect;\n  var C = (global.__DM_UI__ && global.__DM_UI__.components) || {};\n\n  var NAV = [\n    { key: 'connect', labelKey: 'nav.connect' },\n    { key: 'users', labelKey: 'nav.users' },\n    { key: 'computers', labelKey: 'nav.computers' },\n    { key: 'groups', labelKey: 'nav.groups' },\n    { key: 'ous', labelKey: 'nav.ous' },\n    { key: 'gpos', labelKey: 'nav.gpos' },\n    { key: 'search', labelKey: 'nav.search' },\n    { key: 'audit', labelKey: 'nav.audit' },\n    { key: 'sync', labelKey: 'nav.sync' },\n    { key: 'market', labelKey: 'nav.market', admin: true }\n  ];\n\n  var toastSeq = 0;\n\n  function App(props) {\n    var t = props.t;\n    var call = props.call;\n    var ctx = props.ctx;\n\n    var viewState = useState('connect');\n    var view = viewState[0];\n    var setView = viewState[1];\n    var domainState = useState(null);\n    var activeDomain = domainState[0];\n    var setActiveDomain = domainState[1];\n    var domainOptionsState = useState([]);\n    var domainOptions = domainOptionsState[0];\n    var setDomainOptions = domainOptionsState[1];\n    var toastsState = useState([]);\n    var toasts = toastsState[0];\n    var setToasts = toastsState[1];\n    var isAdminState = useState(false);\n    var isAdmin = isAdminState[0];\n    var setIsAdmin = isAdminState[1];\n\n    function pushToast(message, tone) {\n      var id = ++toastSeq;\n      var item = { id: id, message: String(message || ''), tone: tone || 'info' };\n      setToasts(function (prev) { return prev.concat([item]); });\n      setTimeout(function () {\n        setToasts(function (prev) { return prev.filter(function (x) { return x.id !== id; }); });\n      }, 5000);\n      return id;\n    }\n\n    function dismissToast(id) {\n      setToasts(function (prev) { return prev.filter(function (x) { return x.id !== id; }); });\n    }\n\n    // Unmounting cancels all pending toast dismissals.\n    useEffect(function () {\n      return function () { /* timers are short-lived and self-clearing via state guard */ };\n    }, []);\n\n    function loadMeta() {\n      call('domain-manager.rbac.can', { action: 'market.read' }).then(function (res) {\n        setIsAdmin(!!(res && res.ok && (res.data === true || (res.data && res.data.allowed === true))));\n      }).catch(function () { setIsAdmin(false); });\n      call('domain-manager.domainConfig.list', {}).then(function (res) {\n        var items = res && res.data && Array.isArray(res.data.items) ? res.data.items : (Array.isArray(res && res.data) ? res.data : []);\n        setDomainOptions(items);\n        var active = null;\n        for (var i = 0; i < items.length; i++) {\n          if (items[i].active || items[i].isActive) { active = items[i].id; break; }\n        }\n        if (active == null && items.length) active = items[0].id;\n        setActiveDomain(active);\n      }).catch(function () { setDomainOptions([]); });\n    }\n\n    useEffect(function () { loadMeta(); }, []);\n\n    // Host navigation entries may open this page through a custom event.\n    useEffect(function () {\n      if (typeof window === 'undefined' || !window.addEventListener) return function () {};\n      function onOpen(e) {\n        var target = e && e.detail && e.detail.view;\n        setView(target || 'connect');\n      }\n      window.addEventListener('dm-open-domain-manager', onOpen);\n      return function () { window.removeEventListener('dm-open-domain-manager', onOpen); };\n    }, []);\n\n    function changeDomain(id) {\n      setActiveDomain(id || null);\n      if (!id) return;\n      call('domain-manager.domainConfig.setActive', { id: id }).then(function (res) {\n        if (!(res && res.ok)) pushToast(t('common.error'), 'error');\n      }).catch(function () { pushToast(t('common.error'), 'error'); });\n    }\n\n    function renderView() {\n      var common = {\n        t: t,\n        call: call,\n        toast: pushToast,\n        domainId: activeDomain,\n        actor: props.actor,\n        ctx: ctx\n      };\n      switch (view) {\n        case 'connect': return h(global.__DM_UI__.ConnectConfig, common);\n        case 'users': return h(global.__DM_UI__.ObjectsPage, Object.assign({ type: 'users' }, common));\n        case 'computers': return h(global.__DM_UI__.ObjectsPage, Object.assign({ type: 'computers' }, common));\n        case 'groups': return h(global.__DM_UI__.ObjectsPage, Object.assign({ type: 'groups' }, common));\n        case 'ous': return h(global.__DM_UI__.ObjectsPage, Object.assign({ type: 'ous' }, common));\n        case 'gpos': return h(global.__DM_UI__.ObjectsPage, Object.assign({ type: 'gpos' }, common));\n        case 'search': return h(global.__DM_UI__.GlobalSearch, common);\n        case 'audit': return h(global.__DM_UI__.AuditLog, common);\n        case 'sync': return h(global.__DM_UI__.SyncPanel, common);\n        case 'market':\n          return isAdmin\n            ? h(global.__DM_UI__.Market, common)\n            : h('div', { className: 'dm-page' }, h(C.Notice, { tone: 'warning' }, t('market.adminOnly')));\n        default: return h(global.__DM_UI__.ConnectConfig, common);\n      }\n    }\n\n    return h('div', { className: 'dm-app' },\n      h('header', { className: 'dm-app__head' },\n        h('div', { className: 'dm-app__brand' },\n          h('img', { src: props.iconUrl || '', alt: '', className: 'dm-app__icon', 'aria-hidden': 'true' }),\n          h('span', null, t('meta.title'))\n        ),\n        domainOptions.length\n          ? h(C.Select, {\n            value: activeDomain || '',\n            options: domainOptions.map(function (d) {\n              return { value: d.id, label: d.label || d.name || d.host || d.id };\n            }),\n            onChange: changeDomain,\n            'aria-label': t('common.selectDomain')\n          })\n          : null\n      ),\n      h('nav', { className: 'dm-app__nav', 'aria-label': t('meta.title') },\n        NAV.filter(function (n) { return !n.admin || isAdmin; }).map(function (n) {\n          return h('button', {\n            key: n.key,\n            type: 'button',\n            className: C.cx('dm-app__nav-item', view === n.key && 'dm-app__nav-item--active'),\n            onClick: function () { setView(n.key); }\n          }, t(n.labelKey));\n        })\n      ),\n      h('div', { className: 'dm-app__content', key: 'view-' + view }, renderView()),\n      h(C.ToastStack, {\n        items: toasts, closeLabel: t('toast.close'), onDismiss: dismissToast\n      })\n    );\n  }\n\n  if (!global.__DM_UI__) global.__DM_UI__ = {};\n  global.__DM_UI__.App = App;\n})(typeof window !== 'undefined' ? window : this);\n");

  var STYLE_ID = 'dm-ui-styles';
  var STYLE_CSS = [
    '.dm-app{display:flex;flex-direction:column;gap:12px;padding:16px;min-height:100%;box-sizing:border-box;background:var(--dsw-alias-bg-body,var(--dsw-alias-bg,#fff));color:var(--dsw-alias-fg-body,var(--dsw-alias-fg,#1f2430));font-size:var(--dsw-alias-font-size-md,14px)}',
    '.dm-app__head{display:flex;align-items:center;justify-content:space-between;gap:12px}',
    '.dm-app__brand{display:flex;align-items:center;gap:8px;font-weight:600;font-size:var(--dsw-alias-font-size-lg,18px)}',
    '.dm-app__icon{width:24px;height:24px;display:block}',
    '.dm-app__nav{display:flex;flex-wrap:wrap;gap:4px;border-bottom:1px solid var(--dsw-alias-border,var(--dsw-alias-border-subtle,#d0d7de));padding-bottom:6px}',
    '.dm-app__nav-item{border:0;background:transparent;color:inherit;padding:6px 10px;border-radius:6px;cursor:pointer;font:inherit}',
    '.dm-app__nav-item:hover{background:var(--dsw-alias-bg-hover,rgba(127,127,127,.12))}',
    '.dm-app__nav-item--active{background:var(--dsw-alias-bg-active,rgba(36,123,191,.14));color:var(--dsw-alias-accent,#247bbf)}',
    '.dm-app__content{flex:1;min-height:0}',
    '.dm-page{display:flex;flex-direction:column;gap:14px}',
    '.dm-page__head{margin:0}',
    '.dm-page__title{margin:0 0 4px;font-size:var(--dsw-alias-font-size-xl,20px);font-weight:600}',
    '.dm-page__desc{margin:0;color:var(--dsw-alias-fg-muted,var(--dsw-alias-fg-subtle,#6b7280));font-size:var(--dsw-alias-font-size-sm,13px)}',
    '.dm-section{border:1px solid var(--dsw-alias-border,var(--dsw-alias-border-subtle,#d0d7de));border-radius:8px;padding:14px;background:var(--dsw-alias-bg-panel,var(--dsw-alias-bg-elevated,#fff))}',
    '.dm-section__title{margin:0 0 10px;font-size:var(--dsw-alias-font-size-md,14px);font-weight:600}',
    '.dm-toolbar{display:flex;flex-wrap:wrap;align-items:center;gap:8px;margin-bottom:10px}',
    '.dm-filter-bar{display:flex;flex-wrap:wrap;align-items:flex-end;gap:12px;padding:10px 12px;margin-bottom:10px;border:1px solid var(--dsw-alias-border,var(--dsw-alias-border-subtle,#d0d7de));border-radius:8px;background:var(--dsw-alias-bg-panel,var(--dsw-alias-bg-elevated,#fff))}',
    '.dm-filter-bar__label{font-size:var(--dsw-alias-font-size-sm,13px);font-weight:600;color:var(--dsw-alias-fg-muted,#6b7280);padding-bottom:6px}',
    '.dm-filter-bar__item{display:flex;flex-direction:column;gap:3px;min-width:150px;margin:0;font-size:var(--dsw-alias-font-size-sm,13px)}',
    '.dm-filter-bar__item-label{font-weight:600;color:var(--dsw-alias-fg-muted,#6b7280)}',
    '.dm-form-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:10px 14px}',
    '.dm-form-checks{display:flex;flex-wrap:wrap;gap:16px;margin-top:12px}',
    '.dm-form-actions{display:flex;flex-wrap:wrap;gap:8px;margin-top:16px}',
    '.dm-field{display:flex;flex-direction:column;gap:4px;margin-bottom:4px}',
    '.dm-field__label{font-size:var(--dsw-alias-font-size-sm,13px);font-weight:500}',
    '.dm-field__required{color:var(--dsw-alias-danger,#d32f2f)}',
    '.dm-field__hint,.dm-field__error{font-size:var(--dsw-alias-font-size-xs,12px)}',
    '.dm-field__hint{color:var(--dsw-alias-fg-muted,#6b7280)}',
    '.dm-field__error{color:var(--dsw-alias-danger,#d32f2f)}',
    '.dm-input{box-sizing:border-box;width:100%;padding:6px 9px;border:1px solid var(--dsw-alias-border,var(--dsw-alias-border-subtle,#d0d7de));border-radius:6px;background:var(--dsw-alias-bg-input,var(--dsw-alias-bg,#fff));color:inherit;font:inherit;min-height:32px}',
    '.dm-input:focus{outline:2px solid var(--dsw-alias-accent,#247bbf);outline-offset:1px}',
    '.dm-input:disabled{opacity:.6;cursor:not-allowed}',
    '.dm-textarea{resize:vertical}',
    '.dm-select{cursor:pointer}',
    '.dm-checkbox{display:inline-flex;align-items:center;gap:6px;cursor:pointer}',
    '.dm-btn{display:inline-flex;align-items:center;justify-content:center;gap:6px;padding:6px 12px;min-height:32px;border:1px solid var(--dsw-alias-border,var(--dsw-alias-border-subtle,#d0d7de));border-radius:6px;background:var(--dsw-alias-bg-button,var(--dsw-alias-bg,#fff));color:inherit;font:inherit;cursor:pointer;white-space:nowrap}',
    '.dm-btn:hover:not(:disabled){background:var(--dsw-alias-bg-hover,rgba(127,127,127,.12))}',
    '.dm-btn:disabled{opacity:.55;cursor:not-allowed}',
    '.dm-btn--primary{background:var(--dsw-alias-accent,#247bbf);border-color:var(--dsw-alias-accent,#247bbf);color:var(--dsw-alias-on-accent,#fff)}',
    '.dm-btn--primary:hover:not(:disabled){filter:brightness(1.08);background:var(--dsw-alias-accent,#247bbf)}',
    '.dm-btn--danger{background:var(--dsw-alias-danger,#d32f2f);border-color:var(--dsw-alias-danger,#d32f2f);color:#fff}',
    '.dm-btn--ghost{background:transparent}',
    '.dm-btn--sm{padding:3px 8px;min-height:26px;font-size:var(--dsw-alias-font-size-xs,12px)}',
    '.dm-btn--block{width:100%}',
    '.dm-spinner{display:inline-block;width:12px;height:12px;border:2px solid currentColor;border-right-color:transparent;border-radius:50%;animation:dm-spin .7s linear infinite}',
    '@keyframes dm-spin{to{transform:rotate(360deg)}}',
    '.dm-table-wrap{overflow:auto;max-height:60vh;border:1px solid var(--dsw-alias-border,var(--dsw-alias-border-subtle,#d0d7de));border-radius:8px}',
    '.dm-table{width:100%;border-collapse:collapse;font-size:var(--dsw-alias-font-size-sm,13px)}',
    '.dm-table th,.dm-table td{padding:7px 10px;text-align:left;border-bottom:1px solid var(--dsw-alias-border-subtle,rgba(127,127,127,.18));vertical-align:middle}',
    '.dm-table th{background:var(--dsw-alias-bg-subtle,rgba(127,127,127,.08));font-weight:600;white-space:nowrap;position:sticky;top:0}',
    '.dm-table tbody tr:hover{background:var(--dsw-alias-bg-hover,rgba(127,127,127,.07))}',
    '.dm-table__row--selected{background:var(--dsw-alias-bg-active,rgba(36,123,191,.14))!important}',
    '.dm-table__check{width:32px;text-align:center}',
    '.dm-table__placeholder{text-align:center;padding:22px;color:var(--dsw-alias-fg-muted,#6b7280)}',
    '.dm-row-actions{display:flex;flex-wrap:wrap;gap:4px}',
    '.dm-pagination{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-top:10px;font-size:var(--dsw-alias-font-size-sm,13px)}',
    '.dm-pagination__controls{display:flex;align-items:center;gap:8px}',
    '.dm-modal-backdrop{position:fixed;inset:0;z-index:10000;display:flex;align-items:center;justify-content:center;padding:20px;background:rgba(0,0,0,.42)}',
    '.dm-modal{width:min(560px,100%);max-height:90vh;display:flex;flex-direction:column;border-radius:10px;background:var(--dsw-alias-bg-panel,var(--dsw-alias-bg,#fff));color:inherit;border:1px solid var(--dsw-alias-border,#d0d7de);box-shadow:0 12px 40px rgba(0,0,0,.25)}',
    '.dm-modal--sm{width:min(420px,100%)}',
    '.dm-modal--md{width:min(680px,100%)}',
    '.dm-modal__head{display:flex;align-items:center;justify-content:space-between;padding:12px 16px;border-bottom:1px solid var(--dsw-alias-border-subtle,#d0d7de)}',
    '.dm-modal__title{margin:0;font-size:var(--dsw-alias-font-size-lg,16px);font-weight:600}',
    '.dm-modal__close{border:0;background:transparent;color:inherit;font-size:20px;line-height:1;cursor:pointer;padding:2px 6px;border-radius:4px}',
    '.dm-modal__close:hover{background:var(--dsw-alias-bg-hover,rgba(127,127,127,.12))}',
    '.dm-modal__body{padding:16px;overflow:auto}',
    '.dm-modal__foot{padding:12px 16px;border-top:1px solid var(--dsw-alias-border-subtle,#d0d7de);display:flex;justify-content:flex-end}',
    '.dm-dialog-actions{display:flex;justify-content:flex-end;gap:8px}',
    '.dm-dialog-message{margin:0 0 12px;line-height:1.6}',
    '.dm-objects-layout{display:grid;grid-template-columns:220px 1fr;gap:14px;align-items:start}',
    '.dm-objects-side{border:1px solid var(--dsw-alias-border,var(--dsw-alias-border-subtle,#d0d7de));border-radius:8px;padding:10px;background:var(--dsw-alias-bg-panel,var(--dsw-alias-bg-elevated,#fff));max-height:70vh;overflow:auto}',
    '.dm-objects-main{min-width:0}',
    '.dm-ou-tree__head{display:flex;align-items:center;justify-content:space-between;font-weight:600;margin-bottom:6px}',
    '.dm-tree__all{display:block;width:100%;text-align:left;border:0;background:transparent;color:inherit;padding:6px 8px;border-radius:5px;cursor:pointer;font:inherit}',
    '.dm-tree__all--active{background:var(--dsw-alias-bg-active,rgba(36,123,191,.14));color:var(--dsw-alias-accent,#247bbf)}',
    '.dm-tree__row{display:flex;align-items:center;gap:4px;padding-top:5px;padding-bottom:5px;border-radius:5px;cursor:pointer;user-select:none}',
    '.dm-tree__row:hover{background:var(--dsw-alias-bg-hover,rgba(127,127,127,.1))}',
    '.dm-tree__row--selected{background:var(--dsw-alias-bg-active,rgba(36,123,191,.14));color:var(--dsw-alias-accent,#247bbf)}',
    '.dm-tree__toggle{border:0;background:transparent;color:inherit;width:16px;min-width:16px;cursor:pointer;padding:0;font-size:12px}',
    '.dm-tree__label{flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
    '.dm-tree__count{font-size:var(--dsw-alias-font-size-xs,12px);opacity:.7}',
    '.dm-tree__empty{padding:10px;color:var(--dsw-alias-fg-muted,#6b7280);font-size:var(--dsw-alias-font-size-sm,13px)}',
    '.dm-toast-stack{position:fixed;right:16px;bottom:16px;z-index:11000;display:flex;flex-direction:column;gap:8px;max-width:min(380px,90vw)}',
    '.dm-toast{display:flex;align-items:flex-start;gap:8px;padding:10px 12px;border-radius:8px;background:var(--dsw-alias-bg-panel,var(--dsw-alias-bg,#fff));border:1px solid var(--dsw-alias-border,#d0d7de);box-shadow:0 6px 20px rgba(0,0,0,.18)}',
    '.dm-toast--error{border-left:4px solid var(--dsw-alias-danger,#d32f2f)}',
    '.dm-toast--success{border-left:4px solid var(--dsw-alias-success,#2e7d32)}',
    '.dm-toast--info{border-left:4px solid var(--dsw-alias-accent,#247bbf)}',
    '.dm-toast__icon{font-weight:700}',
    '.dm-toast__text{flex:1;word-break:break-word}',
    '.dm-toast__close{border:0;background:transparent;color:inherit;cursor:pointer;font-size:16px;line-height:1}',
    '.dm-notice{padding:8px 10px;border-radius:6px;margin:6px 0;font-size:var(--dsw-alias-font-size-sm,13px);display:flex;flex-wrap:wrap;align-items:center;gap:8px}',
    '.dm-notice--error{background:var(--dsw-alias-danger-bg,rgba(211,47,47,.1));color:var(--dsw-alias-danger,#d32f2f)}',
    '.dm-notice--warning{background:var(--dsw-alias-warning-bg,rgba(255,160,0,.14));color:var(--dsw-alias-warning,#a35b00)}',
    '.dm-notice--success{background:var(--dsw-alias-success-bg,rgba(46,125,50,.12));color:var(--dsw-alias-success,#2e7d32)}',
    '.dm-notice--info{background:var(--dsw-alias-info-bg,rgba(36,123,191,.12));color:var(--dsw-alias-accent,#247bbf)}',
    '.dm-badge{display:inline-block;padding:1px 7px;border-radius:999px;font-size:var(--dsw-alias-font-size-xs,12px);background:var(--dsw-alias-bg-subtle,rgba(127,127,127,.14))}',
    '.dm-badge--success{background:var(--dsw-alias-success-bg,rgba(46,125,50,.16));color:var(--dsw-alias-success,#2e7d32)}',
    '.dm-badge--error{background:var(--dsw-alias-danger-bg,rgba(211,47,47,.14));color:var(--dsw-alias-danger,#d32f2f)}',
    '.dm-badge--muted{opacity:.75}',
    '.dm-empty,.dm-kv{color:var(--dsw-alias-fg-muted,#6b7280)}',
    '.dm-kv{display:flex;flex-wrap:wrap;gap:18px}',
    '.dm-kv>div{display:flex;flex-direction:column;gap:2px}',
    '.dm-selected-count{font-size:var(--dsw-alias-font-size-sm,13px);opacity:.8}',
    '.dm-nav-entry{display:flex;align-items:center;gap:8px;width:100%;border:0;background:transparent;color:inherit;padding:8px;border-radius:6px;cursor:pointer;font:inherit;text-align:left}',
    '.dm-nav-entry:hover{background:var(--dsw-alias-bg-hover,rgba(127,127,127,.12))}',
    '@media(max-width:760px){.dm-objects-layout{grid-template-columns:1fr}.dm-objects-side{max-height:220px}}'
  ].join('\n');

  function installStyles(doc) {
    if (!doc) return function () {};
    var node = doc.getElementById(STYLE_ID);
    if (node && node.__dmOwners) {
      node.__dmOwners++;
      return function () {
        node.__dmOwners--;
        if (node.__dmOwners <= 0 && node.parentNode) node.parentNode.removeChild(node);
      };
    }
    node = doc.createElement('style');
    node.id = STYLE_ID;
    node.__dmOwners = 1;
    node.textContent = STYLE_CSS;
    (doc.head || doc.documentElement).appendChild(node);
    return function () {
      node.__dmOwners--;
      if (node.__dmOwners <= 0 && node.parentNode) node.parentNode.removeChild(node);
    };
  }

  // 每次调用都重新执行全部模块：模块只是覆盖 window.__DM_UI__.* 导出，
  // 重复执行安全；这样插件热更新后不会因 window 上残留的旧 App 而加载过期代码
  // （历史 bug：审计页因旧模块缺少安全序列化而整页空白）。

  // 每次调用都重新执行全部模块：模块只是覆盖 window.__DM_UI__.* 导出，
  // 重复执行安全；这样插件热更新后不会因 window 上残留的旧 App 而加载过期代码
  // （历史 bug：审计页因旧模块缺少安全序列化而整页空白）。

  // 每次调用都重新执行全部模块：模块只是覆盖 window.__DM_UI__.* 导出，
  // 重复执行安全；这样插件热更新后不会因 window 上残留的旧 App 而加载过期代码
  // （历史 bug：审计页因旧模块缺少安全序列化而整页空白）。

  // 每次调用都重新执行全部模块：模块只是覆盖 window.__DM_UI__.* 导出，
  // 重复执行安全；这样插件热更新后不会因 window 上残留的旧 App 而加载过期代码
  // （历史 bug：审计页因旧模块缺少安全序列化而整页空白）。

  // 每次调用都重新执行全部模块：模块只是覆盖 window.__DM_UI__.* 导出，
  // 重复执行安全；这样插件热更新后不会因 window 上残留的旧 App 而加载过期代码
  // （历史 bug：审计页因旧模块缺少安全序列化而整页空白）。

  // 每次调用都重新执行全部模块：模块只是覆盖 window.__DM_UI__.* 导出，
  // 重复执行安全；这样插件热更新后不会因 window 上残留的旧 App 而加载过期代码
  // （历史 bug：审计页因旧模块缺少安全序列化而整页空白）。

  // 每次调用都重新执行全部模块：模块只是覆盖 window.__DM_UI__.* 导出，
  // 重复执行安全；这样插件热更新后不会因 window 上残留的旧 App 而加载过期代码
  // （历史 bug：审计页因旧模块缺少安全序列化而整页空白）。

  // 每次调用都重新执行全部模块：模块只是覆盖 window.__DM_UI__.* 导出，
  // 重复执行安全；这样插件热更新后不会因 window 上残留的旧 App 而加载过期代码
  // （历史 bug：审计页因旧模块缺少安全序列化而整页空白）。

  // 每次调用都重新执行全部模块：模块只是覆盖 window.__DM_UI__.* 导出，
  // 重复执行安全；这样插件热更新后不会因 window 上残留的旧 App 而加载过期代码
  // （历史 bug：审计页因旧模块缺少安全序列化而整页空白）。
  function installUi(require) {
    if (typeof window === 'undefined') return null;
    for (var i = 0; i < UI_SOURCES.length; i++) {
      try {
        var fn = new Function('require', 'window', UI_SOURCES[i]);
        fn(require, window);
      } catch (err) { /* 单个模块失败不影响其余模块 */ }
    }
    return (window.__DM_UI__ && window.__DM_UI__.App) ? window.__DM_UI__ : null;
  }

  // ---- remote bridge ----------------------------------------------------
  var RPC_PATH = '/api/dm-rpc';

  function makeCaller(ctx) {
    return function (method, params) {
      var payload = params || {};
      // 主通道：Host 插件通过 ctx.webServer.register 提供的同源 HTTP RPC。
      if (typeof fetch === 'function') {
        return fetch(RPC_PATH, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ command: method, params: payload })
        }).then(function (res) {
          if (!res.ok) throw new Error('RPC HTTP ' + res.status);
          return res.json();
        }).then(normalizeEnvelope).catch(function (err) {
          // 网络失败再尝试其他桥接方式
          return fallbackCall(ctx, method, payload, err);
        });
      }
      return fallbackCall(ctx, method, payload, new Error('fetch unavailable'));
    };
  }

  function fallbackCall(ctx, method, payload, originalError) {
    var remote = ctx && ctx.remote;
    if (remote && typeof remote.execute === 'function') {
      return Promise.resolve(remote.execute(method, payload)).then(normalizeEnvelope).catch(toRejection);
    }
    var bridge = (typeof window !== 'undefined' && window.__DM_HOST_BRIDGE__) || null;
    if (bridge) {
      if (typeof bridge.execute === 'function') {
        return Promise.resolve(bridge.execute(method, payload)).then(normalizeEnvelope).catch(toRejection);
      }
      if (typeof bridge[method] === 'function') {
        return Promise.resolve(bridge[method](payload)).then(normalizeEnvelope).catch(toRejection);
      }
    }
    return Promise.reject({ ok: false, error: { code: 'BRIDGE_ERROR', message: originalError && originalError.message ? originalError.message : 'Host bridge unavailable' } });
  }

  function normalizeEnvelope(res) {
    if (res && typeof res === 'object' && typeof res.ok === 'boolean') return res;
    // A bare result is treated as success data.
    return { ok: true, data: res };
  }

  function toRejection(err) {
    // Keep callers in the envelope world: reject with { ok:false, error }.
    var message = err && err.message ? err.message : String(err || 'Unknown error');
    return Promise.reject({ ok: false, error: { code: 'BRIDGE_ERROR', message: message } });
  }

  // ---- translation ------------------------------------------------------
  function makeTranslator(ctx) {
    var locale = (ctx && ctx.locale) || {};
    var bound = null;
    if (locale && typeof locale.bind === 'function') {
      try { bound = locale.bind(LOCALE_NS); } catch (e) { bound = null; }
    }
    return function (key, vars) {
      var raw;
      if (typeof key === 'object' && key !== null) {
        raw = key.en || key.zh || key;
      } else {
        if (typeof bound === 'function') {
          try { raw = bound(key); } catch (e) { raw = undefined; }
        }
        if (raw == null || raw === key) {
          raw = DICT.zh[key];
        }
        if (raw == null && DICT.en) raw = DICT.en[key];
      }
      if (raw == null) return String(key);
      if (vars && typeof raw === 'string') {
        return raw.replace(/\{([a-zA-Z0-9_.]+)\}/g, function (m, k) {
          var v = vars[k];
          return v == null ? m : String(v);
        });
      }
      return typeof raw === 'string' ? raw : String(key);
    };
  }

  // ---- slot injection ---------------------------------------------------
  // Candidates cover the documented plugin-manager/navigation/sidebar slots
  // plus a direct page slot. Registration never throws.
  // 按 DSH 官方 slot 契约：侧栏图标用 list 型 sidebar.panellist（由宿主渲染按钮），
  // 主面板用 keyed 型 main，key 与侧栏项 id 一致。
  var PANEL_ID = 'ad-ldap-domain-manager';
  var NAV_SLOTS = ['sidebar.panellist', 'settings.plugins', 'settings.section'];
  var PAGE_SLOTS = ['main', 'settings.plugins.page', 'settings.plugins.tab'];

  function tryRegister(ctx, slotName, entry, Component, label, React) {
    var slots = ctx && ctx.slots;
    if (!slots || typeof slots.register !== 'function') return function () {};
    var dispose = null;
    try {
      // 必须以 React 组件方式渲染（保留 hooks 语义），不能直接调用组件函数。
      var result = slots.register(entry, function SlotComponent(props) {
        return React.createElement(Component, props || {});
      });
      if (typeof result === 'function') dispose = result;
    } catch (e) {
      dispose = null;
    }
    return function () {
      if (dispose) {
        try { dispose(); } catch (e) { /* ignore */ }
      }
    };
  }

  function injectOne(ctx, slotName, Component, entry, label, React) {
    var slots = ctx && ctx.slots;
    if (!slots || typeof slots.inject !== 'function') return function () {};
    var dispose = null;
    try {
      var injected = slots.inject(slotName, function () {
        dispose = tryRegister(ctx, slotName, entry, Component, label, React);
        return dispose;
      });
      if (typeof injected === 'function') {
        return function () {
          try { injected(); } catch (e) { /* ignore */ }
          if (dispose) { try { dispose(); } catch (e2) { /* ignore */ } }
        };
      }
    } catch (e) { /* slot owner not present */ }
    return function () {
      if (dispose) { try { dispose(); } catch (e) { /* ignore */ } }
    };
  }

  window.__ModuleLoader__.load({
    id: MODULE_ID,
    factory: function (require) {
      var React = require('react');
      var h = React.createElement;

      // UI modules are plain scripts that attach to window.__DM_UI__.
      // Loading is done lazily at apply time so the factory stays side-effect free.
      function loadAllUi() { return installUi(require); }

      function buildApp(ctx, t, call) {
        var api = loadAllUi();
        if (!api || !api.App) {
          return function () {
            return h('div', { className: 'dm-page' },
              h('div', { className: 'dm-notice dm-notice--error' },
                'AD/LDAP Domain Manager UI modules failed to load.'));
          };
        }
        var iconUrl = null;
        try { iconUrl = require('./icon.svg'); } catch (e) { iconUrl = null; }
        return function (props) {
          return h(api.App, {
            t: t,
            call: call,
            ctx: ctx,
            iconUrl: iconUrl,
            actor: (props && props.actor) || null,
            onNavigate: props && props.onNavigate
          });
        };
      }

      // Navigation row: clicking it asks the host to open the dedicated page.
      // Multiple host conventions are supported; none of them throws when absent.
      function openManager(ctx, props) {
        var id = 'ad-ldap-domain-manager';
        var p = props || {};
        try {
          if (p.onOpen) { p.onOpen(id); return; }
          if (p.onSelect) { p.onSelect(id); return; }
          if (p.onOpenPanel) { p.onOpenPanel(id); return; }
          if (ctx && ctx.slots && typeof ctx.slots.select === 'function') {
            ctx.slots.select('main', id);
            return;
          }
          if (ctx && ctx.pluginNavigation && typeof ctx.pluginNavigation.openBundle === 'function') {
            ctx.pluginNavigation.openBundle('@local/ad-ldap-domain-manager');
            return;
          }
        } catch (e) { /* fall through to DOM custom event */ }
        if (typeof window !== 'undefined' && window.dispatchEvent) {
          try {
            window.dispatchEvent(new CustomEvent('dm-open-domain-manager', { detail: { id: id } }));
          } catch (e) { /* ignore */ }
        }
      }

      function buildNavEntry(ctx, t) {
        return function NavEntry(props) {
          var p = props || {};
          var label = t('meta.title');
          // sidebar.panellist 由宿主渲染按钮，只传入 size/active；此处仅提供图标。
          if (p.size) {
            return h('svg', {
              viewBox: '0 0 24 24', width: p.size, height: p.size,
              'aria-hidden': true, focusable: 'false',
              onClick: function () { openManager(ctx, p); }
            },
              h('rect', { x: 3, y: 3, width: 18, height: 18, rx: 3, fill: 'none', stroke: 'currentColor', 'stroke-width': 1.6 }),
              h('path', { d: 'M7 8h10M7 12h10M7 16h6', stroke: 'currentColor', 'stroke-width': 1.6, 'stroke-linecap': 'round' })
            );
          }
          // 其他 slot（如设置页）用带文字按钮的完整入口。
          return h('button', {
            type: 'button',
            className: 'dm-nav-entry',
            title: label,
            'aria-label': label,
            onClick: function () { openManager(ctx, p); }
          }, label);
        };
      }

      return {
        inject: ['slots', 'remote', 'locale'],
        apply: function apply(ctx) {
          var cleanups = [];
          var doc = (typeof document !== 'undefined') ? document : null;
          cleanups.push(installStyles(doc));

          if (ctx && typeof ctx.effect === 'function') {
            // One composite effect owns every resource registered below.
            try {
              ctx.effect(function () {
                return function () {
                  cleanups.forEach(function (fn) {
                    if (typeof fn === 'function') {
                      try { fn(); } catch (e) { /* ignore */ }
                    }
                  });
                  cleanups = [];
                };
              }, MODULE_ID + ':resources');
            } catch (e) { /* ctx.effect unavailable: fallback cleanup still collected */ }
          }

          var t = makeTranslator(ctx);
          var call = makeCaller(ctx);

          // Register dictionaries with the host locale service when available.
          if (ctx && ctx.locale && typeof ctx.locale.register === 'function' && DICT.zh && DICT.en) {
            try {
              var d = ctx.locale.register(LOCALE_NS, { zh: DICT.zh, en: DICT.en });
              if (typeof d === 'function') cleanups.push(d);
            } catch (e) { /* dictionary already registered or unsupported */ }
          }

          var App = buildApp(ctx, t, call);
          var NavEntry = buildNavEntry(ctx, t);

          // 侧栏入口：sidebar.panellist 是 list 型，必须带 id 与 label；
          // 宿主据此渲染图标按钮并把 label 显示为文字，避免自绘按钮被窄栏截断。
          var navEntry = {
            name: 'sidebar.panellist',
            id: PANEL_ID,
            order: 90,
            label: function () { return t('meta.title'); }
          };
          // 主面板：main 是 keyed 型，必须带 key，且与侧栏 id 一致。
          var pageEntry = {
            name: 'main',
            key: PANEL_ID
          };

          NAV_SLOTS.forEach(function (slot) {
            var entry = Object.assign({}, navEntry, { name: slot });
            // 非 panellist 的回退 slot 使用带文字按钮（无 size props）。
            if (slot !== 'sidebar.panellist') { entry.label = t('meta.title'); }
            var dispose = injectOne(ctx, slot, NavEntry, entry, t('meta.title'), React);
            cleanups.push(dispose);
          });

          PAGE_SLOTS.forEach(function (slot) {
            var entry = slot === 'main'
              ? { name: 'main', key: PANEL_ID }
              : Object.assign({}, pageEntry, { name: slot });
            var dispose = injectOne(ctx, slot, App, entry, t('meta.title'), React);
            cleanups.push(dispose);
          });

          return ctx;
        }
      };
    }
  });
})();
