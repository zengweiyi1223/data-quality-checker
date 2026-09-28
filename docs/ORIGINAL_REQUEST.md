# 原始用户提示与目标

保存时间：2026-09-27（America/Los_Angeles）

## 原始提示词

> 你负责执行一个独立的非 Power BI 跨领域验证项目：data-quality-checker。
>
> 项目路径：
> `E:\AIWorkspace\01_Projects\data-quality-checker`
>
> 方法来源仓库：
> `E:\AIWorkspace\01_Projects\power-bi-builder`
>
> 固定基线：
>
> - 正式 Playbook v0.2：`dff3a717d59935697e310a29caf6b29dff11ff11`
> - 生命周期验证设计与项目选择：`2319a6904cd1dba0b696e59b9376889a3179b068`
>
> 本项目用于验证以下目标架构：
>
> - 通用开发生命周期
> - 人机协作责任模型
> - 可裁剪阶段模块
> - 每阶段记录模板
> - 证据闸门内核
>
> 请严格按以下顺序执行。
>
> 1. 预检
>
> - 检查 power-bi-builder 仓库、Git 状态和上述两个提交是否存在。
> - 使用固定提交读取资料，不依赖工作区当前分支状态。
> - 首先读取 v0.2 提交中的：
>   - playbook/README.md
>   - playbook/PLAYBOOK.md
>   - playbook/templates/**
> - 再读取设计提交中的：
>   - playbook/reviews/lifecycle-source-reconciliation.md
>   - playbook/reviews/lifecycle-tailoring-model.md
>   - playbook/reviews/non-power-bi-validation-project.md
> - 不修改 power-bi-builder 仓库或 playbook/**。
> - 检查目标路径是否已经存在；若存在且不是空目录或包含未知修改，停止并报告，不得覆盖。
>
> 2. 建立独立项目
>
> - 在目标路径建立独立项目和独立 Git 仓库。
> - 不在 AIWorkspace 根目录建立 Git 仓库。
> - 首先保存本提示词和原始用户目标。
> - 项目初期只建立实际需要的目录和文档，不预建大量空文件。
> - 远端仓库、push 和公开部署属于外部写入，必须等待 Human Gate。
>
> 3. STG-00：项目画像与裁剪
>
> 使用：
>
> - 基础画像：PF-APP
> - 领域特征：表格数据质量检查
> - 修饰器：MD-UI、MD-DATA、MD-DEPLOY、MD-SEC
> - MD-OPS：Conditional，只做最小可用性和回滚验证
> - 不启用：MD-EXT、MD-MULTI、MD-HIGH
>
> 形成项目画像、角色、阶段裁剪和文档映射。记录 HYP-01 至 HYP-07 的观察方式。
>
> 4. STG-01 与 STG-02：目标及 Contract
>
> 冻结以下产品边界。
>
> 必须完成：
>
> - 导入一个 CSV 文件；
> - 浏览器本地解析和检查，不上传文件内容；
> - 检查空值和完全重复行；
> - 显示总行数、问题数和问题位置；
> - 返回结构化 QualityReport；
> - 使用固定 fixture 和预期结果进行自动测试；
> - 构建静态站点；
> - 经人工批准后，通过公开 HTTPS 地址分享；
> - 完成验证、回滚、HANDOFF 和 Playbook Feedback。
>
> 明确不做：
>
> - 类型、日期或业务口径推断；
> - 自定义规则编辑器；
> - 数据编辑、清洗或自动修复；
> - Excel、数据库和 API 输入；
> - 登录、权限、云端保存和多人协作；
> - 生成式 AI 功能；
> - 超大文件、流式处理和性能承诺；
> - 付费服务、正式 npm 发布和生产 SLA。
>
> 定义验收条款、独立 Oracle、停止条件、安全边界、结论分级、Human Gate 和计时口径。
>
> HG-01：由用户确认 Contract 后才能继续。
>
> 5. STG-03 与 STG-04：设计和准备
>
> 设计必须保持：
>
> ```text
> CSV File
> → CSV Adapter
> → Normalized Table
> → Quality Core
> → QualityReport
> → Static Web UI
> ```
>
> 其中：
>
> - Core 不依赖 DOM、UI 状态、托管平台或网络请求；
> - CSV 解析属于 Adapter；
> - UI 只负责输入、调用和展示；
> - Core 有明确类型和函数入口；
> - 单元测试能够绕过 UI 直接调用 Core。
>
> 比较最小可行技术方案，说明取舍，不得为了“看起来完整”增加框架或依赖。
>
> 形成：
>
> - UI 流程；
> - Core API 与数据结构；
> - Adapter 边界；
> - 测试和 fixture 方案；
> - 静态构建及 GitHub Pages 部署方案；
> - 原子阶段计划；
> - Git checkpoint 计划；
> - 项目记录文件映射。
>
> HG-02：由用户确认设计和计划后才能开始实现。
>
> 首次回复到 HG-02 为止。不要提前写业务代码、创建远端仓库或部署。
>
> 6. HG-02 通过后的实施要求
>
> - 按 STG-05 的原子 Execute–Verify 循环实施；
> - 每个增量立即验证并记录证据；
> - Blocking Failure 不得继续依赖步骤；
> - 关键结论不得由生成链路自证；
> - 区分生产必需、条件式、诊断和验证专用操作；
> - 在关键阶段和高风险操作前建立 Git checkpoint；
> - 不静默扩大范围。
>
> 7. 验收与部署
>
> STG-06 必须包含：
>
> - 固定 fixture 的精确预期结果；
> - Core 独立单元测试；
> - Adapter 对照测试；
> - 浏览器实际操作；
> - 构建产物重新加载；
> - 浏览器网络证据，确认 CSV 内容未上传。
>
> HG-03：用户完成 UAT 后才能进入正式发布。
>
> STG-07 首选 GitHub Pages。
>
> HG-04 必须明确确认：
>
> - 创建或使用哪个远端仓库；
> - 仓库可见性；
> - push 目标；
> - 公开 URL；
> - 部署和残余风险。
>
> 未经 HG-04，不得创建远端资源、push 或公开部署。
>
> 8. 交付与反馈
>
> 完成后必须提供：
>
> - REQUIREMENTS/Contract；
> - TECH_DESIGN；
> - VALIDATION；
> - HANDOFF；
> - PLAYBOOK_FEEDBACK；
> - Decision/Deviation；
> - Git checkpoint 与证据地图；
> - 公开 URL及回滚方法；
> - v0.2 Rule conformity 与 utility；
> - HYP-01 至 HYP-07 的验证结果；
> - 未验证内容和不能声称的结论；
> - 最终提交号。
>
> 不得修改 power-bi-builder/playbook/**。
> 不得提前修改 Playbook v0.2。
> 不得封装 Codex Skill。
> 实验完成后，把最终 HANDOFF、VALIDATION、PLAYBOOK_FEEDBACK 和提交号返回 Playbook Maintainer 对话。

## 原始用户目标摘要

在独立仓库中构建一个浏览器本地运行的 CSV 数据质量检查器，并用它验证“通用开发生命周期、责任模型、可裁剪阶段、阶段记录和证据闸门内核”能否跨出 Power BI 领域。全过程必须受固定基线、Human Gate、独立证据、停止/回滚规则和外部写入边界约束。
