# I-05 — Security boundary and build round-trip evidence

- 日期：2026-09-28（America/Los_Angeles）
- 入口 checkpoint：C5 `8b77715defedd9724d08f8761380d0dba05fc180`
- 用途：Validation-only；静态检查与真实浏览器证据组合，不把验证动作写成最终用户步骤。

## 独立自动检查

`pnpm test` 在 pretest 中执行干净 build，结果：23 tests、23 pass、0 fail。

新增 5 项架构/安全检查：

1. Core 只依赖 shared types，Adapter 不依赖 Core/UI。
2. 生产 TypeScript 不包含 fetch、XHR、WebSocket、sendBeacon、local/session storage、IndexedDB 或 Cache API。
3. HTML CSP 包含 `connect-src 'none'`，script/style 仅 self；没有 form 或 HTTP(S) 外部 URL。
4. `dist` 只有 7 个批准文件。
5. package 无 runtime dependencies，仅 `typescript` devDependency。

## 两次干净构建

连续执行两次 `pnpm run build`；每次都先删除经路径校验的 `dist`。两次全文件 SHA-256 清单完全相同：

| 产物 | SHA-256 |
| --- | --- |
| `dist/assets/adapters/csv.js` | `34f1ce39cbf3ac70c9229dbf0bae57b4e7ba13919ec9aa51dc855196cf6d3bae` |
| `dist/assets/core/quality.js` | `4df7d898324e105d6a4c97d519c89408a74b53c6a3768f42763695bdf9a9fd7e` |
| `dist/assets/shared/types.js` | `8e609bb71c20b858c77f0e9f90bb1319db8477b13f9f965f1a1e18524bf50881` |
| `dist/assets/ui/app.js` | `88268f3e029739791f11e9e0fa6dc23e40e302d6dba63e933b9a64b1c196ddf0` |
| `dist/favicon.svg` | `d32d98066fa2df5f2d14fdb301f8dd1ea6d152a8ecf85fbf728aec50c8ab2f0b` |
| `dist/index.html` | `7972ef79e53797346c18e23af45938fde27513b0f44fcbcf0da7f50a57f7dddb` |
| `dist/styles.css` | `ef63198528756115d28faaecd56f11e245fd615efab7e9c29a797efd43ae1c04` |

这证明当前环境/锁文件/输入下两次构建相同，不构成跨工具版本或跨平台可重现性声明。

## 新进程往返

停止旧静态服务器，在第二次干净构建后启动新 `pnpm run serve` 进程，再完整执行 Edge/CDP 流程：

- 初始、成功、错误、替换、刷新断言全部通过；
- 新增 5 MiB + 1 byte 文件，页面在读取前显示范围外错误并隐藏旧报告；
- 文件操作期间新增请求数 `0`；
- 全部观察请求是 localhost 静态 GET，无 postData；
- browser errors 为空；
- 服务器日志只有批准静态路径的 GET。

## 安全结论边界

精确证明：

- 仓库生产源码没有被检查的网络/持久化 API；
- CSP 禁止 connect；
- 测试浏览器在三个文件选择场景中没有发出新增请求；
- 超限文件走读取前拒绝分支。

不能声称：

- 浏览器扩展、OS、恶意供应链或未测试浏览器绝对不外传；
- 任意 5 MiB 内 CSV 都具有性能保证；
- 未列入本轮的编码或方言可安全解析。

## Gate

`Passed`。AC-08 与 AC-09 获得组合证据；允许进入 I-06 综合验收候选。
