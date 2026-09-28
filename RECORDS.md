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

Decision 和 Deviation 按发生顺序记录如下。

## DCS-003 — 采用零运行时依赖的 Vanilla TypeScript 路线

- 时间：2026-09-27（America/Los_Angeles）
- 关联阶段：STG-03 / STG-04
- 背景：项目需要明确类型、静态构建和自动测试，但 UI 与规则规模很小；预检发现 Node、pnpm 可用，npm/npx/全局 tsc 不可用。
- 可选方案：Vanilla TypeScript + Node test；Vite/Vitest/Papa Parse；React/Vue；原生 JavaScript。
- 决定及理由：选择浏览器原生 ES modules、TypeScript compiler、Node 内置 test、自有受限 CSV Adapter；仅 TypeScript 为开发依赖。它保留编译期类型和静态构建，同时避免 UI 框架、测试框架和运行时依赖。
- 影响：CSV 方言被明确限制并通过对照 fixture 验证；若范围外方言成为必须项，必须回到 Contract，而不是悄悄引入大型解析栈。
- 操作用途：Production + Validation。
- 验证强度：完整 Core/Adapter 自动测试、生产构建重载和真实浏览器验证。
- 证据：`TECH_DESIGN.md`、`evidence/STG-04-PREFLIGHT.md`。
- 是否需要更新 Contract：否；实现方式遵守已冻结架构与非目标。

## DCS-004 — 输入大小护栏与最小隐私控制

- 时间：2026-09-27（America/Los_Angeles）
- 关联阶段：STG-03 / MD-DATA / MD-SEC
- 背景：Contract 明确不承诺超大文件或性能；同步本地解析仍需避免明显越界输入冻结页面。
- 可选方案：无限制；流式解析；固定保护阈值。
- 决定及理由：在读取前拒绝超过 5 MiB 的文件，并使用 `connect-src 'none'`、无远端资源与网络 API 静态检查强化“不上传”边界。
- 影响：5 MiB 是范围护栏，不是性能承诺；不增加流式处理。
- 操作用途：Conditional production + Security validation。
- 验证强度：边界 UI 测试、CSP/源码检查、浏览器 Network 观察。
- 证据：`TECH_DESIGN.md`；后续 STG-05/06 evidence。
- 是否需要更新 Contract：否；它具体化“超大文件不在范围内”，不改变核心验收。

## DEV-001 — CRLF Adapter fixture 使用 JSON 载体

- 时间：2026-09-27（America/Los_Angeles）
- 关联 Rule ID / Contract 条款：R-VLD-001；TECH_DESIGN 6.2。
- 预期行为：用裸 `fixtures/csv-adapter-rfc.csv` 保存 CRLF、引号和字段内换行样本。
- 实际行为：用 `fixtures/csv-adapter-rfc.json` 的 JSON 转义字符串保存精确输入与独立 expected table。
- 类型与严重度：受控记录载体偏差；Non-blocking。
- 原因和影响：仓库文本行尾规范化会让裸 CSV 的 CRLF 字节在平台间不稳定；JSON 解析后可稳定产生真实 CRLF 字符，且把输入与 expected 明确并列。Adapter 行为、范围和验收不变。
- 临时处理或恢复方式：测试从 JSON 读取 input/expected；如未来需要二进制 fixture，可增加 hash 固定的 binary asset。
- 证据或 Git 提交：`fixtures/csv-adapter-rfc.json`、`tests/csv-adapter.test.mjs`。
- 对最终结论的限制：只能声称 JSON 解码产生的 CRLF 输入已验证；不声称 Git checkout 中裸 CSV 字节保持 CRLF。
- 给 Maintainer 的建议：Project-specific；不建议修改 Playbook Core。
