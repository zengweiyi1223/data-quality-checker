# data-quality-checker — Decision 与 Deviation 记录

## DCS-001 — 设计基线以用户指定提交为权威

- 时间：2026-09-27（America/Los_Angeles）
- 关联阶段：Preflight / STG-00
- 背景：用户固定生命周期设计为 `2319a6904cd1dba0b696e59b9376889a3179b068`。从该提交读取的 `non-power-bi-validation-project.md` 正文仍自述较早基线 `4f4e7348cb75541c5451bb3133b5816a6c53ed77`。
- 可选方案：退回旧提交；以文件自述为准；以用户明确固定提交为准并记录差异。
- 决定及理由：采用用户明确指定的 `2319a690…`；它是本次预检已验证存在且实际读取的固定对象。文件内旧自引用视为非阻塞 Evidence Gap，不修改来源仓库。
- 影响：所有设计引用注明 `2319a690…`；最终 Playbook Feedback 报告该摩擦。
- 操作用途：Validation-only / Governance。
- 验证强度：通过 `git cat-file -t` 与 `git show <commit>:<path>` 完整回读。
- 证据：`evidence/PREFLIGHT.md`
- 是否需要更新 Contract：已在草案中使用权威提交，无需改变产品边界。

## DCS-002 — 采用 PF-APP 并以 MD-DATA 表达数据领域风险

- 时间：2026-09-27（America/Los_Angeles）
- 关联阶段：STG-00 / HYP-01
- 背景：项目既有交互应用特征，也有表格数据处理特征。
- 可选方案：`PF-APP`；`PF-DAT`；双基础画像。
- 决定及理由：采用设计指定的 `PF-APP`，叠加 `MD-DATA` 和领域特征；主要交付与 UAT 对象是浏览器应用，避免引入模型未定义的双画像。
- 影响：UI、隐私和 UAT 是必需阶段；数据语义通过 Contract、Adapter/Core 设计与 fixture 验证。
- 操作用途：Production planning。
- 验证强度：在设计、验收和反馈阶段检查是否出现无法表达的特征。
- 证据：`PROJECT.md` 的 HYP-01 观察项。
- 是否需要更新 Contract：否，已纳入草案。

当前无 Deviation。发生实际偏离时追加 `DEV-nnn`，不预填成功结论。
