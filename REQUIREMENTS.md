# data-quality-checker — 需求与验收契约

- 状态：`Frozen — HG-01 approved 2026-09-27`
- Playbook：`v0.2@dff3a717d59935697e310a29caf6b29dff11ff11`
- 生命周期设计：`2319a6904cd1dba0b696e59b9376889a3179b068`
- 需求基线提交：`70fb532bd31b9ffcf0794eafd41b583621ab4ed4`

## 1. 核心问题

- 要证明或否定：一个小型非 Power BI 交互应用能否在固定 v0.2 Evidence Gate Kernel 和候选生命周期下，以明确的人机责任、可裁剪阶段和不过量的记录，交付一个可独立验证、可回滚、仅在浏览器本地处理 CSV 的数据质量检查器。
- 产品价值：让用户在不上传 CSV 内容的前提下，快速定位空单元格和完全重复行。
- 目标用户与场景：需要对中小型 CSV 做一次性基础检查、且不希望把文件内容交给服务端的个人用户；用户打开静态网页、选择一个本地 CSV、查看摘要和定位信息。
- 本轮不证明：类型/日期/业务语义正确性、数据清洗能力、所有 CSV 方言兼容性、大文件性能、恶意文件隔离、生产 SLA、多人/账号/云存储、生命周期 v1.0 已成立。
- 负面结果仍可构成完整实验：是。若产品功能未通过但停止、证据、归因和反馈完整，仍可形成方法实验结论；不得把功能失败写成 Playbook 成功，也不得反向推导整个方法无效。

## 2. 输入、输出与范围

| 项目 | 冻结内容 |
| --- | --- |
| 输入及来源 | 用户交互选择的单个 CSV 文件；验收使用仓库内合成 fixture。CSV 首行是唯一表头行，后续记录均为数据行。 |
| Trusted baseline | 已记录为空目录的目标路径、固定的两项方法提交、HG-01 后的需求冻结提交。 |
| 必须交付 | CSV 导入；浏览器本地解析；空值与完全重复行检查；总行数、问题数、问题位置；结构化 `QualityReport`；固定 fixture 自动测试；静态构建；经 HG-03/HG-04 后的公开 HTTPS；验证、回滚、HANDOFF、Playbook Feedback。 |
| 允许修改 | 本独立仓库内的项目文档、源代码、测试、fixture、构建配置、证据与 Git 历史。 |
| 禁止修改 | `power-bi-builder` 仓库、其 `playbook/**`、固定提交、用户真实 CSV、AIWorkspace 根目录 Git 状态。 |
| 主执行路线 | 浏览器 File API → CSV Adapter → Normalized Table → Quality Core → QualityReport → Static Web UI；静态构建；经授权后 GitHub Pages。 |
| 需批准的路线 | 任何远端创建、push、公开部署；任何后端、外部 API、分析脚本、付费服务、替代托管平台或范围扩张。 |

### 必须完成

1. 导入一个 CSV 文件。
2. 文件内容在浏览器本地解析和检查，应用代码不上传内容。
3. 检查空值和完全重复行。
4. 显示总行数、问题数和问题位置。
5. 返回结构化 `QualityReport`。
6. 用固定 fixture 和精确预期结果自动测试。
7. 构建可重新加载的静态站点。
8. 用户完成 UAT 且明确批准发布细节后，以公开 HTTPS 地址分享。
9. 完成验证、回滚、HANDOFF、Playbook Feedback 和最终提交。

### 明确不做

- 类型、日期或业务口径推断；自定义规则编辑器；数据编辑、清洗或自动修复。
- Excel、数据库和 API 输入；登录、权限、云端保存和多人协作；生成式 AI 功能。
- 超大文件、流式处理和性能承诺；付费服务、正式 npm 发布和生产 SLA。
- 自定义域名、外部统计/分析、服务端上传、指定人员访问控制。

### 语义边界

- `rowNumber` 为从 1 开始的数据行序号，不包含表头；若展示源文件行号，应另用 `sourceLine`，不能混用。
- 空值定义为 CSV Adapter 解析后的精确空字符串 `""`；只含空格的值本轮不视为空，不做 trim、类型转换或大小写归一化。
- 完全重复行定义为同一标准化表内、所有列字符串值逐项严格相等的两行或多行；每个重复组计一个问题，并列出该组所有数据行序号。
- `issueCount = missing-cell findings + duplicate-group findings`；`affectedRowCount` 是去重后的受影响数据行数，不与问题数混用。
- 合法 CSV 的确切方言、错误状态和行宽处理在 HG-01 后的技术设计中冻结；不得改变上述检查语义。

## 3. 固定 Oracle 与精确预期

实现前冻结的合成 fixture：

```csv
id,name,email
1,Alice,alice@example.test
2,,bob@example.test
2,,bob@example.test
3,Carol,
4,Dan,dan@example.test
```

人工独立 Oracle：

| 断言 | 精确预期 |
| --- | --- |
| headers | `["id", "name", "email"]` |
| totalRows | `5` |
| missing findings | `(row 2, column name)`、`(row 3, column name)`、`(row 4, column email)`，共 `3` |
| exact duplicate groups | 行 `[2, 3]` 为一组，共 `1` |
| issueCount | `4` |
| affectedRows | `[2, 3, 4]` |
| affectedRowCount | `3` |

