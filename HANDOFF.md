# data-quality-checker — 交接

日期：`2026-09-28` · Run：`001` · Playbook：`v0.2@dff3a717d59935697e310a29caf6b29dff11ff11`

## 1. 结论

- 功能结果：浏览器本地 CSV 解析、空值与完全重复行检查、结构化 `QualityReport`、静态构建和 GitHub Pages 公开发布均通过。
- Contract 符合度：AC-01～AC-10 通过；AC-11 的本地 checkpoint 恢复与回滚机制通过，公开降级未执行并明确保留；AC-12 随本交接、反馈和最终提交完成。
- 证据完整度：Core、Adapter、architecture/security、真实 Edge、人工 UAT、构建 hash、公开 workflow/deployment、HTTPS 回读与 Network 证据可定位。
- 运行/持久化状态：Public Pages 正在提供 release `a475db50b18e7a430d04e4dbede72679a8c97adb` 的 7 个静态文件；应用不保存 CSV 或报告。
- 一句话结论：固定边界内的非 Power BI 生命周期实验成功交付，Required Rules conformant，且 Release/rollback Gate 发现了实际可复现性缺口。

明确不能声称：支持范围外 CSV 方言、类型/日期/业务推断、编辑或修复、Excel/数据库/API、登录/云保存/协作、AI、超大文件/流式性能、生产 SLA；也不能声称浏览器/OS/GitHub 无平台遥测，或公开环境降级回滚已经实测。

## 2. 交付物与入口

| 路径/入口 | 用途 | 完整性或状态 |
| --- | --- | --- |
| https://zengweiyi1223.github.io/data-quality-checker/ | 公开静态应用 | HTTPS；7/7 文件 hash 与 release build 一致 |
| https://github.com/zengweiyi1223/data-quality-checker | Public 源码仓库 | `main`；最终关闭提交以 remote main 为准 |
| `REQUIREMENTS.md` | 冻结 Contract / Oracle / Gate | HG-01，`70fb532` |
| `TECH_DESIGN.md` | 架构、测试、发布和原子计划 | HG-02，`1c54648` |
| `VALIDATION.md` | 阶段状态、验收与证据地图 | 最终滚动记录 |
| `RECORDS.md` | Decision / Deviation | DCS-001～004，DEV-001～002 |
| `PLAYBOOK_FEEDBACK.md` | Rule conformity、utility、HYP-01～07 | 最终方法反馈 |

## 3. 复核方法

1. 从 `README.md`、`PROJECT.md`、`VALIDATION.md` 确认基线、状态和证据入口。
2. 执行 `pnpm install --frozen-lockfile`、`pnpm run typecheck`、`pnpm test`；应为 23/23。
3. 执行两次 `pnpm run build` 并比较 `dist/**` SHA-256；应为 7/7 一致。
4. 用 `fixtures/quality-oracle.csv` 对照 `fixtures/quality-oracle.expected.json`，核对 5/4/3 和位置。
5. 在公开 URL 重做选择、错误恢复、再次选择、刷新，并确认文件操作期间没有应用网络请求。
6. 核对 GitHub run `36514834087`、deployment `6725568629` 与 release SHA。

## 4. 实际工作流

- 最小生产流程：访问公开 URL → 选择不超过 5 MiB 的 UTF-8 CSV → 浏览本地计算报告。
- 条件式生产操作：发布或恢复时，人工派发 Pages workflow，并传入经验证完整 SHA。
- 诊断操作：Git/Pages API 回读、浏览器 console、CDP request 列表、静态符号扫描。
- 验证专用操作：fixed fixtures、independent expected JSON、Core/Adapter/architecture 测试、双构建 hash、隔离 worktree、Edge/CDP。

## 5. 证据与回滚点

| 结论/阶段 | 证据 | Git checkpoint |
| --- | --- | --- |
| Contract | `REQUIREMENTS.md` | `70fb532` |
| Design / Plan | `TECH_DESIGN.md`、`evidence/STG-04-PREFLIGHT.md` | `1c54648` |
| Core / Adapter / UI | `evidence/I-02-CORE.md`～`I-04-BROWSER.md` | `12d0e38`、`86e59fd`、`8b77715` |
| Integrated acceptance / UAT | `evidence/I-06-INTEGRATED.md`、`evidence/HG-03-UAT.md` | `c734f6c`、`e58221b` |
| Local release protection | `evidence/I-07-RELEASE-PREP.md` | `c8017b9`、`e4ec585` |
| HG-04 / public release | `evidence/HG-04-PUBLISH.md`、`evidence/I-08-PUBLIC-RELEASE.md` | release `a475db5` |

回滚首选：手动运行 `Deploy GitHub Pages`，将 `ref` 指向上一已验证完整 SHA；workflow 会先 frozen install、typecheck、test、build，再发布。若需从 `main` 撤销问题提交，使用 `git revert` 后重新验证和部署；不使用 force-push 或 `reset --hard`。

## 6. 决策、偏差与限制

- Decision：DCS-001 固定用户指定设计基线；DCS-002 PF-APP + MD-DATA；DCS-003 零运行时依赖；DCS-004 5 MiB 与最小隐私控制。
- Deviation：DEV-001 用 JSON 稳定承载 CRLF fixture；DEV-002 首次回滚 hash 暴露 SVG 行尾未固定，阻断后修复。
- 环境依赖：现代浏览器 File API / ES modules；GitHub Pages / Actions；构建使用 pnpm 11.19.0、Node 24.19.0。
- 已知限制：仅冻结 CSV 子集；同步解析；英语 UI；无可访问性专项审计或多浏览器矩阵。
- 残余风险：GitHub 服务与 `ubuntu-latest` runner 漂移；公开回滚未实测；GitHub Pages 会按其平台政策处理访客网络元数据。

## 7. Playbook 反馈入口

- [VALIDATION](VALIDATION.md)
- [RECORDS](RECORDS.md)
- [PLAYBOOK_FEEDBACK](PLAYBOOK_FEEDBACK.md)
- Playbook 基线：`dff3a717d59935697e310a29caf6b29dff11ff11`
- 需求冻结：`70fb532bd31b9ffcf0794eafd41b583621ab4ed4`
- 公开 release：`a475db50b18e7a430d04e4dbede72679a8c97adb`
- 最终关闭提交：本文件所在 remote `main` 的最终 SHA；权威值随最终消息和 Maintainer 回传提供。

后续方向只表示建议，不自动授权执行。
