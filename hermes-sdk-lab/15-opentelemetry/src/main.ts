/**
 * Exercise 15 — OpenTelemetry, evaluated (lesson 0023).
 *
 * Lesson: ../../../lessons/0023-opentelemetry-evaluated.html
 *
 *   pnpm job                       — all seven recorded runs through the exporter, compared with lab 14
 *   pnpm job --otlp <trace.jsonl>  — the OTLP/HTTP JSON body for one trace file, printed, not sent
 *
 * No model, no mock, no network. The spans are lab 14's, emitted with the
 * recorded times into an in-memory exporter and read back.
 */
import { readFileSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { isDeepStrictEqual } from "node:util";
import { parseTrace } from "../../07-tool-loop/src/trace.js";
import { costReport } from "../../14-reliability/src/cost-report.js";
import { DEFAULT_MODEL, PRICES } from "../../14-reliability/src/prices.js";
import { readRecording, recordingName, RECORDINGS } from "../../14-reliability/src/recordings.js";
import { exportRun } from "./export-run.js";
import { readBack } from "./read-back.js";
import { inMemoryTelemetry, otlpBody, otlpJson } from "./telemetry.js";

const price = PRICES[DEFAULT_MODEL];
/** Recording paths are relative to lab 12's src folder, where its readRecording resolves them. */
const LAB_12_SRC = fileURLToPath(new URL("../../12-workflow-graph/src/", import.meta.url));
const args = process.argv.slice(2);
const otlpAt = args.indexOf("--otlp");

if (otlpAt !== -1) {
  const file = args[otlpAt + 1];
  if (file === undefined) {
    console.error("usage: pnpm job [--otlp <trace.jsonl>]");
    process.exit(2);
  }
  const lines = parseTrace(readFileSync(file, "utf8"));
  const refused = lines.filter((l) => !l.ok);
  for (const l of refused) if (!l.ok) console.error(`line ${l.line}: ${l.reason}`);
  if (refused.length > 0) process.exit(1);

  const telemetry = inMemoryTelemetry();
  const result = exportRun(lines.flatMap((l) => (l.ok ? [l.event] : [])), price, telemetry.tracer);
  if (!result.ok) {
    console.error(result.reason);
    process.exit(1);
  }
  console.log(JSON.stringify(otlpJson(telemetry.exporter.getFinishedSpans()), null, 2));
  await telemetry.shutdown();
  process.exit(0);
}

console.log("=== Seven recorded runs, through OpenTelemetry and back ===");
let differ = 0;
for (const path of RECORDINGS) {
  const events = readRecording(path);
  const hand = costReport(events, price);
  const telemetry = inMemoryTelemetry();
  const result = exportRun(events, price, telemetry.tracer);
  const exported = telemetry.exporter.getFinishedSpans();
  const back = readBack(exported);
  await telemetry.shutdown();

  if (!hand.ok || !result.ok || !back.ok) {
    console.log(`\n${recordingName(path)}: refused`);
    differ += 1;
    continue;
  }
  const same = isDeepStrictEqual(back.spans, hand.report.spans);
  if (!same) differ += 1;
  const traceId = exported[0]?.spanContext().traceId ?? "-";
  const bytes = otlpBody(exported).byteLength;
  const traceBytes = statSync(`${LAB_12_SRC}${path}`).size;
  console.log(`\n${recordingName(path)}`);
  console.log(`  spans exported   ${exported.length} (1 job + ${hand.report.spans.length} ${hand.report.spans.length === 1 ? "step" : "steps"}), trace ${traceId}`);
  console.log(`  equal to lab 14  ${same ? "yes, field for field" : "NO"}`);
  console.log(`  OTLP JSON        ${bytes} bytes, from a ${traceBytes}-byte trace file`);
}
console.log(`\n${differ === 0 ? "all seven equal" : `${differ} differ`}`);
process.exit(differ === 0 ? 0 : 1);
