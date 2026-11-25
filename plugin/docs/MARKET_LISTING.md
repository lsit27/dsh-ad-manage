# dsmarket 市场上架材料

## 插件名称
AD/LDAP 域管理插件（AD/LDAP Domain Manager）

## 插件 ID
`dsh-ad-manage`

## 封面图标
`icon.svg`（原创蓝灰目录树图标，SVG，<256 KiB）

## 一句话简介
可视化配置 AD/OpenLDAP 域连接，集中管理用户、计算机、安全组、OU 与 GPO，支持 dsmarket 一键安装、在线更新与灰度发布。

## 功能简介（详情）
本插件与主系统解耦，独立安装启用。提供多套域连接的可视化配置与加密存储，域内对象的全生命周期管理（用户、计算机、安全组、OU、GPO），OU 树联动、全局检索、操作审计与高危操作防护。通过 dsmarket 实现搜索、下载、兼容性校验、在线更新、灰度发布、授权校验与版本回滚。

## 适用场景
- 企业 AD 域账号的日常运维与批量管理
- 多分支机构多域的统一管理入口
- OpenLDAP 目录服务的对象维护
- 安全组与分发组成员治理
- OU 结构调整与 GPO 绑定关系梳理

## 版本兼容性
- DSH 主系统：`>= 0.1.5`
- Node.js：`>= 20`
- 协议：LDAP v3、LDAPS、StartTLS
- 目录：Microsoft Active Directory、OpenLDAP

## 截图/演示图
- `docs/screenshots/connect-config.svg` — 域连接配置
- `docs/screenshots/users.svg` — 域用户管理
- `docs/screenshots/ou-tree.svg` — OU 树与对象联动

> 截图为界面示意，实际以插件运行效果为准。

## 版本历史
| 版本 | 日期 | 说明 |
|---|---|---|
| 1.0.0 | 2026-11-23 | 首个正式版：域配置、五类对象管理、审计、市场更新与回滚 |

## 授权模式
免费（free）；市场侧可配置付费/试用。授权状态由市场校验，下架后已安装实例继续可用。

## 作者
DSH Market Contributor

## 用户评论入口
`https://dsmarket.example.com/plugins/dsh-ad-manage/reviews`（演示地址，上架时替换为真实地址）

## 详情页章节结构
1. 功能说明
2. 安装指引（见 INSTALL.md）
3. 配置说明（见 CONFIG.md）
4. 版本更新日志（见 CHANGELOG.md）
5. 用户评论入口

## 运营信息
- 下载量：0（上架后由市场统计）
- 评分：0（上架后由用户评价）
- 更新日志模板：见 CHANGELOG.md 末尾
