# data-quality-checker — Playbook 反馈

- Playbook 基线：`v0.2@dff3a717d59935697e310a29caf6b29dff11ff11`
- 生命周期设计：`2319a6904cd1dba0b696e59b9376889a3179b068`
- 需求冻结提交：`70fb532bd31b9ffcf0794eafd41b583621ab4ed4`
- 公开 release：`a475db50b18e7a430d04e4dbede72679a8c97adb`
- 最终验收提交：以最终 remote `main` 和 Maintainer 回传的完整 SHA 为准。

## 1. 总体评价

- Required Rules：全部适用规则均执行；未发现静默越权或用单一成功结论掩盖缺口。
- Provisional Rules：R-VLD-003 采用风险分级往返；R-EXV-003 因不作效率声明而不计时；R-VDC-002 完成操作分类。
- 总体帮助：Evidence Gate、Human Gate、checkpoint 和结论分级直接阻止了 favicon 404、SVG 行尾 hash 差异和外部发布权限未冻结时的继续执行。
- 最大摩擦：小项目的阶段状态、Gate 与增量 Gate 在 PROJECT、VALIDATION、evidence 间有少量重复；最终仍可通过单一滚动 Validation 控制。
- Conformity 与 Utility 分开看：高 conformity 不作为有效性证据；本次 utility 的主要正证据是规则实际发现并阻断了问题。

## 2. Rule 反馈

| Rule ID | Conformity | Utility | 证据/问题 | 建议 |
| --- | --- | --- | --- | --- |
| R-FRM-001 | Yes | Helpful | 可证伪问题与非目标阻止范围扩展 | Keep |
| R-CTR-001 | Yes | Helpful | HG-01 冻结输入、输出、Oracle、停止和结论 | Keep |
| R-CTR-002 | Yes | Helpful | 四个 Gate 分离 Contract、设计、UAT、发布权限 | Keep |
| R-SAF-001 | Yes | Helpful | CSV 不上传、外部写入和脱敏边界可验证 | Keep |
| R-WRK-001 | Yes | Helpful | 固定来源 commit、独立仓库、临时 worktree 分离 | Keep |
| R-PFL-001 | Yes | Helpful | 工具/权限预检发现 npm/tsc 和 workflow scope 条件 | Keep |
| R-EXV-001 | Yes | Helpful | favicon 404 与 hash 差异均在依赖步骤前阻断 | Keep |
| R-EXV-002 | Yes | Helpful | HG-01～04 均由用户明确批准 | Keep |
| R-EXV-003 | N/A | Neutral | 不作效率声明，未制造伪精确时间 | Keep |
| R-VLD-001 | Yes | Helpful | 手工 expected、Core/Adapter 分离、浏览器与 HTTPS 回读 | Keep |
| R-VLD-002 | Yes | Helpful | AC 到 evidence 可定位，首次失败保留 | Keep |
| R-VLD-003 | Yes | Helpful | build、浏览器、发布均完整往返；重复项才压缩 | Keep |
| R-STP-001 | Yes | Helpful | Blocking/Non-blocking 区分支持正确停止 | Keep |
| R-GIT-001 | Yes | Helpful | Contract、Design、C2～C7、release 均有 checkpoint | Keep |
| R-GIT-002 | Yes | Helpful | 阶段级提交足够，没有为每个命令制造提交 | Keep |
| R-VDC-001 | Yes | Helpful | Handoff 分列功能、Contract、证据、状态和边界 | Keep |
| R-VDC-002 | Yes | Helpful | 生产、条件式、诊断、验证专用操作未混写 | Keep |
| R-HOF-001 | Yes | Helpful | HANDOFF 集中入口、证据、回滚和非结论 | Keep |
| R-GOV-001 | Yes | Helpful | 来源仓库和 `playbook/**` 全程未修改 | Keep |
| R-FBK-001 | Yes | Helpful | 本文件区分 conformity、utility 和问题分类 | Keep |

## 3. 采用前规划对比

| 原规划内容 | 采用当前 Playbook 后的变化 | 分类 | 理由与效果 |
| --- | --- | --- | --- |
| 直接实现 CSV 页面 | 先冻结 5/4/3 Oracle、非目标和安全边界 | Risk Correction | 避免把解析器能力或业务推断悄悄扩大 |
| 一次性实现后测试 | 切为 Core、Adapter、UI、安全构建、综合验收 | Operational Clarification | 失败可定位且依赖 Gate 清晰 |
| 发布到静态托管 | 分离 HG-03 UAT、HG-04 外部写入和 release workflow | Risk Correction | 无远端写入越权；目标账号/可见性明确 |
| “可回滚”文字说明 | checkpoint 恢复、测试与 7/7 hash 复验 | Risk Correction | 发现 SVG 行尾造成的真实复现缺口 |
| 项目记录 | 逻辑模板映射到少量物理文件 | Playbook-only Alignment | 有少量维护成本，但支持中途恢复和最终交接 |

