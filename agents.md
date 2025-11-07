# Agents Workflow Guide

- **统一校验命令：** 修改任意前端/后端代码后，必须运行 `npm run check`。它会依次执行：
  - `npm run lint:ts` → ESLint（React + TypeScript）
  - `npm run lint:rs` → `cargo clippy -- -D warnings`
  - `npm run fmt:ts` → Prettier
  - `npm run fmt:rs` → `cargo fmt --check`
- **自动修复：** 遇到格式问题或可自动修复的告警，优先运行 `npm run check:fix`，随后再次执行 `npm run check` 确认。
- **提交前校验：** 请在提交/推送之前确保命令完全通过。若图省事，可在 `.git/hooks/pre-commit` 中加入：
  ```bash
  #!/usr/bin/env bash
  npm run check
  ```
- **零警告标准：** 目标是保持仓库无 ESLint/Clippy 警告；如发现告警请在本次迭代中解决或解释原因。

这一约定适用于 Claude、CodeX、Gemini 等所有协作者，确保多语言堆栈的一致品质。
