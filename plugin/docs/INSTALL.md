# AD/LDAP 域管理插件 — 安装说明

## 1. 适用环境

- DSH 主系统版本：`>= 0.1.5`（见 `package.json` 的 `engines.dsh`）
- Node.js：`>= 20`
- 浏览器端：DSH Web（platform=web）
- 目标目录服务：Microsoft Active Directory（LDAP v3）、OpenLDAP
- 可选依赖：`ldapjs@^3.0.0`（未安装时自动使用内置 mock 驱动，可完成界面演示与联调，不连接真实域）

## 2. 方式一：从 dsmarket 一键安装（推荐）

1. 打开 DSH → 插件管理（Plugin Manager）→ 市场（dsmarket）。
2. 搜索「AD/LDAP 域管理」或插件 ID `ad-ldap-domain-manager`。
3. 进入详情页，查看版本、兼容性、截图、功能说明与评论入口。
4. 点击「安装」。安装前系统自动校验：
   - 主系统版本兼容性（engines.dsh）
   - 依赖项是否齐全（ldapjs 为可选，缺失时降级为 mock 驱动）
   - 磁盘空间与写入权限
5. 安装完成后在插件列表「启用」插件。

> 多租户/多实例场景：由市场侧按授权范围将插件分发到指定环境；安装记录写入插件管理页的操作记录。

## 3. 方式二：离线安装包手动导入

1. 从发布方获取离线包 `dist/ad-ldap-domain-manager-1.0.0.tgz`（及同名 `.sha256` 校验文件）。
2. 校验完整性：
   ```bash
   certutil -hashfile ad-ldap-domain-manager-1.0.0.tgz SHA256
   # 与 .sha256 文件内容比对
   ```
3. 在插件管理页选择「从本地导入安装包」，选择该 tgz 文件。
4. 按提示完成安装并启用。

## 4. 激活后的首次配置

1. 在左侧导航找到「AD/LDAP 域管理」入口（若主系统设置页无此入口，插件会尝试多个候选 slot 注册）。
2. 进入「连接配置」，新增一套域配置：填写地址、端口、加密方式、绑定 DN/密码、基准 DN、超时、分页大小。
3. 点击「测试连接」，确认返回成功后再保存。
4. 保存后该配置自动成为当前域；可在多套配置间切换。

> 敏感信息（绑定密码）使用 AES-256-GCM 加密后落库，密钥来自环境变量 `DSL_AD_LDAP_KEY` 或安装时自动生成的数据目录密钥文件，绝不明文存储。

## 5. 卸载与数据保留

卸载时在插件管理页选择：
- **保留配置数据**：保留 `.data` 目录中的域配置、审计日志、授权缓存（便于重装后恢复）。
- **清除配置数据**：删除插件数据目录（不可恢复，请先备份）。

> 插件下架后，已安装实例可继续正常使用，仅禁止从市场重新下载安装。

## 6. 环境变量（可选）

| 变量 | 说明 | 默认值 |
|---|---|---|
| `DSL_AD_DATA_DIR` | 插件数据目录 | 包内 `.data` |
| `DSL_AD_LDAP_KEY` | AES-256 密钥（base64，32 字节） | 自动生成 |
| `DSL_AD_DEFAULT_ROLE` | 未携带 actor 请求的默认角色 `admin`/`operator`/`viewer` | `admin` |
| `LDAP_CLIENT_DRIVER` | `mock` / `ldapjs` / `auto` | `auto` |
| `MARKET_API_BASE` | dsmarket API 地址 | `https://dsmarket.example.com/api/v1` |
| `MARKET_MOCK` | `1` 启用内置市场演示数据 | 未设置 |

插件 Config（在 `cordis.patch.yml` 的 `config` 下）支持：

| 配置项 | 说明 | 默认 |
|---|---|---|
| `defaultRole` | 前端未传 actor 时的默认角色，可做权限隔离 | `admin` |
| `marketApiBase` | 市场 API 地址覆盖 | 空 |
| `ldapClientDriver` | 驱动覆盖 | 空 |

> 默认角色设为 `admin` 是为了独立安装的插件开箱可用；生产环境可改为 `viewer`/`operator` 实现权限隔离。