该表由人在实现前审核并通过 HG-01 冻结。实现测试将消费独立保存的 expected result，而不是由生产 Core 生成预期值。适配器对照测试另使用包含引号、逗号与 CRLF 的小型 fixture，其逐单元格预期在 STG-03/04 冻结。

## 4. 验收条款

| ID | 验收条款 | 独立依据 | Gate |
| --- | --- | --- | --- |
| AC-01 | 用户可选择一个 CSV；未选择、取消或解析失败有清晰且非破坏性的状态。 | 浏览器人工操作 + 预先定义状态清单 | STG-06 / HG-03 |
| AC-02 | 固定 fixture 经 Adapter 得到冻结的 headers、5 行和逐单元格值。 | 手工 expected table / adapter 对照测试，不调用 Core | STG-05/06 |
| AC-03 | Core 不经 UI/Adapter直接处理标准化表，产生 3 个 missing findings、1 个 duplicate group、issueCount 4、affectedRows `[2,3,4]`。 | HG-01 冻结 Oracle + 单元测试 | STG-05/06 |
| AC-04 | UI 显示总行数 5、问题数 4，并能定位每个 missing cell 与重复组的行号。 | Oracle 对照 + 浏览器实际操作 | STG-06 / HG-03 |
| AC-05 | `QualityReport` 是明确、可序列化的结构化对象，至少区分摘要、空值 findings、重复组和位置。 | 类型/Schema 静态检查 + 精确对象断言 | STG-05/06 |
| AC-06 | Core 源码不依赖 DOM、UI 状态、托管平台或网络；单元测试可直接导入 Core。 | 依赖检查 + 单元测试入口 | STG-05/06 |
| AC-07 | CSV 解析只在 Adapter；UI 仅负责输入、调用和展示。 | 模块依赖审查 + 集成测试 | STG-05/06 |
| AC-08 | 静态生产构建成功，并从构建产物重新启动/重新加载后完成固定 fixture 流程。 | 构建命令 + 独立静态服务器回读 + 浏览器观察 | STG-06 |
| AC-09 | 选择并检查 CSV 时，浏览器网络记录中没有 CSV 内容或基于内容的应用请求；应用不含分析/上传代码。 | 浏览器 Network 证据 + 构建产物静态检查；仅证明本应用观察范围 | STG-06 / HG-03 |
| AC-10 | HG-04 后的公开 URL 使用 HTTPS，内容对应批准提交，可完成 smoke check。 | 外部 URL 回读 + 提交/部署记录 | STG-07 |
| AC-11 | 可按记录方法回到上一个已知良好部署或明确恢复当前版本。 | Git checkpoint + GitHub Pages 回滚演练/验证 | STG-07/08 |
| AC-12 | HANDOFF、VALIDATION、PLAYBOOK_FEEDBACK、Decision/Deviation、证据地图、限制和最终提交号可定位。 | 文件/链接检查 + Git clean 状态 | STG-09 |

关键结论不会仅由生成链路自证：功能以预先冻结 Oracle、绕过 UI 的 Core 测试、独立 Adapter 对照、真实浏览器行为、构建产物回读和人工 UAT组合证明。

## 5. 责任与 Human Gate

| ID | 责任人 | 用途 | 动作/判断 | 继续条件 | 证据 |
| --- | --- | --- | --- | --- | --- |
| HG-01 | 当前用户 | Contract | 审核画像、目标、语义、Oracle、验收、安全、停止与结论分级。 | 明确回复批准，或提出修改后再次明确批准。 | 对话确认 + 冻结提交号 |
| HG-02 | 当前用户 | Design / Plan | 审核 UI 流程、Core/Adapter API、技术路线、测试、部署和原子计划。 | 明确批准后才能写业务代码。 | 对话确认 + 设计冻结提交号 |
| HG-03 | 当前用户 | UAT | 实际导入 fixture，核对结果理解、隐私说明、错误状态和使用体验。 | 明确 UAT 通过；否则修复后重验。 | 人工验收记录/必要截图 |
| HG-04 | 当前用户 | Publish | 明确远端仓库、可见性、push 目标、公开 URL、部署动作和残余风险。 | 明确逐项授权；未授权不得创建远端、push 或部署。 | 对话确认 + 发布记录 |

AI 不得根据沉默、推测或先前的一般授权越过 Gate。

## 6. 安全与权限

