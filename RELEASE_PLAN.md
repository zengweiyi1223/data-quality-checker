# data-quality-checker — Release Plan

- 状态：`Completed — public release verified`
- 发布目标：GitHub Pages 静态站点
- 外部写入边界：HG-04 前不得创建远端、push、启用 Pages 或触发部署。

## 1. 发布候选

- 来源：仅从经验证且提交到 `main` 的 Git 对象发布。
- 构建：pnpm `11.19.0`、Node.js `24.19.0`、冻结 lockfile、typecheck、23 项测试和静态构建。
- 工作流：`.github/workflows/pages.yml`，仅 `workflow_dispatch`，必须显式指定待发布 `ref`。
- 产物：`dist/**`；不包含 CSV 用户数据、密钥、运行时服务或上传端点。
- 依赖控制：所有 Actions 锁定到官方发布对应的不可变 commit；版本与来源见工作流注释及 `evidence/I-07-RELEASE-PREP.md`。

## 2. HG-04 必须逐项确认

用户已在 HG-04 明确确认：

| 项目 | 待确认值 |
| --- | --- |
| 创建或使用的远端仓库 | 创建 `zengweiyi1223/data-quality-checker` |
| 仓库可见性 | Public |
| push 目标 | `origin/main` |
| 公开 URL | `https://zengweiyi1223.github.io/data-quality-checker/`（Pages API 与实际 HTTPS 回读确认） |
| 部署动作 | push 已批准 release commit；启用 Pages 的 GitHub Actions source；手动运行工作流并指定该 commit SHA |
| 残余风险接受 | GitHub/Actions/Pages 可用性；公开源码与合成 fixture；runner 漂移；真实公开回滚尚未执行 |

HG-04 授权只覆盖表中明确的仓库、可见性、push 目标和本次部署。不得将其扩展为其他仓库、付费服务、npm 发布或生产 SLA。授权证据见 `evidence/HG-04-PUBLISH.md`。

## 3. HG-04 后的原子发布步骤

1. 回读用户确认项，检查本地工作区 clean、来源仓库 clean、release commit 与 checkpoint。
2. 创建或绑定唯一获批远端；回读远端 URL 和默认分支。
3. push 到获批目标；核对远端 commit 与本地 release commit 一致。
4. 将 Pages source 配置为 GitHub Actions；手动运行 `Deploy GitHub Pages`，`ref` 使用完整 release commit SHA。
5. 等待 build/deploy jobs；保存 run URL、deployment id、artifact 与 `page_url`。
6. 通过公开 HTTPS 地址执行初始页、固定 fixture、错误恢复、刷新和 Network smoke；不上传用户 CSV。
7. 更新 `VALIDATION.md`；仅在公开验证通过后将 STG-07 标为 Passed，并触发最小 STG-08。

任何权限、身份、提交或部署不一致均为 Blocking Failure，停止依赖步骤。

## 4. 回滚方法

- 首选：重新手动运行同一工作流，把 `ref` 指向上一已验证的完整 commit SHA；该工作流会从该 Git 对象重新安装、测试、构建并部署。
- 若失败版本也需要从 `main` 撤销：使用非破坏性的 `git revert`，验证后 push 新提交，再部署该新 SHA；禁止用 force-push 或 `reset --hard` 作为常规回滚。
- 回滚成功条件：workflow 完成；公开 URL 对应目标 SHA 的构建；固定 fixture smoke 通过；网络仍无 CSV 内容上传。
- 当前结论限制：已完成本地 checkpoint 恢复演练并配置按 SHA 重部署；未执行公开降级，不能声称公开环境回滚已实测。

## 5. 公开后的最小观察

`MD-OPS` 已完成一次最小可用性验证：公开 HTTPS、release SHA、浏览器 smoke、Network 和 7/7 artifact hash 见 `evidence/I-08-PUBLIC-RELEASE.md`。本地回滚已验证，公开降级未执行；未建立监控、值守、告警或 SLA。
