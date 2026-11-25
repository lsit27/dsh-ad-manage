---
name: ad-domain-management
description: "AD 域控管理技能：依据组织架构树（公司-中心-部门-小组）创建 OU 与同名全局安全组，按工号规则创建域用户，按计算机名后6位匹配用户并同步描述与 OU，执行禁用/90天后删除/移出到已禁用 OU 的安全策略。触发词：AD、域控、域用户、工号建账号、OU、安全组、计算机入域、禁用删除用户。"
---

# AD 域控管理技能

本技能用于在一台已加入域、安装了 RSAT 的管理机上，用 PowerShell（ActiveDirectory 模块）按公司既定规则管理 AD 域。所有操作必须先读规则、再执行、后校验，禁止直接硬删任何对象。

> 安装位置：`~/.dsh/skills/ad-domain-management/SKILL.md`（user 级，全局可用）；同步副本：`~/.agents/skills/ad-domain-management/SKILL.md`。
> 触发方式：会话目录自动包含本技能，可直接说“按 AD 规则建用户/OU/组/计算机匹配”调用，或显式 `skill: ad-domain-management`。

## 0. 环境与前置条件
- 使用 PowerShell 7（`pwsh.exe -NoLogo -NoProfile`），不得调用 powershell.exe（5.1）。
- 会话中先执行 `Import-Module ActiveDirectory`；模块缺失时提示安装 RSAT：`Get-WindowsCapability -Online | ? Name -like 'Rsat.ActiveDirectory*' | Add-WindowsCapability -Online`。
- 需域管理员或已委派相应权限的账号；遵循最小权限原则，建议用专用服务账号。
- 域根按实际填写，示例统一写作 `DC=company,DC=com`；公司OU示例 `OU=公司,DC=company,DC=com`，已禁用OU示例 `OU=已禁用,DC=company,DC=com`（不存在则先创建）。
- 任何写操作前先“查重”：对象是否已存在、工号是否重复、目标OU是否存在，已存在则跳过或更新，不盲目新建。
- 所有变更写入审计日志（时间、操作人、对象、结果），建议 ` Add-Content -Path C:\Logs\ad-audit.log -Value ...`。

## 1. 核心规则（必须遵守，不可简化）
### 1.1 OU 创建规则
- 层级严格按组织架构树：`公司 → 中心 → 部门 → 小组`，逐级建在上级 OU 下。
- 人员、安全组、计算机默认存放到其归属“部门/小组”对应的 OU（即组织树的末级节点）。
- 每个 OU 创建时启用意外删除保护：`-ProtectedFromAccidentalDeletion $true`。
- 命令模板：
  ```powershell
  New-ADOrganizationalUnit -Name '技术中心' -Path 'OU=公司,DC=company,DC=com' -ProtectedFromAccidentalDeletion $true
  New-ADOrganizationalUnit -Name '研发部' -Path 'OU=技术中心,OU=公司,DC=company,DC=com' -ProtectedFromAccidentalDeletion $true
  ```