## 4. v0.2 Provisional Rules

| Rule ID | 实际采用方式 | 成本 | 新发现/避免的错误 | Utility | 建议 |
| --- | --- | --- | --- | --- | --- |
| R-VLD-003 | 首次/高风险状态完整往返；稳定重复项按证据压缩 | 两次构建、多个浏览器和隔离 worktree | 发现 favicon 404、SVG EOL 和公开产物一致性 | Helpful | Keep |
| R-EXV-003 | 不适用；明确不作效率声明 | 极低 | 避免把缺少时间戳的数据写成效率结论 | Neutral | Keep |
| R-VDC-002 | 明确分类四类操作 | 低 | 防止把 CDP、hash 和临时 worktree误写为用户运行步骤 | Helpful | Keep |

- 状态转换表保留了首态、Blocking、修复后首次通过、UAT 与发布状态，同时压缩了稳定重复命令。
- 未发现因压缩记录而无法复核的关键内容；完整 raw console 未全部入库，但关键值、ID、hash、错误和恢复路径均保存。

## 5. HYP-01 至 HYP-07 结果

| ID | 结果 | 观察 | Utility |
| --- | --- | --- | --- |
| HYP-01 | Supported | PF-APP + MD-UI/DATA/DEPLOY/SEC 和 conditional OPS 足够；无需切换 PF-DAT 或自由新增画像 | Helpful |
| HYP-02 | Supported | R/C/N/A 明确保留 UAT、发布、回滚、安全并排除 EXT/MULTI/HIGH | Helpful |
| HYP-03 | Supported | 4 个 Gate Approver 明确；外部创建、push、部署均在 HG-04 后；零已知越权 | Helpful |
| HYP-04 | Supported with friction | README/PROJECT/VALIDATION 可恢复当前状态；最终 HANDOFF 与滚动 Validation 职责不同，但状态行有少量重复 | Helpful |
| HYP-05 | Supported | lifecycle stage 与 v0.2 Gate 可共用同一 Validation/evidence，没有冲突 Gate | Neutral-to-Helpful |
| HYP-06 | Strongly supported | Release/OPS 阶段发现 SVG EOL、workflow scope、runner 漂移与公开回滚边界 | Helpful |
| HYP-07 | Supported | Validation 适合运行中状态和异常链；HANDOFF 适合最终入口与非结论，不建议合并 | Helpful |

## 6. 问题分类

| 问题 | 初步分类 | 建议处理位置 |
| --- | --- | --- |
| 设计提交正文仍自述旧基线 `4f4e…` | Evidence gap | 修正设计文档自引用或生成检查 |
| 小项目状态在 PROJECT/VALIDATION/HANDOFF 有少量重复 | Template | 明确“滚动状态只在 Validation，其他文件只给稳定摘要” |
| CRLF 裸 fixture 受 Git 行尾影响 | Adapter / Project-specific | 数据类项目模板建议二进制 hash 或转义载体 |
| SVG 等非代码文本未固定 EOL 会破坏跨 worktree hash | Template / Evidence gap | 构建复现清单提醒覆盖全部文本资产扩展名 |
| GUI automation 通道环境失败 | Project-specific | 保留真实浏览器替代路线和结论限制，不改 Core |
| Pages runner 使用浮动 `ubuntu-latest` | Project-specific | 需要更强复现时固定 runner image；当前记录迁移风险 |

分类只是实验方建议；最终是否修改 Playbook 由 Maintainer Review 决定。

## 7. 反馈附件

- HANDOFF：`HANDOFF.md`
- VALIDATION：`VALIDATION.md`
- Decision/Deviation：`RECORDS.md`
- 证据索引：`evidence/PREFLIGHT.md`、`evidence/I-01-SCAFFOLD.md` 至 `evidence/I-08-PUBLIC-RELEASE.md`、`evidence/HG-03-UAT.md`、`evidence/HG-04-PUBLISH.md`
- 相关 checkpoint：`70fb532`、`1c54648`、`c734f6c`、`c8017b9`、`e4ec585`、`a475db5`
