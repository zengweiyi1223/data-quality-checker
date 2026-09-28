# data-quality-checker — 技术设计与实施计划

- 状态：`Draft — Awaiting HG-02`
- Contract：`HG-01 frozen@70fb532bd31b9ffcf0794eafd41b583621ab4ed4`
- Playbook：`v0.2@dff3a717d59935697e310a29caf6b29dff11ff11`
- 生命周期设计：`2319a6904cd1dba0b696e59b9376889a3179b068`
- 设计原则：最小依赖、模块边界可静态检查、核心可绕过 UI 测试、用户 CSV 不离开浏览器。

## 1. 方案比较与决定

| 方案 | 组成 | 优点 | 代价/风险 | 结论 |
| --- | --- | --- | --- | --- |
| A. Vanilla TypeScript + TypeScript compiler + Node 内置测试 | 浏览器原生 ES modules；无 UI 框架；CSV Adapter 自有小型状态机；仅 TypeScript 为开发依赖 | 明确类型；零运行时依赖；构建和测试链短；GitHub Pages 子路径兼容；最贴合本轮有限 CSV 边界 | Adapter 必须自行测试引号/CRLF/错误；UI 状态手工管理 | **采用** |
| B. Vanilla TypeScript + Vite/Vitest + CSV 库 | Vite、Vitest、Papa Parse 等 | 开发体验成熟；CSV 覆盖广 | 至少 4～5 个直接依赖；本轮并不承诺广泛 CSV 方言；增加生成链和供应链表面积 | 不采用 |
| C. React/Vue + 构建器 + 测试库 | 组件框架与 DOM 测试生态 | 复杂 UI 可维护性强 | 当前仅一个文件输入、摘要和问题表；框架不降低核心风险 | 不采用 |
| D. 原生 JavaScript + Node 内置测试 | 无依赖，可直接静态托管 | 工具最少 | 缺少编译期类型门；`QualityReport` 与边界只能靠约定/JSDoc | 不采用 |

决定：使用原生 TypeScript、浏览器 ES modules、Node 内置 `node:test`、自有受限 CSV Adapter。包管理器使用环境中已有的 pnpm；仅安装固定版本的 `typescript` 开发依赖并提交 lockfile。版本在 HG-02 后安装时由 lockfile 冻结，不在设计阶段猜测远端最新版。

环境事实：Node `v24.19.0`、pnpm `11.19.0`、Git `2.55.0.windows.2` 可用；`npm`、`npx`、全局 `tsc` 不可用。缺少 npm 不构成路线切换，因为 pnpm 可用；若 pnpm 安装或 registry 访问失败，则作为 Environment Failure 停止，不静默换 CDN、vendoring 或其他包管理器。

## 2. 架构与依赖方向

```text
CSV File
  │ browser File.text()
  ▼
CSV Adapter  ──parseCsv(text)──▶  NormalizedTable
                                      │
                                      ▼
                                Quality Core
                                  checkTable()
                                      │
                                      ▼
                                QualityReport
                                      │
                                      ▼
                               Static Web UI
```

允许的依赖方向：

```text
ui/app.ts ──▶ adapters/csv.ts ──▶ shared/types.ts
   │                                   ▲
   └────────▶ core/quality.ts ─────────┘
```

约束：

- `core/**` 只依赖 `shared/types.ts`，不得引用 DOM、File、fetch、UI 状态、托管平台或 Node API。
- `adapters/**` 把 CSV 文本转换为标准化表；不得执行质量规则或构造 UI。
- `ui/**` 负责 File 输入、状态切换、调用 Adapter/Core 和渲染；不得复制检查算法或 CSV 解析算法。
- 所有浏览器资产本地打包/编译；无 CDN、远端字体、遥测、分析、后端或动态 import URL。
- HTML 使用相对 URL，因此根路径和 GitHub Pages 项目子路径均可工作。

## 3. Core API 与数据结构

以下是设计签名，不是业务实现：

