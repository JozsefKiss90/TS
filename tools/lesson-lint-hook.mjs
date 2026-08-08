#!/usr/bin/env node
// PostToolUse hook: lint course material the moment it is written.
//
// Reads the hook payload on stdin, and does nothing unless the edited file is
// course material. For course material it runs tools/lesson-lint.mjs and, on
// any ERROR, exits 2 so the violations are fed back into the session.
//
// The point is that verification stops depending on the model remembering to
// run it. Article VIII.6 says a check must be run before it is claimed.
//
// Paths resolve from this file, not the working directory, because a hook's
// cwd is not guaranteed.

import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join, resolve, relative, sep } from "node:path";
import { readFileSync } from "node:fs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const LINTER = join(ROOT, "tools", "lesson-lint.mjs");

let raw = "";
try {
  raw = readFileSync(0, "utf8");
} catch {
  raw = "";
}

let payload = {};
try {
  payload = JSON.parse(raw || "{}");
} catch {
  process.exit(0); // Malformed payload is not the author's problem.
}

const file =
  payload?.tool_input?.file_path ||
  payload?.tool_response?.filePath ||
  payload?.tool_input?.notebook_path ||
  "";

if (!file) process.exit(0);

// Course material only. Everything else is out of scope for the profile.
const rel = relative(ROOT, resolve(file)).split(sep).join("/");
const isLesson = /^lessons\/.+\.html$/.test(rel);
const isWiki = /^wiki\/.+\.md$/.test(rel);
if (!isLesson && !isWiki) process.exit(0);
if (rel.startsWith("..")) process.exit(0); // outside the repo

const run = spawnSync(process.execPath, [LINTER, resolve(file)], {
  encoding: "utf8",
  cwd: ROOT,
});

if (run.error) process.exit(0); // Never break the session over a broken hook.
if (run.status === 0) process.exit(0);

const report = [run.stdout, run.stderr].filter(Boolean).join("\n").trim();
console.error(
  `lesson-lint failed for ${rel}. Fix every ERROR before reporting this file as done. ` +
    `Rules: docs/style/ste-profile.md\n\n${report}`
);
process.exit(2);
