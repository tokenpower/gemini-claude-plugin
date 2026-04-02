# Gemini plugin for Claude Code

Use Google Gemini CLI from inside Claude Code for code reviews or to delegate tasks to Gemini.

This plugin is for Claude Code users who want a second opinion from Gemini on their code changes, or want to leverage Gemini's capabilities for specific tasks without leaving their workflow.

[简体中文](#gemini-plugin-for-claude-code-简体中文)

## What You Get

- `/gemini:review` for a thorough Gemini-powered code review
- `/gemini:task` to delegate an arbitrary task to Gemini
- `/gemini:setup` to check whether the Gemini CLI is installed and ready
- `gemini:gemini-review` subagent that Claude can invoke proactively for a second opinion

## Requirements

- **Gemini CLI** installed and authenticated
- **Node.js 18.18 or later**
- **Git** (for code review features)

## Install

### From marketplace (when published)

Add the marketplace in Claude Code:

```bash
/plugin marketplace add <marketplace-repo>
```

Install the plugin:

```bash
/plugin install gemini@<marketplace>
```

Reload plugins:

```bash
/reload-plugins
```

### Manual install

Clone or copy the plugin into the Claude Code plugin cache:

```bash
mkdir -p ~/.claude/plugins/cache/local/gemini/0.1.0
cp -r /path/to/gemini-claude-plugin/* ~/.claude/plugins/cache/local/gemini/0.1.0/
cp -r /path/to/gemini-claude-plugin/.claude-plugin ~/.claude/plugins/cache/local/gemini/0.1.0/
```

Register it in `~/.claude/plugins/installed_plugins.json`:

```json
{
  "gemini@local": [
    {
      "scope": "user",
      "installPath": "<home>/.claude/plugins/cache/local/gemini/0.1.0",
      "version": "0.1.0",
      "installedAt": "2026-04-02T00:00:00.000Z",
      "lastUpdated": "2026-04-02T00:00:00.000Z"
    }
  ]
}
```

Enable it in `~/.claude/settings.json`:

```json
{
  "enabledPlugins": {
    "gemini@local": true
  }
}
```

Restart Claude Code, then run:

```bash
/gemini:setup
```

## Usage

### `/gemini:review`

Runs a Gemini code review on your current work. It generates a git diff, sends it to Gemini with a structured review prompt, and returns findings grouped by severity.

> [!NOTE]
> Large diffs may take a while. For multi-file changes it is generally recommended to run in the background.

Use it when you want:

- a review of your current uncommitted changes
- a review of your branch compared to a base branch
- a second opinion from a different AI model

It supports `--scope`, `--base`, `--model`, `--focus`, `--wait`, and `--background`.

**Scope options:**

| Scope | What it reviews |
|-------|----------------|
| `working-tree` (default) | All staged and unstaged changes vs HEAD |
| `branch` | All commits on the current branch vs the base branch |
| `staged` | Only staged (cached) changes |

Examples:

```bash
/gemini:review
/gemini:review --scope branch --base main
/gemini:review --scope staged --focus "security and auth"
/gemini:review --background
```

This command is read-only and will not make any code changes.

### `/gemini:task`

Sends an arbitrary prompt to Gemini CLI in headless mode.

Use it when you want Gemini to:

- analyze architecture or design
- investigate a bug from a different perspective
- generate documentation or test cases
- do anything that benefits from a second model's viewpoint

It supports `--model`, `--write`, `--sandbox`, `--wait`, and `--background`.

Examples:

```bash
/gemini:task "analyze the error handling patterns in this project"
/gemini:task --background "suggest improvements to the database layer"
/gemini:task --write "add unit tests for the auth module"
```

> [!WARNING]
> The `--write` flag enables Gemini to make file changes (yolo mode). Use with caution.

### `/gemini:setup`

Checks whether the Gemini CLI is installed, accessible, and reports its version.

```bash
/gemini:setup
```

If Gemini CLI is missing, install it following the official instructions at the [Gemini CLI repository](https://github.com/anthropics/gemini-cli).

## Typical Flows

### Review Before Shipping

```bash
/gemini:review
```

### Review a Feature Branch

```bash
/gemini:review --scope branch --base main
```

### Get a Second Opinion in the Background

```bash
/gemini:review --background
```

### Delegate an Analysis Task

```bash
/gemini:task "identify potential race conditions in the request handling code"
```

### Combine Claude and Gemini Reviews

Run both reviews and compare findings:

```bash
/gemini:review --scope branch --base main
```

Then ask Claude to also review the same changes. Compare the two sets of findings for a more thorough review.

## Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `GEMINI_PATH` | Path to the Gemini CLI binary | `gemini` (from PATH) |

### Default Model

The plugin defaults to **`gemini-3.1-pro-preview`** for all commands (review, task). You can override per-command with `--model`:

```bash
/gemini:review --model gemini-3-flash-preview
```

### Gemini CLI Configuration

The plugin uses your local Gemini CLI installation and its existing configuration. Any API keys or other settings configured in Gemini CLI will be picked up automatically.

## FAQ

### Do I need a separate Gemini account?

If you are already signed into Gemini CLI on this machine, that account works here too. This plugin uses your local Gemini CLI authentication.

### Does the plugin modify my code?

By default, no. The `/gemini:review` command is strictly read-only. The `/gemini:task` command is also read-only unless you explicitly pass `--write`.

### Can I use a specific Gemini model?

Yes. Pass `--model <model-name>` to any command:

```bash
/gemini:review --model gemini-3-flash-preview
/gemini:task --model gemini-3-flash-preview "summarize recent changes"
```

### How does the review prompt work?

The plugin generates a git diff, collects context (branch name, recent commits), and sends a structured prompt to Gemini asking for a code review grouped by severity (CRITICAL, WARNING, SUGGESTION, NITPICK). The diff is sent via stdin to avoid OS argument length limits.

### Can I use this alongside the Codex plugin?

Yes. Both plugins can be installed and enabled simultaneously. They use separate commands (`/gemini:*` vs `/codex:*`) and do not conflict.

---

# Gemini plugin for Claude Code (简体中文)

在 Claude Code 中使用 Google Gemini CLI 进行代码审查或将任务委托给 Gemini。

本插件适用于希望从 Gemini 获得代码变更第二意见，或在不离开当前工作流的情况下利用 Gemini 能力执行特定任务的 Claude Code 用户。

[English](#gemini-plugin-for-claude-code)

## 功能概览

- `/gemini:review` — 使用 Gemini 进行全面的代码审查
- `/gemini:task` — 将任意任务委托给 Gemini
- `/gemini:setup` — 检查 Gemini CLI 是否已安装并就绪
- `gemini:gemini-review` 子代理 — Claude 可主动调用以获取第二意见

## 前置要求

- **Gemini CLI** 已安装并完成认证
- **Node.js 18.18 或更高版本**
- **Git**（代码审查功能需要）

## 安装

### 从插件市场安装（发布后）

在 Claude Code 中添加市场：

```bash
/plugin marketplace add <marketplace-repo>
```

安装插件：

```bash
/plugin install gemini@<marketplace>
```

重新加载插件：

```bash
/reload-plugins
```

### 手动安装

将插件复制到 Claude Code 插件缓存目录：

```bash
mkdir -p ~/.claude/plugins/cache/local/gemini/0.1.0
cp -r /path/to/gemini-claude-plugin/* ~/.claude/plugins/cache/local/gemini/0.1.0/
cp -r /path/to/gemini-claude-plugin/.claude-plugin ~/.claude/plugins/cache/local/gemini/0.1.0/
```

在 `~/.claude/plugins/installed_plugins.json` 中注册：

```json
{
  "gemini@local": [
    {
      "scope": "user",
      "installPath": "<home>/.claude/plugins/cache/local/gemini/0.1.0",
      "version": "0.1.0",
      "installedAt": "2026-04-02T00:00:00.000Z",
      "lastUpdated": "2026-04-02T00:00:00.000Z"
    }
  ]
}
```

在 `~/.claude/settings.json` 中启用：

```json
{
  "enabledPlugins": {
    "gemini@local": true
  }
}
```

重启 Claude Code，然后运行：

```bash
/gemini:setup
```

## 使用方法

### `/gemini:review`

对当前工作进行 Gemini 代码审查。插件会生成 git diff，将其连同结构化的审查提示一起发送给 Gemini，并返回按严重程度分组的审查结果。

> [!NOTE]
> 大型 diff 可能需要较长时间。对于多文件变更，建议在后台运行。

适用场景：

- 审查当前未提交的变更
- 审查当前分支相对于基准分支的变更
- 从不同 AI 模型获取第二意见

支持 `--scope`、`--base`、`--model`、`--focus`、`--wait` 和 `--background` 参数。

**Scope 选项：**

| Scope | 审查内容 |
|-------|---------|
| `working-tree`（默认） | 所有已暂存和未暂存的变更（对比 HEAD） |
| `branch` | 当前分支上的所有提交（对比基准分支） |
| `staged` | 仅已暂存（cached）的变更 |

示例：

```bash
/gemini:review
/gemini:review --scope branch --base main
/gemini:review --scope staged --focus "安全性和认证"
/gemini:review --background
```

此命令为只读操作，不会修改任何代码。

### `/gemini:task`

以无头模式向 Gemini CLI 发送任意提示。

适用场景：

- 分析架构或设计
- 从不同角度调查 bug
- 生成文档或测试用例
- 任何受益于第二个模型视角的任务

支持 `--model`、`--write`、`--sandbox`、`--wait` 和 `--background` 参数。

示例：

```bash
/gemini:task "分析这个项目中的错误处理模式"
/gemini:task --background "为数据库层提出改进建议"
/gemini:task --write "为认证模块添加单元测试"
```

> [!WARNING]
> `--write` 标志允许 Gemini 修改文件（yolo 模式），请谨慎使用。

### `/gemini:setup`

检查 Gemini CLI 是否已安装、可访问，并报告其版本。

```bash
/gemini:setup
```

如果 Gemini CLI 未安装，请参考 [Gemini CLI 仓库](https://github.com/anthropics/gemini-cli) 的官方说明进行安装。

## 典型工作流

### 发布前审查

```bash
/gemini:review
```

### 审查功能分支

```bash
/gemini:review --scope branch --base main
```

### 在后台获取第二意见

```bash
/gemini:review --background
```

### 委托分析任务

```bash
/gemini:task "识别请求处理代码中的潜在竞态条件"
```

### 结合 Claude 和 Gemini 审查

先运行 Gemini 审查，再让 Claude 审查相同的变更，对比两方的发现以获得更全面的审查结果：

```bash
/gemini:review --scope branch --base main
```

## 配置

### 环境变量

| 变量 | 说明 | 默认值 |
|------|------|--------|
| `GEMINI_PATH` | Gemini CLI 二进制文件路径 | `gemini`（从 PATH 查找） |

### 默认模型

插件默认使用 **`gemini-3.1-pro-preview`** 执行所有命令（review、task）。可通过 `--model` 逐命令覆盖：

```bash
/gemini:review --model gemini-3-flash-preview
```

### Gemini CLI 配置

插件使用本地已安装的 Gemini CLI 及其现有配置。Gemini CLI 中配置的 API 密钥或其他设置都会被自动使用。

## 常见问题

### 需要单独的 Gemini 账号吗？

如果你已在本机登录 Gemini CLI，该账号在此插件中同样有效。插件使用你本地的 Gemini CLI 认证。

### 插件会修改我的代码吗？

默认不会。`/gemini:review` 命令严格只读。`/gemini:task` 命令同样只读，除非你显式传入 `--write`。

### 可以指定 Gemini 模型吗？

可以。在任何命令中传入 `--model <模型名称>`：

```bash
/gemini:review --model gemini-3-flash-preview
/gemini:task --model gemini-3-flash-preview "总结最近的变更"
```

### 审查提示是如何工作的？

插件生成 git diff，收集上下文信息（分支名、最近提交），然后向 Gemini 发送结构化提示，要求按严重程度（CRITICAL、WARNING、SUGGESTION、NITPICK）分组进行代码审查。diff 通过 stdin 传递以避免操作系统命令行参数长度限制。

### 可以和 Codex 插件同时使用吗？

可以。两个插件可以同时安装并启用。它们使用不同的命令前缀（`/gemini:*` 与 `/codex:*`），互不冲突。
