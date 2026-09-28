# I-04 — UI and real-browser evidence

- 日期：2026-09-28（America/Los_Angeles）
- 入口 checkpoint：C4 `86e59fda1f3e1620eaf1ad4fedba010e2f05434d`
- 浏览器：系统已安装 Microsoft Edge，无头模式，通过 Chrome DevTools Protocol 控制。
- 页面来源：`dist/**`，由项目 localhost 静态服务器提供；不是源码文件直开。

## 自动回归

- `pnpm run typecheck`：exit 0。
- `pnpm test`：18 tests、18 pass、0 fail，并在 pretest 中重新构建 `dist`。

## Browser path 与恢复

计划先使用 `computer-use` 技能。初始化返回“failed to write kernel assets: 系统找不到指定的路径 (os error 3)”；按技能恢复规则 reset 后重试一次，错误相同，因此停止该通道。

替代路径不使用 DOM 模拟器：启动机器上预先安装的 Edge 浏览器，以 CDP 执行真实导航、File input 设置、浏览器模块加载、DOM 读取、刷新、console 和 Network 监听。临时 profile 创建在系统 temp 下的 `dqc-edge-*`，脚本校验其父目录/前缀后在结束时删除。

## 首次 Gate failure 与恢复

首次 Edge 流程执行到最终错误检查时发现两次 `/favicon.ico` 404。分类为 `Validation Failure / Blocking`；未进入 I-05。增加本地 `favicon.svg` 并纳入受控 build 清单后，重新执行 typecheck、全量测试、build 和完整浏览器流程。

## 成功浏览器断言

| 场景 | 精确结果 |
| --- | --- |
| 初始加载 | heading `Ready`；report hidden |
| 导入 `quality-oracle.csv` | heading `Check complete`；message `Found 4 issues across 3 affected rows.` |
| 摘要 | totalRows `5`；issueCount `4`；affectedRows `3` |
| 空值位置 | [row 2, source 3, name]；[row 3, source 4, name]；[row 4, source 5, email] |
| 重复组 | data rows `2, 3`；source lines `3, 4` |
| 错误 fixture | `A quoted field is not closed. Check source line 2.`；report hidden |
| 错误后替换 | 再选主 fixture，issueCount `4`、正确文件名 |
| 强制刷新 | 回到 `Ready`；report hidden，证明不持久化用户内容 |
| Browser errors | 空数组 |

## Network 事实

- Network 监听在页面导航前启用。
- 选择和检查本地 fixture 后新增请求数：`0`。
- 全部页面请求仅为 localhost 静态资源 GET：HTML、CSS、UI module、Adapter module、Core module、favicon；无 POST data。
- 请求对象中未出现 fixture 的合成 email 内容。
- 该证据证明本应用在本测试场景中没有因文件操作发出内容请求；不证明浏览器扩展、OS 或供应链绝对无外传。

## 视觉检查

`evidence/browser-success.png` 为成功结果的浏览器全页截图。人工视觉检查确认：

- 标题、隐私说明、文件按钮、状态和报告层级清楚；
- 5/4/3 摘要与 findings 表格均完整可读；
- 没有明显横向裁切、重叠或不可见结果；
- 问题数与受影响行数视觉上明确分离。

## Gate

`Passed`。AC-01、AC-04 与 AC-07 的 UI 部分获得真实浏览器证据；文件操作网络事实将在 I-05 与静态检查组合后形成安全结论。
