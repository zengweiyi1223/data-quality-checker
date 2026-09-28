# data-quality-checker — 项目画像与生命周期裁剪

- 状态：`STG-00 Passed；HG-01 Passed；HG-02 Pending`
- 记录日期：2026-09-27（America/Los_Angeles）
- Playbook：`v0.2@dff3a717d59935697e310a29caf6b29dff11ff11`
- 生命周期设计：`2319a6904cd1dba0b696e59b9376889a3179b068`
- 原始规划：[docs/ORIGINAL_REQUEST.md](docs/ORIGINAL_REQUEST.md)

## 1. 项目画像

| 项目 | 选择 | 理由 |
| --- | --- | --- |
| 基础画像 | `PF-APP` | 主要交付是供人直接操作和分享的浏览器应用；数据检查是领域能力，不把项目改写为分析项目。 |
| 领域特征 | 表格数据质量检查 | 输入为 CSV 表格，输出为空值和完全重复行的结构化检查结果。 |
| 启用修饰器 | `MD-UI`、`MD-DATA`、`MD-DEPLOY`、`MD-SEC` | 分别覆盖交互/UAT、不可上传的用户数据、静态公开部署与回滚、隐私与网络证据。 |
| 条件式修饰器 | `MD-OPS` | 仅在部署后执行最小可用性复核和版本回滚验证；不建立值守、告警或 SLA。 |
| 不启用 | `MD-EXT`、`MD-MULTI`、`MD-HIGH` | 核心产品无外部 API/账号依赖；单一 Experiment Owner 与用户审批；错误可逆且无高代价写操作。GitHub Pages 仅是受控交付目标，由 `MD-DEPLOY` 管理。 |

排除 `PF-DAT` 的理由：应用的主要验收对象是用户可直接使用的 UI 与本地执行行为；数据契约和 Core/Adapter 边界通过 `MD-DATA` 与技术设计覆盖。若后续事实表明该表达不自然，记录为 HYP-01 反例，而不静默切换画像。

## 2. 角色与责任

| 角色 | 可识别主体 | Accountable / Executor / Control |
| --- | --- | --- |
| Experiment Owner | 当前 Codex 项目对话 | `AI Execute`：项目内文档、实现、测试、验证、证据与 Git checkpoint；对不越权和证据质量负责。 |
| Human Approver | 当前用户 | `Human Review` + `Human Approve`：HG-01、HG-02、HG-03、HG-04；提供主观 UAT 和外部写入授权。 |
| Automation | 项目测试/构建工具 | 在已批准路线内执行确定性测试和静态构建；输出仅是证据输入，不能自行批准 Gate。 |
| Playbook Maintainer | 用户指定的 Playbook Maintainer 对话 | 仅在实验完成后接收 HANDOFF、VALIDATION、PLAYBOOK_FEEDBACK 与最终提交号；唯一有权变更 Playbook。 |

边界：AI 可以起草、执行项目内可逆操作并提出建议；不得代替用户通过 Human Gate，不得创建远端、push、发布、修改来源仓库或修改 Playbook。

## 3. 阶段裁剪

| Stage | 适用性 | Purpose / 退出 Gate | Owner / Approver | 记录 |
| --- | --- | --- | --- | --- |
| STG-00 Profile & Tailor | Required | 冻结画像、修饰器、角色、阶段和记录映射；本文件完整且无静默删项即退出。 | AI / 用户在 HG-01 复核 | `PROJECT.md` |
| STG-01 Discover & Frame | Required | 冻结用户、场景、价值、可证伪问题与非目标。 | AI / HG-01 | `REQUIREMENTS.md` |
| STG-02 Contract | Required | 冻结范围、验收、Oracle、安全、停止、结论、Gate 与计时口径。 | AI / HG-01 | `REQUIREMENTS.md` |
| STG-03 Design | Required | UI、Core、Adapter、测试、构建与部署设计可直接实施且边界一致。 | AI / HG-02 | `TECH_DESIGN.md`（HG-01 后创建） |
| STG-04 Plan & Prepare | Required | 工具预检、原子计划、fixture、证据和 checkpoint 方案就绪。 | AI / HG-02 | 合并入 `TECH_DESIGN.md`、`VALIDATION.md` |
| STG-05 Implement & Verify | Required | 每个原子增量通过独立验证与 Gate，失败不得进入依赖步骤。 | AI；必要时用户 | `VALIDATION.md`、`evidence/**`、Git |
| STG-06 Integrated Acceptance | Required | Core、Adapter、浏览器、构建产物、网络隐私证据全部满足 Contract；用户完成 UAT。 | AI + Automation / HG-03 | `VALIDATION.md`、UAT 记录 |
| STG-07 Release / Delivery | Required | HG-04 后发布到经确认的 GitHub Pages，验证 HTTPS、提交对应关系与回滚。 | AI / HG-04 | `VALIDATION.md`、`HANDOFF.md` |
| STG-08 Operate / Observe | Conditional | 条件：公开部署已完成。只验证最小可用性与版本回滚；否则 `Not Applicable`。 | AI / 用户观察 | 合并入 `VALIDATION.md` |
| STG-09 Handoff / Close / Learn | Required | 交付、限制、证据地图、反馈和最终提交完备，并返回 Maintainer 对话。 | AI + 用户 | `HANDOFF.md`、`PLAYBOOK_FEEDBACK.md`、`RECORDS.md` |

