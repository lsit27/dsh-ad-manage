# AD/LDAP 域管理插件

一款可上架 dsmarket、与 DSH 主系统解耦、独立安装启用的 AD/LDAP 域管理插件。

## 交付内容

| 类别 | 文件/目录 | 说明 |
|---|---|---|
| 架构契约 | `ARCHITECTURE.md` | 模块分层与接口契约（开发基线） |
| 包清单 | `package.json` | DSH bundle + client 声明、engines、files |
| 市场清单 | `plugin.json` | dsmarket 上架元信息（展示、版本、兼容、授权、场景） |
| 加载配置 | `cordis.patch.yml` | Loader 行插入 |
| Host 入口 | `index.js` | 装配层：模块初始化、参数适配、RBAC、命令注册 |
| Client 入口 | `client.js` | 浏览器 lazy factory，slot 注入，React UI 加载 |
| 后端模块 | `src/*.js` | ldap-client / directory-service / store / crypto / market-service / rbac |
| 前端模块 | `ui/*.jsx` | 连接配置、五类对象管理、审计、市场、自绘组件 |
| 多语言 | `locale/{zh,en}.json` | meta 展示信息 + 全量 UI 文案 |
| 图标/截图 | `icon.svg`, `docs/screenshots/*.svg` | 原创图标与三张界面示意图 |
| 文档 | `docs/*.md`, `CHANGELOG.md` | 安装、配置、使用手册、上架材料、更新日志模板 |
| 安装包 | `dist/*.tgz`, `*.sha256` | 可用于 dsmarket 上架的离线安装包及校验和 |
| 验证脚本 | `smoke-test.mjs`, `syntax-check.mjs` | 端到端冒烟测试（56 项）与全量语法校验（18 项） |

## 快速验证

```bash
node syntax-check.mjs   # 18 项语法/JSON 校验
node smoke-test.mjs     # 56 项端到端冒烟测试（mock 驱动，全通过）
```

## 核心能力

- **连接配置**：AD/OpenLDAP 多域可视化配置、一键测试、AES-256-GCM 加密存储
- **对象管理**：用户、计算机、安全组/分发组、OU、GPO 全生命周期操作
- **通用能力**：OU 树联动、全局检索、审计日志、RBAC 权限隔离、高危二次确认
- **市场分发**：搜索/安装/版本历史、兼容性校验、在线更新+备份回滚、灰度渠道、授权校验、下架后可用
- **协议兼容**：标准 LDAP v3、LDAPS、StartTLS，分页查询，中文异常报错

## 安全说明

- 不硬编码任何域地址、账号、密码；全部由 UI 配置录入
- 绑定密码加密落库，密钥来自环境变量或安装时生成
- 所有写操作做权限校验与二次确认，并记录审计日志
- 代码无后门、无未授权外联；市场 API 地址可配置，失败回退内置演示数据
