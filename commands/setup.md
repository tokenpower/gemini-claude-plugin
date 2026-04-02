---
description: Check whether the Gemini CLI is installed and ready
argument-hint: ''
disable-model-invocation: true
allowed-tools: Bash(node:*), Bash(which:*), Bash(gemini:*)
---

Check Gemini CLI readiness.

Run:
```bash
node "${CLAUDE_PLUGIN_ROOT}/scripts/gemini-companion.mjs" setup
```

Return the output verbatim. If setup fails, show the installation instructions from the output.