```ts
interface TableColumn {
  index: number;
  name: string;
}

interface NormalizedRow {
  rowNumber: number; // 1-based data row, excludes header
  sourceLine: number; // 1-based CSV record start line
  values: readonly string[];
}

interface NormalizedTable {
  columns: readonly TableColumn[];
  rows: readonly NormalizedRow[];
}

interface MissingValueFinding {
  kind: "missing-value";
  rowNumber: number;
  sourceLine: number;
  columnIndex: number;
  columnName: string;
}

interface DuplicateGroupFinding {
  kind: "exact-duplicate";
  rowNumbers: readonly number[];
  sourceLines: readonly number[];
}

interface QualityReport {
  schemaVersion: 1;
  summary: {
    totalRows: number;
    issueCount: number;
    missingValueCount: number;
    duplicateGroupCount: number;
    affectedRowCount: number;
  };
  missingValues: readonly MissingValueFinding[];
  duplicateGroups: readonly DuplicateGroupFinding[];
  affectedRows: readonly number[];
}

function checkTable(table: NormalizedTable): QualityReport;
```

Core 不变量：

1. 不修改输入对象或数组。
2. 空值只认精确空字符串，不 trim。
3. 完全重复用完整字符串数组的无碰撞序列化键（例如 JSON 数组表示），不做类型/大小写转换。
4. 每个重复组只产生一个 finding，包含首次行与全部后续相同行；组和行均按首次出现顺序稳定输出。
5. `issueCount = missingValues.length + duplicateGroups.length`。
6. `affectedRows` 升序去重；`affectedRowCount = affectedRows.length`。
7. 列数/行号等结构不合法时拒绝输入，不用静默修补掩盖 Adapter 缺陷。

## 4. CSV Adapter 边界

入口：

```ts
function parseCsv(text: string): NormalizedTable;
class CsvParseError extends Error {
  code: "EMPTY_FILE" | "INVALID_HEADER" | "UNCLOSED_QUOTE" | "UNEXPECTED_QUOTE" | "ROW_WIDTH_MISMATCH";
  sourceLine?: number;
}
```

本轮支持：

- UTF-8 文本与可选 UTF-8 BOM；浏览器以 `File.text()` 解码。
- 逗号分隔、LF 或 CRLF。
- 双引号字段、字段内逗号、`""` 转义双引号、引号字段内换行。
- 最后一个 record 后可有单个行终止符，不额外生成空数据行。
- 第一条 record 是表头；表头不得为空或重复；每条数据 record 必须与表头等宽。
- 记录 `rowNumber` 与 record 起始 `sourceLine`。

明确不支持或不推断：

- 编码探测、UTF-16、分号/tab 分隔、注释、自动类型、日期、locale 或业务含义。
- 自动 trim、自动补列、跳过中间空行、容忍未闭合引号。
- 多文件合并、流式解析或超大文件性能承诺。

UI 在读取前设置 5 MiB 文件大小保护阈值，超过即给出范围外错误，不读取内容。该阈值是防止同步解析明显越界输入的安全护栏，不构成 5 MiB 内性能保证。

## 5. UI 流程与状态

```text
Idle
 └─选择一个 .csv
      ├─文件 > 5 MiB ─▶ Error(size)
      └─Reading ─▶ Parsing/Checking
                       ├─ CsvParseError ─▶ Error(code + location)
                       └─ Success
                            ├─ Summary
                            ├─ Missing-value locations
                            └─ Duplicate groups
 任意终态 ──选择新文件──▶ Reading（替换内存状态）
```

页面只包含：产品说明与隐私提示、带 label 的单文件 input、状态区域、摘要卡片、空值表、重复组表、限制说明。不会显示整份 CSV、提供编辑/修复、保存上传内容或保留跨刷新状态。

可用性与无障碍：

- 原生控件与语义表格；键盘无需自定义快捷键。
- 状态区域使用适度的 `aria-live`；错误文字包含原因和可恢复动作，不只依赖颜色。
- 成功结果明确区分“问题数”和“受影响行数”，位置使用 Contract 的数据行序号。
- 重新选择文件会清空旧报告；刷新后回到 Idle。

