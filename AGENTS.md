---
agent: Codex
last-updated: 2025-11-18
---

# DuckCoding 开发协作规范

> 本文档为指导 AI AGENT 的开发协作规范，同时也作为 AI AGENT 开发指南和持久化项目记忆存在。文档共有 `CLAUDE.md`、`AGENTS.md` 两份。两份规范文档的正文部分必须始终保持一致，yaml头部无需同步。
> 本文档作为项目记忆文档，需要及时更新。**请务必在开发完成后根据代码的实际情况更新本文档需要修改的地方以反映真实代码情况!!!**

## 核心命令一览

- `npm install`：安装前后端依赖（Node 18+ / npm 9+）。
- `npm run check`：开发工具链主入口，统一调度 AI 记忆文档同步 → ESLint → Clippy → Prettier → cargo fmt，并输出中文摘要。若缺少 `dist/`，会自动尝试 `npm run build` 供 Tauri Clippy 使用。
- `npm run check:fix`：修复版入口，顺序同上，遇可修复项会自动 `--fix`。
- `npm run tauri dev`：本地启动 Tauri 应用进行端到端手动验证。
- `npm run tauri build`: 本地构建 Tauri 应用安装包。
- `cargo test --locked`：Rust 单测执行器；缺乏覆盖时请补测试后再运行。

## 日常开发流程

0. **fork项目**：在 github 找到本项目的上游仓库: <https://github.com/DuckCoding-dev/DuckCoding> 并 fork 最新的 main 分支（后续开发前需确保sync fork以避免冲突），clone 到本地。
1. **创建分支**：`git switch -c feature/<scope>` 或 `refactor/<scope>`，避免多人在同一文件上叠加提交。
2. **编码前**：阅读/更新对应任务的设计文档，确保拆分策略一致，减少冲突。
3. **开发中**：
   - 大改动请模块化提交，保持 main.rs / App.tsx 等中心文件最小改动范围。
   - 随手运行 `npm run check:fix`，保持 0 ESLint/Clippy 告警。
4. **提交前**：
   - 运行 `npm run check`；失败立即`npm run check:fix`尝试自动修复，若无法自动修复则手动修复，禁止忽略告警。
   - 运行 `cargo test --locked` 与必要的端测脚本。
   - 若有必要，更新 `AGENTS.md` / `CLAUDE.md` （根据所使用的 AI Agent 来决定），并执行 `npm run guidelines:fix` 自动同步另一份文档。
5. **提交/PR**：
   - commit/pr 需遵循 Conventional Commits 规范，description使用简体中文。
   - pr 描述需包含：动机、主要改动点、测试情况、风险评估。
   - 避免“修复 CI”类模糊描述，明确指出受影响模块。
   - 如有可关闭的 issue，应在 pr 内提及，以便在 merge 后自动关闭。

## 零警告与质量门禁

- ESLint、Clippy、Prettier、`cargo fmt` 必须全部通过，禁止忽略/跳过检查。
- CI 未通过禁止合并；若需临时跳过必须在 PR 中详细说明原因并获 Reviewer 认可。
- 引入第三方依赖需说明用途、体积和维护计划。

## 文档同步要求

- `AGENTS.md`、`CLAUDE.md` 用于不同协作者（全体/Claude/Codex），但内容必须完全一致。
- `npm run guidelines:fix` / `npm run check:fix` 会以最近修改的正文为基准自动同步两份文档，YAML 头信息不参与同步。
- GitHub Actions 会在 PR 中运行同样的脚本，若不一致将直接失败。

## PR 清单

- [ ] 已运行 `npm run check` 且全部通过。
- [ ] Rust/前端测试已运行（或说明尚未覆盖的原因）。
- [ ] 重要变更附测试或验证截图，方便 Reviewer。

## 架构记忆（2025-11-19）

- `src-tauri/src/main.rs` 仅保留应用启动与托盘事件注册，所有 Tauri Commands 拆分到 `src-tauri/src/commands/*`，服务实现位于 `services/*`，核心设施放在 `core/*`（HTTP、日志、错误）。
- 透明代理通过 `TransparentProxyState` 注入，并在 `proxy_commands` 内统一管理启停/回滚，若启动失败必须恢复 Claude Code 真实配置和全局配置。
- 全局配置读写统一走 `utils::config::{read_global_config, write_global_config, apply_proxy_if_configured}`，避免出现多份路径逻辑；任何命令要修改配置都应调用这些辅助函数。
- UpdateService / 统计命令等都通过 `tauri::State` 注入复用，前端 ToolStatus 的结构保持轻量字段 `{id,name,installed,version}`。
- UI 相关的托盘/窗口操作集中在 `src-tauri/src/ui/*`，其它模块如需最小化到托盘请调用 `ui::hide_window_to_tray` 等封装方法。
