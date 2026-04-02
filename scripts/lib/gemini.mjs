/**
 * Gemini CLI interaction layer.
 * Invokes gemini CLI in non-interactive (headless) mode via -p flag.
 */
import { spawn } from "node:child_process";
import { resolve } from "node:path";

const GEMINI_BIN = process.env.GEMINI_PATH || "gemini";

/**
 * Check if the Gemini CLI is available and authenticated.
 */
export async function checkGeminiReady() {
  return new Promise((resolve) => {
    const proc = spawn(GEMINI_BIN, ["--version"], {
      stdio: ["ignore", "pipe", "pipe"],
      timeout: 10_000,
    });
    let stdout = "";
    proc.stdout.on("data", (d) => (stdout += d));
    proc.on("close", (code) => {
      if (code === 0 && stdout.trim()) {
        resolve({ ready: true, version: stdout.trim() });
      } else {
        resolve({ ready: false, error: "Gemini CLI not found or not working." });
      }
    });
    proc.on("error", () => {
      resolve({ ready: false, error: "Gemini CLI not found. Install: npm install -g @anthropic-ai/gemini-cli or brew install gemini" });
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

  if (model) {
    args.push("--model", model);
  }
  if (sandbox) {
    args.push("--sandbox");
  }
  if (yolo) {
    args.push("--yolo");
  }

  // non-interactive headless mode
  args.push("--prompt", prompt);

  return new Promise((resolve, reject) => {
    const proc = spawn(GEMINI_BIN, args, {
      cwd: cwd || process.cwd(),
      stdio: ["pipe", "pipe", "pipe"],
      env: { ...process.env },
      timeout,
    });

    let stdout = "";
    let stderr = "";

    proc.stdout.on("data", (chunk) => {
      const text = chunk.toString();
      stdout += text;
      if (onProgress) onProgress(text);
    });

    proc.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });

    // pipe stdin if provided
    if (stdin) {
      proc.stdin.write(stdin);
    }
    proc.stdin.end();

    proc.on("close", (code) => {
      resolve({
        exitCode: code,
        stdout: stdout.trim(),
        stderr: stderr.trim(),
      });
    });

    proc.on("error", (err) => {
      reject(new Error(`Failed to spawn gemini: ${err.message}`));
    });
  });
}
