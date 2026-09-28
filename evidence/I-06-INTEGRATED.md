# I-06 — Integrated acceptance candidate

- 日期：2026-09-28（America/Los_Angeles）
- 入口 checkpoint：`bc4cee3463a942005d918ec136fa8f2e6667c059`
- 状态：机器与 AI 可执行部分 Passed；HG-03 Human UAT Pending。

## 最终候选重跑

1. `pnpm install --frozen-lockfile`：Already up to date，exit 0。
2. `pnpm run typecheck`：exit 0。
3. `pnpm test`：23 tests、23 pass、0 fail；pretest 重新清理并构建 `dist`。
4. 从该最终 `dist` 启动新 localhost server。
5. 真实 Edge/CDP 完整流程再次通过：
   - initial Ready；
   - 主 fixture 精确 5/4/3 和全部位置；
   - 5 MiB + 1 byte 护栏；
   - malformed CSV 错误；
   - replacement 恢复；
   - reload 回到 Ready；
   - file-operation requests 0；
   - browser errors 0。

## Contract 验收矩阵

| AC | 当前证据 | 结论 |
| --- | --- | --- |
| AC-01 文件选择与错误状态 | 真实 Edge：成功、超限、malformed、替换 | Machine Passed；Human experience pending |
| AC-02 Adapter 标准化 | 12 个 Adapter 对照/错误测试 | Passed |
| AC-03 Core 精确结果 | 冻结 JSON Oracle + 绕过 UI/Adapter 的 Core test | Passed |
| AC-04 UI 5/4/3 与位置 | Edge DOM 精确断言 + 全页截图 | Machine Passed；Human understanding pending |
| AC-05 QualityReport 结构 | TypeScript 类型 + deep equality | Passed |
| AC-06 Core 独立性 | import/禁用符号静态检查 + direct test | Passed |
| AC-07 Adapter/UI 边界 | import 检查 + 浏览器集成 | Passed |
| AC-08 静态构建重载 | 两次干净 hash 相同 + 新 server/browser | Passed for current environment |
| AC-09 不上传内容 | CSP、无网络/持久化 API、file operation requests 0 | Passed for tested app/browser scope |
| AC-10 公开 HTTPS | HG-04 后 | Not Started |
| AC-11 回滚 | STG-07/08 | Not Started |
| AC-12 最终交付 | STG-09 | Not Started |

## 当前结论

- 功能结果：`Passed candidate`，等待 HG-03。
- Contract 符合度：当前无未批准的范围偏离；DEV-001 仅改变 fixture 载体。
- 证据完整度：AC-01～09 的机器声明完整；人工可用性声明未完成。
- 运行/持久化：source/build/local-browser verified；published/rollback 未验证。
- 不可声称：公开可用、真实公开回滚、生产 SLA、所有 CSV 方言/编码/文件大小、跨浏览器等价。

## Gate

停止在 HG-03。未经用户明确完成 UAT，不进入正式发布准备或 HG-04。
