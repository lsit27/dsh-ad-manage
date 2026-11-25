# AD/LDAP 域管理插件 + AD 域控管理技能

本仓库包含两部分：

## 1. DSH 插件：AD/LDAP 域管理插件

- 位置：`plugin/`（完整源码）
- 功能：可视化配置 AD/OpenLDAP 连接，管理用户/计算机/安全组/OU/GPO，支持 dsmarket 分发、在线更新、本地缓存与定时同步。
- 安装：见 `plugin/docs/INSTALL.md`。

## 2. DSH 技能：AD 域控管理技能（ad-domain-management）

- 位置：`skills/ad-domain-management/SKILL.md`
- 功能：按公司既定规则用 PowerShell（ActiveDirectory 模块）创建 OU/安全组/用户、计算机匹配迁移、禁用/删除安全策略。
- 安装：将 `skills/ad-domain-management/` 复制到 `~/.dsh/skills/` 或 `~/.agents/skills/` 后重启/刷新会话即可。

## 仓库结构

```
.
├── README.md
├── LICENSE
├── plugin/                 # 插件完整源码（含 dist 安装包）
│   ├── package.json
│   ├── plugin.json         # dsmarket 上架元信息
│   ├── index.js / client.js
│   ├── src/ / ui/ / locale/
│   ├── docs/               # 安装/配置/使用/上架材料
│   └── dist/               # 离线安装包 + SHA256
└── skills/
    └── ad-domain-management/
        └── SKILL.md
```
