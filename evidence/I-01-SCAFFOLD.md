# I-01 — Toolchain and static shell evidence

- 日期：2026-09-27（America/Los_Angeles）
- 入口 checkpoint：`1c54648c0104629bf4c6bde438ee169cc2c96f05`（C1）
- 用途：Validation-only；证明最小工具链和静态构建路径可用，不证明业务功能。

## 变更

- 增加 package/TypeScript 配置、lockfile、受控 clean/copy/localhost serve 脚本。
- 增加语义化静态 HTML/CSS 空壳和最小 UI 模块入口。
- 唯一直接开发依赖：`typescript@7.0.2`；零运行时依赖。

## 自动验证

| 检查 | 结果 |
| --- | --- |
| `pnpm run typecheck` | exit 0 |
| `pnpm run build` | exit 0；生成 `dist/index.html`、`dist/styles.css`、`dist/assets/ui/app.js` |
| `pnpm test` | exit 0；0 tests、0 fail。这里只验证 runner 可启动，不作为功能证据。 |
| `pnpm list --depth 0` | 仅 `typescript@7.0.2` devDependency |

## 构建产物回读

使用项目 `serve.mjs` 在 `127.0.0.1:4173` 提供 `dist`，再用独立 HTTP 客户端回读：

- `GET /` → 200；
- `GET /assets/ui/app.js` → 200；
- HTML 包含 `connect-src 'none'`；
- HTML 指向相对 module 路径；
- 编译后的 module 包含 ready marker。

服务器日志只记录 method/path：`GET /`、`GET /assets/ui/app.js`，不记录 body。

## Gate

`Passed`。工具链、静态构建和独立回读均满足 I-01；允许进入 I-02。业务规则尚未实现，不能声称产品功能通过。
