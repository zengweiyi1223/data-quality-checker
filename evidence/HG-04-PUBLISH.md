# HG-04 — Publish authorization

- 日期：2026-09-28（America/Los_Angeles）
- 状态：`Approved；release execution pending`
- Approver：当前用户

## 已确认范围

| 项目 | 批准值 |
| --- | --- |
| 远端仓库 | 创建 `zengweiyi1223/data-quality-checker` |
| 可见性 | Public |
| push 目标 | `origin/main` |
| 预期公开 URL | `https://zengweiyi1223.github.io/data-quality-checker/`；以 Pages deployment 实际返回为准 |
| 部署动作 | 创建仓库、绑定 remote、push 经验证 release commit、启用 GitHub Actions Pages、手动部署该 SHA、公开 smoke 验证 |
| 残余风险 | 用户明确接受：GitHub/Actions/Pages 可用性；公开源码与合成 fixture；首次远端 workflow；公开回滚尚未实际演练 |

用户先批准 HG-04 和残余风险，再确认上述精确目标，并明确允许刷新 `workflow` 权限。GitHub 设备授权由用户本人完成；CLI 回读 scope 为 `gist, read:org, repo, workflow`。

本授权不覆盖其他仓库、其他分支、付费服务、npm 发布、生产 SLA、force-push 或未另行明确批准的公开降级演练。
