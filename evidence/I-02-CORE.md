# I-02 — Quality Core evidence

- 日期：2026-09-27（America/Los_Angeles）
- 入口 checkpoint：C2 `4b8de336d46ea39953e1cf56cda32e26e9a23bc7`
- 关键 Oracle：`fixtures/quality-oracle.expected.json`，内容源自 HG-01 前冻结并经用户批准的手工预期。

## 变更

- `src/shared/types.ts`：NormalizedTable、QualityReport 与 findings 的明确只读类型。
- `src/core/quality.ts`：输入结构验证、精确空字符串检查、完全重复分组和稳定摘要。
- `tests/core.test.mjs`：直接 import 编译后的 Core，不经过 UI、File 或 CSV Adapter。

## 自动验证

| 检查 | 结果 |
| --- | --- |
| `pnpm run typecheck` | exit 0 |
| `pnpm test`（含 pretest build） | 6 tests、6 pass、0 fail |
| 冻结 Oracle 完整对象比较 | Passed：5 rows、3 missing、1 duplicate group、issueCount 4、affectedRows [2,3,4] |
| 空值语义 | Passed：空格不是空值，精确空字符串是空值 |
| 重复组稳定顺序 | Passed |
| header-only 表 | Passed |
| 输入不变性 | Passed：调用前后 deep equality |
| 非法标准表 | Passed：拒绝列宽错误，不静默修复 |

## 独立边界检查

- Core 唯一 import 是 `../shared/types.js` 的 type-only import。
- 对 `document|window|fetch|XMLHttpRequest|WebSocket|sendBeacon|localStorage|indexedDB|File` 的源码扫描无命中。
- 预期 JSON 由测试读取；测试没有调用 Core 来生成 expected 文件。

## Gate

`Passed`。AC-03、AC-05、AC-06 的 Core 部分获得精确自动证据；UI 与 Adapter 尚未实现，不能扩张结论。允许进入 I-03。
