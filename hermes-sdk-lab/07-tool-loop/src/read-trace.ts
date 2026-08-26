/**
 * CLI: `pnpm trace <file>` — read a trace file and print its story.
 *
 * This is the diagnosis tool: it needs the file and nothing else. No mock,
 * no gateway, no spec — a trace is self-contained, which is the point.
 */
import { readFileSync } from "node:fs";
import { printTraceStory } from "./trace-story.js";

const file = process.argv[2];

if (file === undefined) {
  console.error("usage: pnpm trace <path-to-trace.jsonl>");
  process.exitCode = 1;
} else {
  printTraceStory(readFileSync(file, "utf8"));
}
