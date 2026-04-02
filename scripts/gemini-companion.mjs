#!/usr/bin/env node
/**
 * gemini-companion.mjs — Main CLI entry point for Gemini Claude Code plugin.
 *
 * Subcommands:
 *   setup                Check Gemini CLI availability and auth
 *   review [options]     Run a code review using Gemini
 *   task <prompt>        Run an arbitrary task using Gemini
 */
import { parseArgs } from "node:util";
import { resolve } from "node:path";
import { checkGeminiReady, runGemini } from "./lib/gemini.mjs";
import {
  isGitRepo,
  getDiff,
  getStatus,
  getCurrentBranch,
  getBaseBranch,
  getLog,
} from "./lib/git.mjs";

// ─── Arg parsing ────────────────────────────────────────────────────
const subcommand = process.argv[2];
const rawArgs = process.argv.slice(3);

// ─── Helpers ────────────────────────────────────────────────────────
function die(msg) {
  console.error(`[gemini] ERROR: ${msg}`);
  process.exit(1);
}

function info(msg) {
  console.error(`[gemini] ${msg}`);
}

// ─── Subcommands ────────────────────────────────────────────────────

async function cmdSetup() {
  const result = await checkGeminiReady();
  if (result.ready) {
    console.log(`Gemini CLI is ready. Version: ${result.version}`);
  } else {
    console.log(`Gemini CLI is NOT ready: ${result.error}`);
    console.log("\nTo install Gemini CLI:");
    console.log("  npm install -g @anthropic-ai/sdk");
    console.log("  # or visit: https://github.com/anthropics/gemini-cli");
    console.log("\nThen authenticate:");
    console.log("  gemini");
    process.exit(1);
  }
}

const VALID_SCOPES = new Set(["working-tree", "branch", "staged"]);

async function cmdReview() {
  const { values } = parseArgs({
    args: rawArgs,
    options: {
      scope: { type: "string", default: "working-tree" },
      base: { type: "string" },
      model: { type: "string", short: "m" },
      cwd: { type: "string" },
      focus: { type: "string" },
    },
    allowPositionals: true,
  });

  const cwd = resolve(values.cwd || process.cwd());
  const scope = values.scope;

  // Validate scope
  if (!VALID_SCOPES.has(scope)) {
    die(`Invalid --scope "${scope}". Must be one of: ${[...VALID_SCOPES].join(", ")}`);
  }

  // Verify git repo
  if (!isGitRepo(cwd)) {
    die("Not a git repository. Gemini review requires a git repo.");
  }

  // Check gemini readiness
  const check = await checkGeminiReady();
  if (!check.ready) {
    die(`Gemini CLI not ready: ${check.error}\nRun /gemini:setup first.`);
  }

  const base = values.base;

  // Get diff
  info(`Generating diff (scope: ${scope})...`);
  const diff = getDiff(cwd, { scope, base });

  if (!diff) {
    console.log("No changes to review.");
    console.log(`Scope: ${scope}`);
    if (scope === "working-tree") {
      const status = getStatus(cwd);
      if (status) {
        console.log("\nUntracked/modified files:\n" + status);
      }
    }
    return;
  }

  // Build review prompt (instructions only — diff goes via stdin)
  const branch = getCurrentBranch(cwd);
  const baseBranch = base || getBaseBranch(cwd);
  const recentLog = getLog(cwd, 5);
  const focusText = values.focus ? `\n\nFocus area: ${values.focus}` : "";

  // Use a unique boundary to prevent backtick sequences in diff from breaking the prompt
  const BOUNDARY = "===DIFF_BOUNDARY_" + Date.now() + "===";

  const reviewPrompt = `You are an expert code reviewer. Review the git diff provided on stdin carefully and provide a thorough code review.

Context:
- Branch: ${branch}
- Base: ${baseBranch}
- Scope: ${scope}
- Recent commits:
${recentLog}
${focusText}

Review criteria:
1. **Bugs & Logic Errors**: Identify any bugs, logic errors, race conditions, or edge cases
2. **Security**: Flag any security vulnerabilities (injection, XSS, auth issues, etc.)
3. **Performance**: Note any performance concerns (N+1 queries, unnecessary allocations, etc.)
4. **Code Quality**: Readability, naming, duplication, SOLID principles
5. **Error Handling**: Missing error handling, improper exception management
6. **Testing**: Note if critical changes lack test coverage

Output format:
- Start with a one-line summary verdict: LGTM, Needs Changes, or Blocking Issues
- Group findings by severity: CRITICAL > WARNING > SUGGESTION > NITPICK
- For each finding, include:
  - File path and line range
  - Description of the issue
  - Suggested fix (if applicable)
- End with a brief summary of what the changes do

The diff content follows between the boundary markers on stdin:
${BOUNDARY}`;

  info("Running Gemini review...");

  try {
    const result = await runGemini({
      prompt: reviewPrompt,
      stdin: `${BOUNDARY}\n${diff}\n${BOUNDARY}`,
      cwd,
      model: values.model,
      onProgress: (chunk) => process.stdout.write(chunk),
    });

    if (result.exitCode !== 0) {
      if (result.stderr) {
        console.error("\n[gemini] stderr:\n" + result.stderr);
      }
      process.exit(result.exitCode || 1);
    }
  } catch (err) {
    die(`Failed to execute Gemini CLI: ${err.message}`);
  }

  // stdout was already streamed via onProgress
  console.log(""); // trailing newline
}

async function cmdTask() {
  const { values, positionals } = parseArgs({
    args: rawArgs,
    options: {
      model: { type: "string", short: "m" },
      cwd: { type: "string" },
      write: { type: "boolean", default: false },
      sandbox: { type: "boolean", default: false },
    },
    allowPositionals: true,
  });

  const taskPrompt = positionals.join(" ");
  if (!taskPrompt) {
    die("No task prompt provided. Usage: gemini-companion task 'your task here'");
  }

  const cwd = resolve(values.cwd || process.cwd());

  // Check gemini readiness
  const check = await checkGeminiReady();
  if (!check.ready) {
    die(`Gemini CLI not ready: ${check.error}\nRun /gemini:setup first.`);
  }

  info(`Running Gemini task...`);

  try {
    const result = await runGemini({
      prompt: taskPrompt,
      cwd,
      model: values.model,
      sandbox: values.sandbox,
      yolo: values.write,
      onProgress: (chunk) => process.stdout.write(chunk),
    });

    if (result.exitCode !== 0) {
      if (result.stderr) {
        console.error("\n[gemini] stderr:\n" + result.stderr);
      }
      process.exit(result.exitCode || 1);
    }
  } catch (err) {
    die(`Failed to execute Gemini CLI: ${err.message}`);
  }

  console.log(""); // trailing newline
}

// ─── Main dispatch ──────────────────────────────────────────────────
switch (subcommand) {
  case "setup":
    await cmdSetup();
    break;
  case "review":
    await cmdReview();
    break;
  case "task":
    await cmdTask();
    break;
  default:
    console.error(`Usage: gemini-companion <setup|review|task> [options]`);
    console.error(`\nSubcommands:`);
    console.error(`  setup              Check Gemini CLI readiness`);
    console.error(`  review [--scope working-tree|branch|staged] [--base <ref>] [--model <m>] [--focus <text>]`);
    console.error(`  task [--model <m>] [--write] [--sandbox] <prompt>`);
    process.exit(1);
}
