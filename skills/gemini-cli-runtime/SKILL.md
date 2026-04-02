---
name: gemini-cli-runtime
description: Internal helper contract for calling the gemini-companion runtime from Claude Code
user-invocable: false
---

# Gemini Runtime

Use this skill only inside the `gemini:gemini-review` subagent.

Primary helpers:
- `node "${CLAUDE_PLUGIN_ROOT}/scripts/gemini-companion.mjs" review [options]` — run a code review
- `node "${CLAUDE_PLUGIN_ROOT}/scripts/gemini-companion.mjs" task "<prompt>"` — run an arbitrary task

Review options:
- `--scope working-tree|branch|staged` — what to review (default: working-tree)
- `--base <ref>` — base branch for branch scope (auto-detected if omitted)
- `--model <model>` — Gemini model override
- `--focus <text>` — focus area for the review

Task options:
- `--model <model>` — Gemini model override
- `--write` — allow Gemini to make edits (yolo mode)
- `--sandbox` — run in sandbox mode

Execution rules:
- The review subagent is a forwarder, not an orchestrator. Its only job is to invoke `review` or `task` once and return that stdout unchanged.
- Prefer the helper over hand-rolled approaches.
- Do not call `setup` from the subagent.
- You may use the `gemini-prompting` skill to rewrite the user's request into a tighter prompt before the single invocation.
- That prompt drafting is the only Claude-side work allowed.
- Leave `--model` unset unless the user explicitly requests a specific model.

Safety rules:
- Default to read-only review. Only add `--write` when the user explicitly asks for edits.
- Preserve the user's text as-is apart from stripping routing flags.
- Do not inspect the repository or do follow-up work.
- Return stdout exactly as-is.
- If the Bash call fails, return nothing.
