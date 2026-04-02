/**
 * Git utilities for generating diffs and detecting workspace state.
 */
import { execFileSync } from "node:child_process";

function git(args, cwd) {
  return execFileSync("git", args, {
    cwd,
    encoding: "utf-8",
    maxBuffer: 10 * 1024 * 1024,
  }).trim();
}

export function isGitRepo(cwd) {
  try {
    git(["rev-parse", "--is-inside-work-tree"], cwd);
    return true;
  } catch {
    return false;
  }
}

export function getRepoRoot(cwd) {
  return git(["rev-parse", "--show-toplevel"], cwd);
}

export function getCurrentBranch(cwd) {
  try {
    return git(["symbolic-ref", "--short", "HEAD"], cwd);
  } catch {
    try {
      return git(["rev-parse", "--short", "HEAD"], cwd);
    } catch {
      return "unknown";
    }
  }
}

/**
 * Detect the default/base branch (main, master, develop, etc.)
 */
export function getBaseBranch(cwd) {
  for (const candidate of ["main", "master", "develop"]) {
    try {
      git(["rev-parse", "--verify", candidate], cwd);
      return candidate;
    } catch {
      // try next
    }
  }
  // fallback: use the first remote HEAD
  try {
    const ref = git(["symbolic-ref", "refs/remotes/origin/HEAD"], cwd);
    return ref.replace("refs/remotes/origin/", "");
  } catch {
    return "main";
  }
}

/**
 * Get diff for review. Supports multiple scopes:
 * - "working-tree": staged + unstaged changes
 * - "branch": changes since divergence from base branch
 * - "staged": only staged changes
 */
export function getDiff(cwd, { scope = "working-tree", base }) {
  try {
    switch (scope) {
      case "staged":
        return git(["diff", "--cached"], cwd);
      case "branch": {
        const baseBranch = base || getBaseBranch(cwd);
        const mergeBase = git(["merge-base", baseBranch, "HEAD"], cwd);
        return git(["diff", mergeBase, "HEAD"], cwd);
      }
      case "working-tree":
      default:
        return git(["diff", "HEAD"], cwd);
    }
  } catch {
    // Fallback: try diff without HEAD (works for initial commits with staged files)
    try {
      if (scope === "staged" || scope === "working-tree") {
        return git(["diff", "--cached"], cwd);
      }
    } catch {
      // ignore
    }
    return "";
  }
}

/**
 * Get short stats for sizing the review.
 */
export function getDiffStats(cwd, { scope = "working-tree", base }) {
  try {
    switch (scope) {
      case "staged":
        return git(["diff", "--shortstat", "--cached"], cwd);
      case "branch": {
        const baseBranch = base || getBaseBranch(cwd);
        return git(["diff", "--shortstat", `${baseBranch}...HEAD`], cwd);
      }
      case "working-tree":
      default: {
        const staged = git(["diff", "--shortstat", "--cached"], cwd);
        const unstaged = git(["diff", "--shortstat"], cwd);
        return [staged, unstaged].filter(Boolean).join("\n");
      }
    }
  } catch {
    return "";
  }
}

export function getStatus(cwd) {
  return git(["status", "--short", "--untracked-files=all"], cwd);
}

export function getLog(cwd, count = 5) {
  try {
    return git(["log", "--oneline", `-${count}`], cwd);
  } catch {
    return "";
  }
}
