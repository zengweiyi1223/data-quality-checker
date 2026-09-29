# I-08 — GitHub Pages public release

- 日期：2026-09-28（America/Los_Angeles）
- 状态：`Passed`
- Human Gate：HG-04 Approved
- 仓库：https://github.com/zengweiyi1223/data-quality-checker
- 公开 URL：https://zengweiyi1223.github.io/data-quality-checker/
- 发布提交：`a475db50b18e7a430d04e4dbede72679a8c97adb`

## 1. 远端与发布身份

- 仓库由获批账号 `zengweiyi1223` 创建，GitHub API 回读 `visibility=PUBLIC`、默认分支 `main`。
- `origin` 为 `https://github.com/zengweiyi1223/data-quality-checker.git`。
- push 后 `refs/heads/main` 与本地 release commit 均为 `a475db50b18e7a430d04e4dbede72679a8c97adb`。
- Pages API 回读：`build_type=workflow`、`public=true`、`https_enforced=true`，实际 `html_url` 与上列公开 URL 一致。

## 2. Workflow 与 deployment

| 对象 | 结果 |
| --- | --- |
| Workflow run | [36514834087](https://github.com/zengweiyi1223/data-quality-checker/actions/runs/36514834087) |
| Run event / head | `workflow_dispatch` / `a475db50b18e7a430d04e4dbede72679a8c97adb` |
| Build job | `109234709434`，Success，21 s |
| Deploy job | `109234796025`，Success，8 s |
| Pages deployment | `6725568629`，environment `github-pages`，SHA 与 release commit 一致 |

Build job 实际执行 checkout、pnpm/Node 安装、typecheck、23 项测试、构建、Pages 配置和 artifact 上传；deploy job 成功发布。唯一 annotation 是 `ubuntu-latest` 将从 2026-10-19 起迁移到 Ubuntu 26 的平台通知，不影响本次通过结果，作为 runner 漂移残余风险保留。

## 3. 公开 HTTPS 浏览器验证

从 release commit 建立隔离 detached worktree，用系统已安装 Microsoft Edge + CDP 直接访问公开 URL：

- 初始状态：`Ready`，报告隐藏。
- 固定 fixture：`Check complete`；总行数 5、问题数 4、受影响行 3。
- missing：data row/source line/column 分别为 `2/3/name`、`3/4/name`、`4/5/email`。
- duplicate group：data rows `2, 3`，source lines `3, 4`。
- 5 MiB 护栏、未闭合引号错误、重新选择正确 fixture、刷新回到 `Ready` 均通过。
- browser errors：0。

Network 监听在导航前启用。页面仅对同一公开站点发出 GET，请求目标为 HTML、CSS、favicon 和本地模块；全部 `hasPostData=false`。从设置 CSV file input 到报告完成期间新增请求数为 **0**，捕获内容不含 fixture 标记值。该证据只证明本应用和本次 Edge 观察范围，不声称浏览器、操作系统或 GitHub 自身没有平台级遥测。

## 4. 发布产物对照

通过 HTTPS 分别回读 `dist` 的 7 个文件，所有响应均为 HTTP 200；相对路径与 SHA-256 对本地批准产物 **7/7 完全一致**：

| 文件 | SHA-256 |
| --- | --- |
| `assets/adapters/csv.js` | `34F1CE39CBF3AC70C9229DBF0BAE57B4E7BA13919EC9AA51DC855196CF6D3BAE` |
| `assets/core/quality.js` | `4DF7D898324E105D6A4C97D519C89408A74B53C6A3768F42763695BDF9A9FD7E` |
| `assets/shared/types.js` | `8E609BB71C20B858C77F0E9F90BB1319DB8477B13F9F965F1A1E18524BF50881` |
| `assets/ui/app.js` | `88268F3E029739791F11E9E0FA6DC23E40E302D6DBA63E933B9A64B1C196DDF0` |
| `favicon.svg` | `D32D98066FA2DF5F2D14FDB301F8DD1EA6D152A8ECF85FBF728AEC50C8AB2F0B` |
| `index.html` | `7972EF79E53797346C18E23AF45938FDE27513B0F44FCBCF0DA7F50A57F7DDDB` |
| `styles.css` | `EF63198528756115D28FAAECD56F11E245FD615EFAB7E9C29A797EFD43AE1C04` |

## 5. MD-OPS 与回滚边界

- 最小可用性：公开 HTTPS、实际浏览器核心流程、错误恢复、刷新和静态文件完整性通过。
- 回滚机制：手动 workflow 的 `ref` 可指定上一已验证完整 SHA；发布前已从 `c8017b9` 完成本地隔离恢复、23/23 测试和 7/7 hash 复验。
- 未执行公开降级再恢复：HG-04 明确接受该残余风险，且授权范围排除了未另行批准的公开降级演练。因此只能声称“本地回滚路径已验证，公开回滚机制已配置”，不能声称“公开环境回滚已实测”。
- 未建立监控、告警、值守或 SLA。
