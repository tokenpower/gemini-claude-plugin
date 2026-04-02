---
name: gemini-result-handling
description: Internal guidance for presenting Gemini review output back to the user
user-invocable: false
---

# Gemini Result Handling

When the helper returns Gemini output:
- Preserve the verdict, summary, findings, and any structure in the output.
- For review output, present findings first and keep them ordered by severity.
- Use the file paths and line numbers exactly as reported.
- Preserve evidence boundaries — if Gemini marked something as an inference, uncertainty, or follow-up question, keep that distinction.
- If there are no findings, say that explicitly and keep the residual-risk note brief.
- If Gemini made edits (task with --write), say so explicitly and list the touched files when provided.
- CRITICAL: After presenting review findings, STOP. Do not make any code changes. You MUST explicitly ask the user which issues, if any, they want fixed before touching a single file. Auto-applying fixes from a review is strictly forbidden.
- If the helper reports malformed output or a failed Gemini run, include the most actionable stderr lines and stop there instead of guessing.
- If the helper reports that setup is required, direct the user to `/gemini:setup`.
