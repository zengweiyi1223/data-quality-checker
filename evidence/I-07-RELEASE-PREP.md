# I-07 — 本地发布准备与回滚演练

- 阶段：STG-07 pre-release protection
- 状态：`In Progress`
- 边界：仅本地文件、Git 对象和验证；HG-04 前无远端、push、Pages 设置或公开部署。

## 发布工作流选择

- 触发方式：仅手动 `workflow_dispatch`；调用者显式提供 branch、tag 或完整 commit SHA。
- 依赖与运行时：pnpm `11.19.0`、Node.js `24.19.0`；冻结 lockfile；先 typecheck 和测试，再上传 `dist`。
- 最小权限：全局仅 `contents: read`；deploy job 额外授予 `pages: write` 与 `id-token: write`。
- 并发：同一 Pages group 不取消已开始的部署，避免新请求中断正在发布的已审计目标。
- 可回滚性：同一工作流可以完整 SHA 重新构建并部署上一已验证 Git 对象。

## 官方资料与不可变 Actions

2026-09-28 按 GitHub 官方 Pages 自定义工作流文档与各官方仓库发布记录复核；随后用 `git ls-remote` 直接读取官方 tag 对应对象：

| Action | Release | 固定 commit |
| --- | --- | --- |
| `actions/checkout` | v7.0.1 | `3d3c42e5aac5ba805825da76410c181273ba90b1` |
| `pnpm/setup` | v3 | `479c3cd2084b8e20207344a47dc10bdabea95adb` |
| `actions/configure-pages` | v6.0.0 | `45bfe0192ca1faeb007ade9deae92b16b8254a0d` |
| `actions/upload-pages-artifact` | v5.0.0 | `fc324d3547104276b827a68afc52ff2a11cc49c9` |
| `actions/deploy-pages` | v5.0.1 | `368f82528645a54fb793d4d04e342629a3f51346` |

固定 commit 避免 major tag 漂移；版本更新须形成受控变更并重新验证。`pnpm/setup` 是 pnpm 官方维护的单一 setup action，用一项替代分离的 pnpm 与 Node setup，符合本项目最小依赖路线。

## 本地验证

- workflow 静态审查通过：仅手动触发；5 个 Action 全部锁定完整 40 位 commit；无 push、pull request 或 schedule 触发；权限与产物路径符合设计。
- `git remote` 计数为 0，确认 HG-04 前没有绑定远端。
- 本地 frozen install、typecheck、23/23 测试通过；连续两次 clean build 的 7 个产物 SHA-256 完全一致。
- 第一次从 C6 `c734f6c` 建立隔离 worktree 时，23/23 测试通过，但 `favicon.svg` 的原始字节 hash 因 Windows checkout 行尾转换不同而不一致；Gate 按 Blocking Validation Failure 停止。
- 根因：`.gitattributes` 的 `* text=auto` 未对 SVG 明确 `eol=lf`；Git blob 相同，实际产品逻辑与其余 6 个产物相同，但不能满足跨 worktree 的原始字节复现结论。
- 修复：对 `*.svg` 和 workflow `*.yml` 明确 `text eol=lf`。先建立新的发布准备 checkpoint，再从该 checkpoint 重做隔离恢复演练；完成前本增量不通过。

## 结论边界

本记录不证明远端权限、GitHub-hosted runner、Pages 配置、公开 HTTPS 或公开回滚；这些只有 HG-04 后才能验证。
