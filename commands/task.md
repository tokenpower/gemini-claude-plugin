---
description: Run an arbitrary task using Gemini CLI
argument-hint: '[--wait|--background] [--model <model>] [--write] <task description>'
disable-model-invocation: true
allowed-tools: Bash(node:*), AskUserQuestion
---

Run a Gemini task through the companion script.

Raw slash-command arguments:
`$ARGUMENTS`

Core constraint:
- Forward the task to Gemini and return output verbatim.
- Do not attempt to do the task yourself.

Execution mode rules:
- If the raw arguments include `--wait`, run in foreground.
- If the raw arguments include `--background`, run in background.
- Otherwise, recommend background for large or open-ended tasks, foreground for small targeted tasks.
- Use `AskUserQuestion` once with two options if mode not specified.

Foreground flow:
```bash
node "${CLAUDE_PLUGIN_ROOT}/scripts/gemini-companion.mjs" task $ARGUMENTS
```
Return stdout verbatim.

Background flow:
```typescript
Bash({
  command: `node "${CLAUDE_PLUGIN_ROOT}/scripts/gemini-companion.mjs" task $ARGUMENTS`,
  description: "Gemini task",
  run_in_background: true
})
```
Tell user: "Gemini task started in the background. You'll be notified when it completes."
