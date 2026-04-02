/**
 * Gemini CLI interaction layer.
 * Invokes gemini CLI in non-interactive (headless) mode via -p flag.
 */
import { spawn } from "node:child_process";

const GEMINI_BIN = process.env.GEMINI_PATH || "gemini";

/** Default model for all Gemini invocations. */
export const DEFAULT_MODEL = "gemini-3.1-pro-preview";

/**
 * Check if the Gemini CLI is available and authenticated.
 */
export async function checkGeminiReady() {
  return new Promise((res) => {
    const proc = spawn(GEMINI_BIN, ["--version"], {
      stdio: ["ignore", "pipe", "pipe"],
      timeout: 10_000,
    });
    let stdout = "";
    proc.stdout.on("data", (d) => (stdout += d));
    proc.on("close", (code) => {
      if (code === 0 && stdout.trim()) {
        res({ ready: true, version: stdout.trim() });
      } else {
        res({ ready: false, error: "Gemini CLI not found or not working." });
      }
    });
    proc.on("error", () => {
      res({ ready: false, error: "Gemini CLI not found. Install via: https://github.com/anthropics/gemini-cli" });
    });
  });
}

/**
 * Run Gemini in non-interactive mode with a prompt.
 * Pipes stdin content (e.g., diff) and uses -p for the instruction prompt.
 *
 * @param {object} opts
 * @param {string} opts.prompt - The instruction prompt
 * @param {string} [opts.stdin] - Content to pipe via stdin (e.g., diff)
 * @param {string} [opts.model] - Model override
 * @param {string} [opts.cwd] - Working directory
 * @param {function} [opts.onProgress] - Streaming callback
 * @param {number} [opts.timeout] - Timeout in ms (default: 5 min)
 */
export async function runGemini({
  prompt,
  stdin,
  model,
  cwd,
  onProgress,
  timeout = 5 * 60 * 1000,
  sandbox = false,
  yolo = false,
}) {
  const args = [];

  const effectiveModel = model || DEFAULT_MODEL;
  args.push("--model", effectiveModel);
  if (sandbox) {
    args.push("--sandbox");
  }
  if (yolo) {
    args.push("--yolo");
  }

  // non-interactive headless mode
  args.push("--prompt", prompt);

  return new Promise((resolve, reject) => {
    let settled = false;

    const proc = spawn(GEMINI_BIN, args, {
      cwd: cwd || process.cwd(),
      stdio: ["pipe", "pipe", "pipe"],
      env: { ...process.env },
    });

    let stdout = "";
    let stderr = "";

    // Use setEncoding to handle multi-byte UTF-8 characters correctly
    proc.stdout.setEncoding("utf8");
    proc.stderr.setEncoding("utf8");

    proc.stdout.on("data", (text) => {
      stdout += text;
      if (onProgress) onProgress(text);
    });

    proc.stderr.on("data", (text) => {
      stderr += text;
    });

    // Pipe stdin if provided
    if (stdin) {
      proc.stdin.write(stdin);
    }
    proc.stdin.end();

    // Cross-platform timeout via setTimeout + kill
    const timer = setTimeout(() => {
      if (!settled) {
        settled = true;
        proc.kill("SIGTERM");
        reject(new Error(`Gemini CLI timed out after ${timeout / 1000}s`));
      }
    }, timeout);

    proc.on("close", (code) => {
      clearTimeout(timer);
      if (!settled) {
        settled = true;
        resolve({
          exitCode: code,
          stdout: stdout.trim(),
          stderr: stderr.trim(),
        });
      }
    });

    proc.on("error", (err) => {
      clearTimeout(timer);
      if (!settled) {
        settled = true;
        reject(new Error(`Failed to spawn gemini: ${err.message}`));
      }
    });
  });
}
