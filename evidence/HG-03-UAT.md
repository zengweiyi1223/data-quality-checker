# HG-03 — Human UAT evidence

- 日期：2026-09-28（America/Los_Angeles）
- 候选：C6 `c734f6c4089d78ec57b16a8c8c88b3ace7c36718`
- 状态：`Passed — HG-03 approved 2026-09-28`。

## 用户原始确认

用户报告：

> 已人工测试确认：
> 再次选择固定样本，确认可恢复到正确报告。
> 刷新页面，确认回到 Ready 且不保留先前文件或报告。

## 截图索引

| 文件 | 可观察事实 | SHA-256 |
| --- | --- | --- |
| `evidence/uat/01-refresh-ready.png` | Ready；报告不显示；隐私说明与 5 MiB 边界可见。 | `59db6dabaf2bc2bf650e7f29c2af1590c8233d42ec0465d5a3d9c63004c38f5a` |
| `evidence/uat/02-quality-report.png` | Check complete；5 rows、4 issues、3 affected rows；三处空值与重复组位置匹配 Oracle。 | `3a641894ce57e7d81e4992a26c8e8d8144f7d41f1a6e00020deeda9df5f541bb` |
| `evidence/uat/03-invalid-csv-error.png` | “A quoted field is not closed. Check source line 2.”；旧报告不显示。 | `750c29b6c2feb35505e8728cda076b63dedc00fd3afa3788835b70dc950cfa2f` |

截图仅包含本项目 UI 与合成 fixture 结果，未见账号、token、真实 CSV 或其他个人信息。

## Human Gate 判定

上述证据满足 UAT 操作事实，并实质支持成功、错误恢复与刷新清除状态。Human Approver 于 2026-09-28 明确回复“批准 HG-03”，因此当前：

- 人工观察：`Received`
- HG-03 approval：`Passed`
- 继续授权：`Yes — local release preparation only`

远端创建、push 和公开部署仍未获授权，必须等待 HG-04。
