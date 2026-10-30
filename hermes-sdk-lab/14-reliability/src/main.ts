/**
 * Exercise 14 — what the run cost (lesson 0022).
 *
 * Lesson: ../../../lessons/0022-what-the-run-cost.html
 *
 *   pnpm job                              — all seven recorded runs, one report each
 *   pnpm job --cost-report <trace.jsonl>  — one trace file, priced as claude-opus-4-8
 *   pnpm job --cost-report <file> --model claude-opus-5-5
 *
 * Lesson 0024 adds landing:
 *
 *   pnpm job --land                       — all seven runs land under artifacts/<run>/
 *   pnpm job --land <trace.jsonl>         — one trace file lands
 *
 * No model, no mock, no network. Every number is read from a trace line or
 * computed from trace lines. The file is read through lab 07's parseTrace,
 * and a line it refuses stops the report: a bill built on a skipped line
 * would disagree with the record without saying why.
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { parseTrace } from "../../07-tool-loop/src/trace.js";
import { costReport } from "./cost-report.js";
import { DEFAULT_MODEL, isPricedModel, PRICES } from "./prices.js";
import { landTrace, type Landing } from "./landing.js";
import { formatReport } from "./print-report.js";
import { readRecording, recordingName, RECORDINGS } from "./recordings.js";

function usage(message: string): never {
  console.error(message);
  console.error("usage: pnpm job [--cost-report <trace.jsonl> | --land [trace.jsonl]] [--model <id>]");
  process.exit(2);
}

/** The value after a flag, or undefined when the flag is absent or bare. */
function valueAfter(args: string[], flag: string): string | undefined {
  const i = args.indexOf(flag);
  if (i === -1) return undefined;
  const value = args[i + 1];
  return value === undefined || value.startsWith("--") ? undefined : value;
}

function argAfter(args: string[], flag: string): string | undefined {
  if (!args.includes(flag)) return undefined;
  return valueAfter(args, flag) ?? usage(`${flag} needs a value`);
}

const args = process.argv.slice(2);
const model = argAfter(args, "--model") ?? DEFAULT_MODEL;
if (!isPricedModel(model)) usage(`no price for ${model}; known: ${Object.keys(PRICES).join(", ")}`);
const price = PRICES[model];
const file = argAfter(args, "--cost-report");

/** Where landing writes. Ignored by git, like traces/: landing never commits. */
const ARTIFACTS = fileURLToPath(new URL("../artifacts/", import.meta.url));
const LAB_12_SRC = new URL("../../12-workflow-graph/src/", import.meta.url);

function describeLanding(landing: Landing): string {
  if (!landing.ok) return `  refused: ${landing.reason}`;
  const a = landing.artifact;
  const output = a.output === null ? "no output" : `${a.output.text.length} chars${a.output.partial ? ", partial" : ""}`;
  return (
    `  ${a.status.padEnd(6)} ${String(a.outcome ?? "no job_ended").padEnd(12)} ${output.padEnd(18)} ` +
    `${a.totals.tokens} tokens, ${a.agrees ? "agrees" : "DISAGREES"}  ->  ${a.run}/`
  );
}

if (args.includes("--land")) {
  if (file !== undefined) usage("--land and --cost-report are separate commands");
  const one = valueAfter(args, "--land");
  const paths = one !== undefined ? [one] : RECORDINGS.map((p) => fileURLToPath(new URL(p, LAB_12_SRC)));
  console.log(`=== Landing into ${ARTIFACTS} ===`);
  let refused = 0;
  for (const path of paths) {
    const landing = landTrace(path, ARTIFACTS, price);
    if (!landing.ok) refused += 1;
    console.log(describeLanding(landing));
  }
  process.exit(refused === 0 ? 0 : 1);
}

if (file !== undefined) {
  const lines = parseTrace(readFileSync(file, "utf8"));
  const refused = lines.filter((l) => !l.ok);
  if (refused.length > 0) {
    for (const l of refused) if (!l.ok) console.error(`line ${l.line}: ${l.reason}`);
    process.exit(1);
  }
  const result = costReport(lines.flatMap((l) => (l.ok ? [l.event] : [])), price);
  if (!result.ok) usage(result.reason);
  console.log(formatReport(result.report).join("\n"));
  process.exit(result.report.agrees ? 0 : 1);
}

console.log("=== Seven recorded runs, priced from their traces ===");
for (const path of RECORDINGS) {
  const result = costReport(readRecording(path), price);
  console.log(`\n${recordingName(path)}`);
  console.log(result.ok ? formatReport(result.report).join("\n") : `refused: ${result.reason}`);
}
