# AD/LDAP 域管理插件 — 架构基线 v1.0

> 工作目录：`C:\Users\200314\dsh-ad`
> 目标：可上架 dsmarket、与 DSH 主系统解耦、独立安装启用的域管理插件。
> 状态：**设计契约（所有模块必须遵守，不得擅自改接口）**

## 1. 包形态（遵循 DSH Cordis 插件规范）

包名：`@dsmarket/ad-ldap-domain-manager`（发布名），本地开发名 `@local/ad-ldap-domain-manager`。
类型：ESM bundle，含 `dsh.bundle.patch`、`dsh.client`（platform=web）、Host 入口 `index.js`、Client 入口 `client.js`。

```
ad-ldap-domain-manager/
├── package.json            # 清单 + dsh.bundle.patch + dsh.client + engines.dsh
├── plugin.json             # dsmarket 市场元信息清单（上架用，独立于 package.json）
├── cordis.patch.yml        # Loader 行插入：host 行 + client 行
├── index.js                # Host apply()：注册领域服务、存储、市场服务、远程命令
├── client.js               # Client lazy factory：React UI，注入设置导航/页面 slot
├── icon.svg                # 原创图标
├── locale/{zh,en}.json     # meta.title/description + UI 文案
├── src/                    # 实现模块（Host 侧可拆文件）
│   ├── crypto.js           # AES-256-GCM 加密存储
│   ├── store.js            # JSON 文件持久化（配置/多域/审计/操作记录/授权缓存）
│   ├── ldap-client.js      # LDAP 协议适配：AD/OpenLDAP、分页、SSL/TLS、错误中文映射
│   ├── directory-service.js# 域对象 CRUD：用户/计算机/组/OU/GPO
│   ├── market-service.js   # dsmarket 搜索/下载/校验/更新/回滚/灰度/授权/操作记录
│   ├── rbac.js             # 角色权限校验
│   └── remote.js           # Client-callable Host 命令桥（UI → service）
└── ui/                     # Client React 组件（在 client.js 内注册）
    ├── App.jsx
    ├── ConnectConfig.jsx
    ├── Objects.jsx
    ├── Market.jsx
    ├── AuditLog.jsx
    └── components.jsx
```

## 2. 分层与接口契约

### 2.1 Host 服务（由 index.js 注册，UI 通过 remote 命令调用）

统一返回信封：`{ ok: boolean, data?: any, error?: { code: string, message: string } }`。
所有写操作必须带 `actor`（来自主系统会话）并经过 RBAC 与高危二次确认（前端确认由 UI 负责，后端校验 `confirmToken`）。

```
domainConfig: list | get(id) | save(cfg) | reset(id) | delete(id) | test(cfg) | setActive(id)
directory:    listUsers(q) listComputers(q) listGroups(q) listOUs(q) listGPOs(q)
              createUser(u) updateUser(u) resetPassword(id,pw) toggleUser(id,enabled)
              unlockUser(id) moveUser(id,ou) deleteUser(id) getUserGroups(id)
              createComputer(c) updateComputer(c) moveComputer(id,ou) deleteComputer(id) toggleComputer(id,enabled)
              createGroup(g) updateGroup(g) addGroupMembers(id,members) removeGroupMembers(id,members)
              deleteGroup(id) listGroupMembers(id)
              createOU(ou) renameOU(id,name) moveOU(id,parent) deleteOU(id) listOUObjects(id)
              listGPOs() getGPO(id) toggleGPO(id,enabled) bindGPO(id,ou) unbindGPO(id,ou)
              search(q)
audit:        list(q)
market:       search(q) detail(id) versions(id) checkUpdate() install(spec) update(version)
              rollback() setChannel(stable|gray) getLicense() operations()
rbac:         can(action)
```

`q` 通用查询参数：`{ domainId, ouDn, keyword, filters:{}, page:1, pageSize:20 }`。
列表返回：`{ items: [], total: number, page, pageSize }`。