隐私控制：

- CSP meta 至少设置 `default-src 'self'`、`connect-src 'none'`、`object-src 'none'`、`base-uri 'none'`、`form-action 'none'`；脚本和样式只允许 self。
- 生产代码不得出现 `fetch`、XHR、WebSocket、sendBeacon、表单提交或外部资源 URL。
- 文件文本仅保存在当前调用/页面内存中；不写 localStorage、IndexedDB、Cache API、日志或证据。
- UI 只能说明“本应用代码在本次验证范围内不上传”；不能声称浏览器扩展、OS 或供应链绝对无外传。

## 6. 测试与 fixture 方案

### 6.1 独立 Oracle fixture

`fixtures/quality-oracle.csv` 使用 Contract 已冻结的 5 行内容；`fixtures/quality-oracle.expected.json` 手工保存以下关键预期，不调用生产 Core 生成：

- 5 行；
- missing locations：row 2/name、row 3/name、row 4/email；
- duplicate group：rows [2, 3]；
- issueCount 4；affectedRows [2, 3, 4]。

测试加载该 JSON 并与 `checkTable` 的完整结果做 deep equality。若实现签名要求增加字段，必须先判断是否影响 Contract；不得在测试失败后用 Core 输出覆盖 expected 文件。

### 6.2 Adapter 对照 fixture

`fixtures/csv-adapter-rfc.csv` 冻结为：

```text
id,display_name,note<CRLF>
1,"Doe, Jane","He said ""hello"""<CRLF>
2,Bob,"line one<CRLF>
line two"<CRLF>
```

`<CRLF>` 表示两个行终止字节，不是 fixture 中的字面字符。

预期：

- headers：`id`、`display_name`、`note`；
- 两行数据；
- row 1 values：`["1", "Doe, Jane", "He said \"hello\""]`，sourceLine 2；
- row 2 values：`["2", "Bob", "line one\r\nline two"]`，sourceLine 3。

另有小型 inline/fixture 用例覆盖 BOM、LF、末尾换行、空字段、重复/空表头、未闭合引号、非引号字段中的意外引号和列宽不一致。Adapter expected values 由测试常量手工定义，不经 Adapter 自己生成。

### 6.3 测试层次

| 层次 | 绕过内容 | 验证 |
| --- | --- | --- |
| Core 单元测试 | 绕过 UI、File 和 CSV Adapter | Oracle 精确结果、空值语义、重复组、稳定排序、输入不变性、无问题/空表边界 |
| Adapter 对照测试 | 绕过 UI 和 Core | 文本到 NormalizedTable 的逐字段/行号精确结果与错误代码 |
| 静态边界检查 | 不运行浏览器 | Core 禁止 import DOM/UI/Adapter/网络；源码/构建产物无网络 API/外部 URL；CSP 存在 |
| 浏览器集成 | 真实静态构建 | 选择 fixture、状态、摘要、问题位置、替换文件、刷新、错误恢复 |
| 构建往返 | 从 `dist/` 独立启动 | build 后重新加载，不依赖源码开发路径或内存状态 |
| 隐私验证 | 浏览器 Network + 静态检查 | 文件操作期间无包含 CSV 内容的请求；只见静态资源 GET；`connect-src 'none'` 生效 |

Node 测试文件使用 JavaScript `.test.mjs` 直接 import 编译后的 Core/Adapter，避免新增测试框架。TypeScript 编译负责类型验证，Node test runner 负责行为验证。

## 7. 静态构建与本地验证

计划目录（只在相应增量中创建，不预建空目录）：

```text
src/
  shared/types.ts
  core/quality.ts
  adapters/csv.ts
  ui/app.ts
static/
  index.html
  styles.css
fixtures/
tests/
scripts/
  clean.mjs
  copy-static.mjs
  serve.mjs
dist/                 # 可重建，不提交
```

构建链：

