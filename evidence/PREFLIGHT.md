# Preflight evidence

- 执行日期：2026-09-27（America/Los_Angeles）
- 执行目的：验证来源仓库、固定提交、指定资料和目标初态。

## 已核实事实

1. `E:\AIWorkspace\01_Projects\power-bi-builder` 存在。
2. `git status --porcelain=v2 --branch`：HEAD 为 `2319a6904cd1dba0b696e59b9376889a3179b068`，分支 `codex/lifecycle-validation-design`，上游 `origin/codex/lifecycle-validation-design`，ahead/behind `+0/-0`，没有工作区变更记录。
3. `git cat-file -t` 对 `dff3a717d59935697e310a29caf6b29dff11ff11` 与 `2319a6904cd1dba0b696e59b9376889a3179b068` 均返回 `commit`。
4. `git ls-tree -r --name-only dff3a717…` 列出：
   - `playbook/README.md`
   - `playbook/PLAYBOOK.md`
   - `playbook/templates/HANDOFF.template.md`
   - `playbook/templates/PLAYBOOK_FEEDBACK.template.md`
   - `playbook/templates/RECORDS.template.md`
   - `playbook/templates/REQUIREMENTS.template.md`
   - `playbook/templates/VALIDATION.template.md`
5. `git ls-tree -r --name-only 2319a690…` 列出：
   - `playbook/reviews/lifecycle-source-reconciliation.md`
   - `playbook/reviews/lifecycle-tailoring-model.md`
   - `playbook/reviews/non-power-bi-validation-project.md`
6. 上述文件均按用户规定顺序通过 `git show <fixed-commit>:<path>` 读取。
7. 写入前 `Get-ChildItem -Force E:\AIWorkspace\01_Projects\data-quality-checker` 的计数为 `0`。
8. 原始请求先保存到 `docs/ORIGINAL_REQUEST.md`，随后在目标目录执行 `git init -b main`；`git rev-parse --show-toplevel` 回读目标目录本身。

## 限制

- 本文件保存可复核摘要，不复制 Playbook 全文，避免把来源资料变成项目内的第二权威副本。
- `non-power-bi-validation-project.md` 在 `2319a690…` 中仍自述旧设计基线 `4f4e734…`；见 DCS-001。