## 4. 逻辑记录到实际文件的映射

| 逻辑记录 | 实际文件 | 拆分理由 |
| --- | --- | --- |
| 原始规划 | `docs/ORIGINAL_REQUEST.md` | 防止为提高 conformity 重写实验事实。 |
| PROJECT | `PROJECT.md` | 画像、角色、阶段与假设需要在全周期稳定引用。 |
| REQUIREMENTS / Contract | `REQUIREMENTS.md` | HG-01 的单一权威来源。 |
| TECH_DESIGN + DELIVERY_PLAN | `TECH_DESIGN.md` | 项目小且单执行者，设计与原子计划合并可减少重复；HG-01 后才创建。 |
| VALIDATION + 当前状态 | `VALIDATION.md` | 当前恢复入口与最终验证事实共用一份滚动记录，最终 Handoff 独立。 |
| Decision / Deviation | `RECORDS.md` | 低数量记录累计在一个文件中。 |
| Evidence | `evidence/**` | 保存可定位机器输出、截图索引和人工确认；不保存用户 CSV。 |
| HANDOFF | `HANDOFF.md` | 最终交付与上下文恢复入口；后期创建。 |
| PLAYBOOK_FEEDBACK | `PLAYBOOK_FEEDBACK.md` | 方法验证的独立反馈；后期创建。 |

不会预建未使用的空目录或空模板。

## 5. HYP-01 至 HYP-07 观察方案

| ID | 观察方法 | 采集点 / 判据 |
| --- | --- | --- |
| HYP-01 | 在每次范围或风险变化时检查 `PF-APP + modifiers` 是否足够表达；记录被迫增加自由文本或切换画像的事件。 | STG-00、设计复核、最终反馈；零无法表达特征支持假设，反例按类型记录。 |
| HYP-02 | 记录 R/C/N/A 判断发现的遗漏、填写耗时近似值和无价值字段。 | 每阶段进入/退出与最终反馈；是否因明确理由避免漏掉 UAT、发布、回滚或安全。 |
| HYP-03 | 统计越权、Approver 不明确、等待起点不清、重复确认。 | 每个 HG 和外部写入前；目标为零越权、零身份歧义，重复确认有原因。 |
| HYP-04 | 统计逻辑记录数、物理文件数、重复段落和一次冷启动恢复是否能定位当前状态。 | HG-02、STG-06、STG-09；恢复时只读 README/PROJECT/VALIDATION 能否找到下一动作。 |
| HYP-05 | 统计生命周期 Gate 与 v0.2 Gate 的重复、状态冲突、为双重记录增加的维护动作。 | 每个 STG-05 循环与最终反馈；同一事实只保留一个权威记录。 |
| HYP-06 | 检查 Release、conditional Operate、Close 是否发现部署遗漏、回滚缺口、可用性或重开问题。 | STG-07～09；分别记录 Helpful/Neutral/Burdensome 与具体避免的问题。 |
| HYP-07 | 在中途恢复与最终交接各做一次定位检查，比较滚动 `VALIDATION` 与最终 `HANDOFF` 的职责。 | HG-02 前的当前状态恢复、STG-09 最终复核；判断应合并、区分或调整。 |

所有假设最终分别报告 Conformity 与 Utility；高遵守度不作为有效性证据。