1. `prebuild` 只删除经脚本解析并验证为项目内确切 `dist` 的目录。
2. `tsc -p tsconfig.json` 把 `src/**` 编译为浏览器 ES modules 到 `dist/assets/**`。
3. `postbuild` 复制受控 `static/index.html` 和 `static/styles.css` 到 `dist`，拒绝未列入清单的文件。
4. `serve.mjs` 只用于 Validation，在 localhost 随机/显式端口提供 `dist`，记录请求方法与路径但不记录请求体。

`dist`、依赖缓存和本地日志加入 `.gitignore`；源码、fixture、expected、lockfile、测试和证据索引提交。生产用户只需打开已发布网页；pnpm、Node、测试和本地服务器均为开发/验证操作。

## 8. GitHub Pages 部署设计

HG-04 前只允许在本地准备并审查部署工作流文件，不创建远端、push、启用 Pages 或访问公开 URL。

首选 GitHub Actions Pages 路线：

1. 对经 HG-04 确认的仓库/分支 checkout 指定提交。
2. 使用 lockfile 冻结的 pnpm 安装开发依赖，执行 typecheck、test、build。
3. 只上传 `dist/**` 为 Pages artifact。
4. deploy job 使用 GitHub Pages environment；公开 URL 和 deployment id 回写 Validation。

实施时只依据 GitHub 官方当前文档选择 action 版本，并将第三方/官方 action 固定到可审计版本或提交；该核对发生在 HG-04 前，不提前创建外部资源。工作流不接触用户 CSV，只处理公开源码和合成 fixture。

子路径策略：HTML 与 JS/CSS import 全部是相对路径；不依赖仓库名硬编码。公开地址由 HG-04 明确，不能在设计阶段假定账号或仓库名。

部署验证：

- URL 为 HTTPS，首页和静态模块返回成功；
- 浏览器强制重新加载后完成固定 fixture smoke；
- 页面显示的 release commit 与批准提交一致（构建时写入非秘密版本元数据或静态版本文件）；
- Network 记录无 CSV 内容请求。

回滚：

- 代码回滚点是发布前已验证 commit。
- 发布故障时，从该 commit 重新执行相同冻结构建并部署；不对未知工作树做 force/reset。
- HG-04 前完成本地回滚演练：从后续受控变更恢复到已知良好 tree，重新 build/test，并证明产物 hash/行为回到基线。
- 公开环境实际回滚仅在 HG-04 明确授权的演练或真实故障时执行；若未执行真实降级，最终只能声明“回滚路径已本地验证”，不能声明“公开回滚已验证”。

## 9. 原子 Execute–Verify 计划

每个增量遵循：入口状态核对 → 单一变更 → 约定验证 → 证据 → Gate → checkpoint。Blocking 时不进入下一依赖增量。

| ID | 原子产物 | 立即验证 | 独立依据 | Blocking 条件 | Checkpoint |
| --- | --- | --- | --- | --- | --- |
| I-00 | HG-02 设计冻结 | 文档链接/范围/Gate 检查 | 用户明确批准 | 未获批准 | C1 |
| I-01 | 最小工具链、类型配置、静态空壳 | pnpm frozen install、typecheck、build、dist serve/reload | 构建目录清单与 HTTP 回读 | 安装/构建失败或引入未批准依赖 | C2 |
| I-02 | shared types + Quality Core | Core 全部单元测试、输入不变性、依赖静态检查 | 冻结 expected JSON | Oracle 差异、Core 依赖越界 | C3 |
| I-03 | CSV Adapter + fixtures | Adapter 精确对照和错误测试 | 手工 expected table/错误清单 | 解析边界无法在设计内满足 | C4 |
| I-04 | UI 输入、状态与结果呈现 | typecheck/test/build；本地浏览器成功/错误/替换流程 | Contract Oracle + UI 状态清单 | UI 复制算法、数据持久化或结果歧义 | C5 |
| I-05 | 安全与构建往返 | dist 重载、CSP、静态网络 API 扫描、浏览器 Network | 独立 HTTP/Network 观察 | CSV 内容请求或只在开发态可用 | C6 release candidate |
| I-06 | STG-06 综合验收 | 全量测试、adapter/core/browser/UAT 候选、证据完整性 | 多层 Oracle + 人工 UAT | 任一适用 AC 失败 | HG-03 candidate |
| I-07 | 本地回滚演练与发布准备 | 恢复已知 commit 后 build/test/hash/行为复核 | Git tree + 构建证据 | 无安全回滚点 | pre-release protection |
| I-08 | 经 HG-04 的 Pages 发布 | 远端 workflow、HTTPS、commit、smoke、Network | 外部回读 | 授权/身份/部署不一致 | release checkpoint |
| I-09 | Handoff / Feedback | 文件、证据、clean status、最终提交检查 | 人工可复核入口 | 证据或限制缺失 | final |

