# STG-04 tool preflight

- 日期：2026-09-27（America/Los_Angeles）
- Contract checkpoint：`70fb532bd31b9ffcf0794eafd41b583621ab4ed4`

## 工具事实

| 工具 | 结果 | 设计影响 |
| --- | --- | --- |
| Node.js | `v24.19.0` | 可使用浏览器目标 TypeScript 构建脚本、Node 内置 test 与本地静态服务器。 |
| pnpm | `11.19.0`，来自 Codex runtime fallback 路径 | 作为唯一包管理器；提交 lockfile。 |
| Git | `2.55.0.windows.2` | 本地 checkpoint 与恢复可用。 |
| npm | missing | 不写 npm 专用实施命令；不是 blocker。 |
| npx | missing | 使用 pnpm script/local binary；不是 blocker。 |
| global tsc | missing | HG-02 后以项目开发依赖安装 TypeScript；安装前不假设版本。 |
| yarn/corepack | missing | 不使用。 |

## Git 与边界

- 当前项目需求冻结提交：`70fb532bd31b9ffcf0794eafd41b583621ab4ed4`。
- `power-bi-builder` 再次只读检查：HEAD 仍为 `2319a690…`，ahead/behind `+0/-0`，无工作区修改。
- 未安装依赖、未创建 package manifest、未创建源码/fixture/test/build workflow。
- 未创建或连接远端，未 push，未部署。

## Gate

工具路线足以进入设计审批。若 HG-02 后 pnpm registry 访问或 TypeScript 安装失败，记录 `Environment Failure / Blocking`，不得静默切换到 CDN、vendoring、npm 或 UI 框架。
