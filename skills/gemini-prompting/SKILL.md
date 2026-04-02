---
name: gemini-prompting
description: Internal guidance for composing effective Gemini prompts for code review, diagnosis, and research tasks
user-invocable: false
---

# Gemini Prompt Composition

Use this skill only to shape prompts before forwarding to the Gemini companion script.

## Review prompts

The companion script already includes a comprehensive review prompt template. For custom review requests, you can add focus areas via `--focus`:

```bash
node "${CLAUDE_PLUGIN_ROOT}/scripts/gemini-companion.mjs" review --focus "security and auth"
```

## Task prompts

When composing task prompts for Gemini:

1. **Be specific**: State exactly what you want Gemini to do.
2. **Provide context**: Include relevant file paths, function names, error messages.
3. **Set output format**: Tell Gemini how to structure its response.
4. **Scope the work**: Limit the task to what's actionable.

### Good patterns:

```
"Review the error handling in src/api/auth.ts. Focus on: missing try/catch blocks, improper error propagation, and security implications of error messages exposed to clients."
```

```
"Analyze the database query in src/models/user.ts:45-80. Check for SQL injection risks, N+1 query patterns, and missing index usage."
```

### Anti-patterns:

- Don't ask Gemini to "review everything" — scope the request.
- Don't include the diff text manually — the review command handles that.
- Don't ask Gemini to fix things in review mode — use task mode with `--write` instead.
- Don't duplicate work: if you're forwarding from the review subagent, don't also read files yourself.