### 2.2 LDAP 客户端抽象（src/ldap-client.js）

- 支持 `ldap://` 与 `ldaps://`，`port`、`ssl`、`tls`（StartTLS）、`bindDN`、`bindPassword`、`baseDN`、`timeout`、`pageSize`。
- 依赖 `ldapjs`；无该依赖时用 `LDAP_CLIENT_DRIVER=mock` 内存驱动跑通 UI 与流程。
- AD 特有属性：`sAMAccountName`、`userPrincipalName`、`displayName`、`memberOf`、`userAccountControl`、`pwdLastSet`、`lockoutTime`、`dnshostname`、`operatingSystem`；OpenLDAP 通用：`uid`、`cn`、`sn`、`mail`、`mobile`、`member`、`objectClass`。
- 分页控件 OID 1.2.840.113556.1.4.319，pageSize 上限 1000。
- 错误码中文映射：`CONN_REFUSED`/`TIMEOUT`/`BIND_FAILED`/`INSUFFICIENT_ACCESS`/`NO_SUCH_OBJECT`/`PASSWORD_POLICY`/`ENTRY_IN_USE`/`SIZE_LIMIT`/`PAGE_LIMIT`/`TLS_FAILED`。

### 2.3 存储与安全

- 数据目录：环境变量 `DSL_AD_DATA_DIR` 或默认包内 `.data`。
- 敏感字段用 AES-256-GCM，密钥来自 `DSL_AD_LDAP_KEY`（base64 32 字节）或安装时生成；不得明文落库或硬编码。
- 审计日志仅追加，记录 actor/time/target/action/result/detail。

### 2.4 市场模块

- `MARKET_API_BASE` 可配；版本语义化；`update()` 前备份、失败回滚。
- 强制/可选更新、重大版本风险提示、灰度渠道 stable|gray。
- 授权模式 free|paid|trial，市场侧校验缓存；下架后已装实例继续可用。
- 操作记录 install/update/uninstall/license 写入 operations.json。

### 2.5 RBAC

角色：viewer（只读）、operator（对象增删改，不含重置密码/删除/GPO 绑定）、admin（全部）。
权限点：config.read/write、object.read/write/delete、password.reset、gpo.write、audit.read、market.read/update、plugin.update。

## 3. UI 规范（Client）

- `window.__ModuleLoader__.load({ id, factory })` 注册；React 来自浏览器模块表。
- 通过 slots 注入导航与页面；使用 `--dsw-alias-*` 主题 token，自绘控件，不依赖未授权 Harness Client 包。
- 文案走 ctx.locale，提供 zh/en；表单校验完整；高危操作二次确认。
- 视图：连接配置、五类对象页、全局检索、审计、市场。

## 4. 打包与交付

- `package.json` 的 `files` 包含全部运行时文件；npm pack 校验。
- `plugin.json` 提供市场展示全字段。
- 离线包 + 文档：INSTALL.md、CONFIG.md、USER_GUIDE.md、CHANGELOG.md、MARKET_LISTING.md。
- mock 驱动可完整跑通 UI 流程。

## 5. 模块分工

| 模块 | 负责 | 写入范围 |
|---|---|---|
| A 后端域服务 | ldap-client.js / directory-service.js / rbac.js | `src/{ldap-client,directory-service,rbac}.js` |
| B 配置存储+市场 | crypto.js / store.js / market-service.js | `src/{crypto,store,market-service}.js` |
| C 前端 UI | client.js / ui/* / locale/* / icon.svg | `client.js`, `ui/*`, `locale/*`, `icon.svg` |
| D 集成+清单+文档 | index.js / package.json / plugin.json / cordis.patch.yml / 文档 / 打包脚本 | 根目录清单与 `docs/*`, `dist/*` |

> 各模块只写自己范围文件；接口以本文档为准。有冲突先报 Lead，不擅自改他人文件。