## 10. Git checkpoint 与恢复计划

| ID | 时点 | 内容 | 恢复用途 |
| --- | --- | --- | --- |
| C0 | HG-01 | `70fb532bd31b9ffcf0794eafd41b583621ab4ed4` | 原始请求、画像、Contract 与预检基线 |
| C1 | HG-02 后 | 经批准的 TECH_DESIGN 与计划 | 实现前设计恢复点 |
| C2 | I-01 通过 | 可构建静态空壳和锁文件 | 工具链基线 |
| C3 | I-02 通过 | Core 与独立测试 | 规则内核基线 |
| C4 | I-03 通过 | Adapter 与对照测试 | 输入边界基线 |
| C5 | I-04 通过 | 本地 UI 集成 | 用户流程基线 |
| C6 | I-05/06 通过 | release candidate 与综合证据 | 发布前保护点 |
| C7 | STG-07/09 | 发布与最终交付记录 | 最终恢复/复核点 |

恢复优先使用新 commit 或 `git revert`，不使用破坏性 `reset --hard`。高风险动作前先验证 `git status`、HEAD、目标远端/分支和现有 checkpoint。

## 11. 证据与记录映射

| 事实 | 权威记录/证据 |
| --- | --- |
| 画像、角色、裁剪、HYP 观察 | `PROJECT.md` |
| 冻结产品边界与 Oracle | `REQUIREMENTS.md@70fb532...` |
| 架构、接口、测试、部署和计划 | `TECH_DESIGN.md` |
| 阶段状态、命令摘要、Gate、异常 | `VALIDATION.md` |
| 重大取舍/偏差 | `RECORDS.md` |
| 机器输出与截图索引 | `evidence/<stage>/**`；不保存真实 CSV |
| 最终入口/回滚/限制 | `HANDOFF.md` |
| Rule 与 HYP conformity/utility | `PLAYBOOK_FEEDBACK.md` |

## 12. 操作用途分类

| 类别 | 本项目操作 |
| --- | --- |
| 固定生产必需 | 用户打开 HTTPS 页面、选择一个 CSV、浏览报告。 |
| 条件式生产 | 文件过大/解析错误时更换文件；发布维护者在故障时按 checkpoint 重新部署。 |
| 诊断 | Git 状态、局部测试、服务器日志、源码搜索。 |
| 验证专用 | fixed fixtures、expected JSON、全量测试、构建产物本地服务器、Network 记录、回滚演练、hash/diff。 |

## 13. HG-02 退出条件

用户需确认：

1. 采用无 UI 框架、仅 TypeScript 开发依赖的路线；
2. 自有受限 CSV Adapter 及明确的支持/拒绝边界；
3. Core/Adapter/UI 类型和依赖方向；
4. 5 MiB 保护阈值、UI 流程与隐私控制；
5. fixture、独立 Oracle、测试层次和浏览器证据；
6. GitHub Pages Actions 方案及 HG-04 外部写入边界；
7. I-00～I-09 原子计划和 C0～C7 checkpoint。

未经明确 HG-02 批准，不创建 `src/**`、package manifest、fixture、测试、构建/部署脚本或业务代码。
