# I-03 — CSV Adapter evidence

- 日期：2026-09-27（America/Los_Angeles）
- 入口 checkpoint：C3 `12d0e381a8fed4aa2eda1284389b75b768427b76`
- 偏差：DEV-001；CRLF 输入和 expected 使用 JSON 转义载体以避免 Git 行尾改写。

## 变更

- `parseCsv(text)`：UTF-8 BOM、comma、LF/CRLF、quoted fields、escaped quotes、quoted field 内换行。
- 稳定错误：EMPTY_FILE、INVALID_HEADER、UNCLOSED_QUOTE、UNEXPECTED_QUOTE、ROW_WIDTH_MISMATCH。
- 输出只包含 NormalizedTable；不调用 Core，不构造 UI。

## 自动验证

| 检查 | 结果 |
| --- | --- |
| `pnpm run typecheck` | exit 0 |
| `pnpm test` | 18 tests、18 pass、0 fail；其中 Core 6，Adapter 12 |
| 主 fixture 标准化 | 精确比较 columns、5 行 values、rowNumber 和 sourceLine |
| CRLF 对照 | 精确比较 quoted comma、escaped quote、embedded CRLF、sourceLine |
| BOM/LF/末尾换行 | Passed |
| 空字段与空格保留 | Passed |
| header-only | Passed |
| 7 类错误/边界 | 全部返回预期稳定 code 和 sourceLine |

## 独立边界检查

- Adapter 唯一 import 是 `../shared/types.js` 的 type-only import。
- Adapter 中没有 Core、QualityReport、DOM、fetch 或 localStorage 引用。
- 扫描命中的 “duplicated” 只属于重复表头错误文本，不是完全重复行规则。

## Gate

`Passed`。AC-02、AC-07 的 Adapter 部分获得独立对照证据；UI/File API 尚未验证。允许进入 I-04。
