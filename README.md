# dsh-ad-manage

DSH 插件：可视化配置 AD/OpenLDAP 域连接，集中管理域用户、计算机、安全组/分发组、组织单元（OU）与组策略（GPO）。

- 包名 / 插件 ID：`dsh-ad-manage`
- 可安装性：`package.json` 声明 `dsh.bundle`（`./cordis.patch.yml`）与 `dsh.client`（web）
- 无需修改 DSH 主程序，安装即用，卸载不留残余

## 安装

### 从源码安装（推荐）

```bash
dsh plugin --profile <profile> add https://github.com/lsit27/dsh-ad-manage
```

### 离线安装包

`dist/` 下附带预构建包与校验和：

```bash
certutil -hashfile dsh-ad-manage-1.0.0.tgz SHA256
```

在 DSH 插件管理页选择「从本地导入安装包」，选中该 `.tgz`。

安装后需**重启 DSH**；之后在侧边栏进入「dsh-ad-manage 域管理」。

## 功能

**连接配置**
- 多套 AD/OpenLDAP 连接并存，可切换启用
- LDAP / LDAPS / StartTLS，支持主备地址、超时、分页大小、基准 DN
- 「测试连接」一键验证；绑定密码 AES-256-GCM 加密落盘

**域用户**
- 列表、关键字检索、启用/禁用/锁定筛选
- 新建、编辑、重置密码、启用/停用、解锁、移动 OU、删除
- 查看所属组；字段含登录名、UPN、邮箱、手机、部门、职务、工号、密码修改时间

**域计算机**
- 列表含所属 OU 列；新建、编辑、启用/停用、移动 OU、删除

**安全组 / 分发组**
- 组列表、成员清单、批量添加/移除成员、删除

**组织单元（OU）**
- 树形导航；选中任一 OU 显示其自身及所有子 OU 下的对象
- 新建、重命名、移动（组织树点选目标 OU）、删除

**组策略（GPO）**
- 读取策略列表，状态由 AD `flags` 位推导
- 启用/停用：只改 `flags` 的 bit0，写入后**回读校验**，未生效直接报错
- 链接到 OU / 解绑；按 OU 展示「直接链接」与「继承自上级」
- 编辑显示名与描述；删除（仍被 OU 链接时拒绝删除）

**数据同步**
- 本地缓存 + 周期同步（可设 5/10/30/60 分钟，或关闭）
- 同步为原子写入：全部类型拉取成功才落盘，失败类型保留上次缓存
- 列表优先读缓存，可手动「立即同步」强制实时拉取

**治理**
- 操作审计日志（操作人、动作、目标、结果、详情）
- RBAC 三类角色：`viewer` / `operator` / `admin`
- 删除、重置密码等高风险操作需 `CONFIRMED` 二次确认

**插件市场页**
- 市场 API 地址可配置（`marketApiBase` 或 `MARKET_API_BASE`）
- 未配置或请求失败时展示内置演示数据（版本历史、更新、回滚流程）

## 已知限制

- **GPO 创建**仅在目录服务侧创建 `groupPolicyContainer` 对象；对应的 SYSVOL 策略文件需域控侧补齐。本插件不编辑策略内部规则（注册表、安全设置等）。
- **GPO 删除**在策略仍被任一 OU 的 `gPLink` 引用时会被拒绝，需先解绑。
- 域连接测试与对象读写依赖网络可达域控；不可达时列表回退到本地缓存。
- 默认角色为 `admin` 以便开箱可用，生产环境建议通过插件 Config 的 `defaultRole` 收紧为 `viewer` / `operator`。

## 附带技能

`skills/ad-domain-management/` 是一个独立的 DSH 技能（PowerShell + ActiveDirectory 模块）：按工号规则创建域用户、建 OU 与同名全局安全组、按计算机名后 6 位匹配用户并同步描述与 OU、执行禁用/90 天后删除等安全策略。

安装：将 `skills/ad-domain-management/` 复制到 `~/.dsh/skills/` 或 `~/.agents/skills/`，重启或刷新会话即可。该技能与插件相互独立，可单独使用。

## 仓库结构

```
.
├── package.json          # name: dsh-ad-manage；dsh.bundle + dsh.client
├── cordis.patch.yml      # Loader 行插入
├── plugin.json           # 市场上架元信息
├── index.js              # Host 入口（命令注册、RBAC、缓存、HTTP RPC）
├── client.js             # 浏览器端入口（含内联 UI 模块）
├── src/                  # ldap-client / directory-service / store / crypto / sync-service / market-service / rbac
├── ui/                   # 连接配置、对象管理、审计、同步、市场、自绘组件
├── locale/               # zh/en 文案
├── docs/                 # 安装、配置、使用手册、上架材料、示意图
├── dist/                 # 离线安装包 + SHA256
├── skills/               # 附带的 DSH 技能
├── build-client.mjs      # 由 ui/*.jsx + locale 生成 client.js
├── syntax-check.mjs      # 语法/JSON 校验
└── smoke-test.mjs        # 端到端冒烟测试（mock 驱动）
```

## 开发

```bash
npm install          # 安装 ldapjs
node build-client.mjs   # 修改 ui/ 或 locale/ 后重新生成 client.js
node syntax-check.mjs   # 语法与清单校验
node smoke-test.mjs     # 端到端冒烟测试（mock 驱动）
```

测试使用内置 mock 驱动（`LDAP_CLIENT_DRIVER=mock`），不连接真实域控。

## 安全

- 不硬编码任何域地址、账号、密码；全部由界面录入
- 绑定密码加密存储，密钥来自环境变量或安装时生成
- 所有写操作经权限校验并记录审计日志
- 无后门、无未授权外联；市场 API 地址可配置，失败回退内置演示数据

## 许可证

MIT，见 [LICENSE](LICENSE)。