- 数据分类：仓库中的 fixture 是合成公开数据；实际用户 CSV 可能是内部、敏感或受限数据，因此按“不离开浏览器内存、不进入仓库/日志/证据”的最严格产品边界处理。
- 密钥、凭据、PII、本机信息：不写入源码、fixture、截图或公开证据；证据使用合成值并在提交前检查路径/账号泄露。
- 外部权限：HG-04 前无远端写入。允许在已批准设计内下载开发依赖，但不得把用户数据发送给依赖服务；依赖选择与锁定在 HG-02 前明确。
- 网络边界：成品不得包含后端、上传请求、遥测、广告或外部分析。公开站点加载自身静态资源不等于上传 CSV；网络证据需区分资源 GET 与内容外传。
- 破坏性/不可逆操作：删除、覆盖、创建远端、push、改可见性、公开发布必须有明确范围与 Gate；本地可逆文件修改由 Git checkpoint 保护。
- 证据脱敏：不提交真实 CSV、浏览器个人信息、token、账号、完整本机目录或无关网络流量。
- 声明限制：网络观察只能证明测试场景和应用请求中未见内容上传，不能证明浏览器、扩展、操作系统或供应链绝对无外传。

## 7. 停止、恢复与异常

出现以下任一条件即 `Blocking`，停止依赖步骤：

1. 需要后端、账号、数据库、付费服务或范围外外部系统才能满足核心验收。
2. CSV 边界迫使项目进入编码检测、日期/类型、超大文件或流式处理专项工程。
3. 无法保持 Core 与 UI/Adapter 解耦。
4. 无法冻结 fixture/Oracle，或关键结论只能由生成链路自证。
5. 发布要求超出权限、安全、隐私或 HG-04 边界。
6. 出现未解释的工作区修改、来源仓库修改、丢失回滚点或不可脱敏证据。
7. 新功能主要为展示完整度而非满足本 Contract 或方法验证。

异常同时记录类型与严重度。Contract 允许、状态可信且不覆盖失败证据时可在原 Run 重试；有明确 checkpoint 时可回滚并重新验证；状态不可信、路线改变或需复杂替代方案时建立新 Run。治理/权限阻塞不伪装成技术失败。

## 8. 结论分级

| 维度 | 分级 |
| --- | --- |
| 功能结果 | `Passed`：AC-01～12 中当前阶段所有适用项通过；`Passed with Limitations`：核心功能通过且限制不影响 Gate；`Expected Negative Result`：方法实验完整但产品假设被否定；`Failed/Blocked`：核心条款未满足或 Gate 无授权。 |
| Contract 符合度 | `Conformant` / `Conformant with approved deviations` / `Non-conformant`，与功能结果分开。 |
| 证据完整度 | `Complete for claims` / `Partial` / `Insufficient`；证据不足时只能报告观察，不得声称相应结论已证明。 |
| 运行/持久化 | `Source verified` / `Build verified` / `Published verified` / `Rollback verified`，不得用较低层级替代较高层级。 |
| 方法结论 | HYP-01～07 与 v0.2 Rules 分别报告 conformity、utility 和 Keep/Change/Retire/Move/Defer；不从单次项目宣称跨领域普遍有效。 |

## 9. 计时口径

本项目**不声明**减少 Human active、等待或机器耗时，因此 `R-EXV-003` 的强制效率计时为不适用。为分析 Gate 摩擦，仍记录：

- `Gate wait`：从向用户发出明确 Gate 请求的时间，到收到明确批准/修改回复的时间；跨会话时间只作墙钟观察。
- `Human active`：只有用户主动提供时记录；不从等待时长推算。
- `Machine time`：测试、构建、部署命令可观察的进程运行时间；不把 AI 推理或网络等待混入。
- `AI/project active`：不与人工效率比较；仅可记录阶段起止时间用于恢复。

这些数据不支持生产率或“最少人力”声明。

## 10. Git、证据与往返

- 正式证据：`evidence/**`、`VALIDATION.md` 中的可定位摘要、人工 Gate 确认、Git 提交与后续公开 URL 回读。
- 临时文件：依赖缓存、构建缓存、本地服务器日志和浏览器临时文件；可重建且不作为唯一证据。
- checkpoint：原始请求/预检；HG-01 Contract freeze；HG-02 Design freeze；每个关键 STG-05 已验证增量；STG-06 UAT candidate；发布前保护点；最终验收。
- 高风险往返：首次生产构建重载、首次公开发布、首次部署回滚必须完整验证。相同提交的重复静态重载可在已有稳定证据、无 diff/异常时抽样，并记录残余风险。
- 不提交用户 CSV、凭据或大体积浏览器档案；必要截图先脱敏，机器日志保存纯文本并注明命令/提交/时间。

## 11. Playbook 规则处理

| Rule ID | 等级 | 处理方式 | 说明 |
| --- | --- | --- | --- |
| R-VLD-003 | Provisional | 应用 | 生产构建、发布和回滚存在状态转换；按风险执行完整往返，低风险重复项才可有记录地抽样。 |
| R-EXV-003 | Provisional | 不适用效率声明；轻量观察 | 不作效率结论，仅记录 Gate wait 和可观察 machine time。 |
| R-VDC-002 | Provisional | 应用 | 最终明确区分固定生产必需、条件式生产、诊断和验证专用操作。 |

## 12. 冻结与变更

HG-01 已于 2026-09-27 获当前用户明确批准，本文件状态为 `Frozen`。之后影响范围、路线、语义、验收、安全或成功口径的变化必须记录 `DCS-nnn` 并形成独立提交；实际偏离使用 `DEV-nnn`，不得静默改写 Contract 以适配结果。
