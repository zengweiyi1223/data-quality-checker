# data-quality-checker — HG-03 UAT

- 状态：`Ready for Human UAT`
- 候选版本：C6 `c734f6c4089d78ec57b16a8c8c88b3ace7c36718`
- 本地入口：`http://127.0.0.1:4173/`
- 固定样本：`E:\AIWorkspace\01_Projects\data-quality-checker\fixtures\quality-oracle.csv`
- 错误样本：`E:\AIWorkspace\01_Projects\data-quality-checker\fixtures\invalid-unclosed.csv`

## 操作与预期

1. 打开本地入口。确认页面明确说明文件在当前浏览器标签内读取，无上传 endpoint、analytics 或 cloud storage。
2. 点击 **Select CSV**，选择固定样本。
3. 确认状态为 **Check complete**，摘要精确显示：
   - Total rows：5
   - Issues：4
   - Affected rows：3
4. 确认 Empty cells 表中有：
   - data row 2 / source line 3 / name
   - data row 3 / source line 4 / name
   - data row 4 / source line 5 / email
5. 确认 Exact duplicate rows 中有 data rows 2, 3 / source lines 3, 4。
6. 选择错误样本，确认出现 “A quoted field is not closed. Check source line 2.”，旧报告不再显示。
7. 再次选择固定样本，确认可恢复到正确报告。
8. 刷新页面，确认回到 Ready 且不保留先前文件或报告。

## 人工判断

请同时判断：

- “问题数”和“受影响行数”是否容易区分；
- 数据行与源文件行的位置表达是否能理解；
- 隐私说明是否清楚且没有过度承诺；
- 文件选择、错误恢复和结果阅读是否足以完成本轮任务；
- 是否存在阻止发布的布局、可读性或信任问题。

## Gate 回复

若全部接受，请明确回复：`批准 HG-03`。

若不接受，请指出步骤、实际结果和预期；项目将停在 STG-06，修复并重新验证，不进入发布准备。