### 1.2 安全组创建规则
- 创建 OU 时，同步创建一个与该 OU 同名的“全局（Global）安全组（Security）”，并存放到该 OU 目录下。
- 命令模板：
  ```powershell
  New-ADGroup -Name '研发部' -SamAccountName '研发部' -GroupScope Global -GroupCategory Security `
    -Path 'OU=研发部,OU=技术中心,OU=公司,DC=company,DC=com' -Description '研发部全局安全组'
  ```

### 1.3 用户创建规则
- 显示姓名（DisplayName/Name）= 姓名
- 账号（SamAccountName，登录名）= 工号；UPN = 工号@域后缀
- 描述（Description）= `部门-工号-姓名`（部门取末级部门/小组名）
- 初始密码 = `Hz.88888`，用 `ConvertTo-SecureString 'Hz.88888' -AsPlainText -Force`
- 密码永不过期：`-PasswordNeverExpires $true`；不强制首次登录改密：`-ChangePasswordAtLogon $false`
- 加入同名部门安全组：`Add-ADGroupMember -Identity '部门名' -Members '工号'`
- 存放 OU = 对应部门 OU
- 命令模板：
  ```powershell
  $pw = ConvertTo-SecureString 'Hz.88888' -AsPlainText -Force
  New-ADUser -Name '张三' -DisplayName '张三' -SamAccountName '10086' -UserPrincipalName '10086@company.com' `
    -Path 'OU=研发部,OU=技术中心,OU=公司,DC=company,DC=com' -Description '研发部-10086-张三' `
    -AccountPassword $pw -Enabled $true -PasswordNeverExpires $true -ChangePasswordAtLogon $false
  Add-ADGroupMember -Identity '研发部' -Members '10086'
  ```

### 1.4 计算机匹配与迁移规则
- 从计算机名中提取末尾 6 位数字：`$code = [regex]::Match($name,'(\d{6})$').Groups[1].Value`；不足 6 位则跳过并记录。
- 用 `$code` 匹配用户账号（SamAccountName = 工号）；未找到匹配用户则跳过。
- 匹配成功时：
  1. 将用户描述（`部门-工号-姓名`）写入/追加到计算机 Description（已有描述用 `；` 分隔追加，避免覆盖）。
  2. 取用户所在 OU（从 DistinguishedName 去掉首段 RDN），把计算机与该用户都移动到该 OU（同一 OU）。
- 命令模板：
  ```powershell
  $code = [regex]::Match($c.Name,'(\d{6})$').Groups[1].Value
  if ($code) {
    $u = Get-ADUser -Filter "SamAccountName -eq '$code'" -Properties Description,DistinguishedName
    if ($u) {
      $ou = ($u.DistinguishedName -split ',',2)[1]
      $old = (Get-ADComputer $c -Properties Description).Description
      $desc = if ($old) { "$old；$($u.Description)" } else { $u.Description }
      Set-ADComputer -Identity $c -Description $desc
      Move-ADObject -Identity $c.DistinguishedName -TargetPath $ou
      Move-ADObject -Identity $u.DistinguishedName -TargetPath $ou
    }
  }
  ```

### 1.5 删除/禁用安全策略（禁止直删）
- 用户禁止直接删除：必须先 `Disable-ADAccount` 禁用，并记录禁用日期（写入 `extensionAttribute1`，格式 `yyyy-MM-dd`，不破坏原生 Description 规则）。
- 仅当禁用时长 > 90 天（`(Get-Date) - (Get-Date $ext1) -gt 90` 天）才允许删除 `Remove-ADUser`；未满 90 天拒绝并提示剩余天数。
- 安全组、OU 禁止直接删除：统一用 `Move-ADObject` 移出公司 OU，放入“已禁用”OU 目录（该OU下可按原层级保留子容器）。
- OU 已启用意外删除保护时，需先 `-ProtectedFromAccidentalDeletion $false` 才能移动/删除，操作后按策略重新评估。
- 命令模板：
  ```powershell
  # 禁用并记录日期
  Disable-ADAccount -Identity '10086'
  Set-ADUser -Identity '10086' -Replace @{extensionAttribute1=(Get-Date -Format 'yyyy-MM-dd')}
  # 90天后检查并删除
  $d = (Get-ADUser '10086' -Properties extensionAttribute1).extensionAttribute1
  if ($d -and ((Get-Date) - (Get-Date $d)).Days -gt 90) { Remove-ADUser -Identity '10086' -Confirm:$false }
  # OU/组移入已禁用OU
  Move-ADObject -Identity 'OU=研发部,OU=技术中心,OU=公司,DC=company,DC=com' -TargetPath 'OU=已禁用,DC=company,DC=com'
  ```

## 2. 补充规则（原规则遗漏项，已一并纳入）
1. 防误删：OU 一律开启 ProtectedFromAccidentalDeletion。
2. 幂等性：创建前查重，重复对象改为更新，不产生脏数据。
3. 审计日志：每次创建/移动/禁用/删除都记录到日志文件，便于追溯。
4. 禁用日期用 extensionAttribute1 保存，避免污染约定好的 Description 字段。
5. 计算机描述为“追加”而非覆盖，保留原有运维信息。
6. 批量场景：从 CSV（列：姓名、工号、部门、中心）导入，逐条校验并汇总成功/失败清单。
7. 工号唯一性、UPN 后缀、密码复杂度（Hz.88888 已含大写/小写/数字/符号）在创建前校验。
8. 所有破坏性操作（删除、移出OU、解除删除保护）执行前必须向用户展示将影响的对象清单，确认后再执行；在当前会话已关闭审批提示时仍以二次确认文本方式征询用户。

## 3. 标准作业流程（接到任务时按序）
1. 明确变更类型（建OU/建组/建用户/计算机匹配/禁用/删除）与目标对象清单。
2. 加载模块、核对域根与公司OU、已禁用OU是否存在。
3. 查重 + 打印“计划变更清单”给用户确认。
4. 按第1节对应规则执行，使用事务式思维：一步失败即停止并报告，避免半状态。
5. 回读验证：Get-ADUser/Get-ADGroup/Get-ADOrganizationalUnit/Get-ADComputer 核对属性与位置。
6. 写审计日志，输出简明结果（成功/跳过/失败及原因）。
