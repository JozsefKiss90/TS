/**
 * The six recorded runs, and how to read one back (lesson 0017).
 *
 * Exercise 07 wrote four trace files and exercise 11 wrote two, all against
 * the mock. They are read through parseTrace, the boundary lesson 0011
 * built: bytes on disk are untrusted even when this repo wrote them.
 * Shared by main.ts and the tests so the list lives once.
 */
import { readFileSync } from "node:fs";
import { parseTrace, type TraceEvent } from "../../07-tool-loop/src/trace.js";

export const RECORDINGS = [
  "../../07-tool-loop/traces/audit-atlas.jsonl",
  "../../07-tool-loop/traces/tight-budget.jsonl",
  "../../07-tool-loop/traces/tight-deadline.jsonl",
  "../../07-tool-loop/traces/tight-deadline-resume.jsonl",
  "../../11-evidence-in-the-loop/traces/audit-atlas-grounded.jsonl",
  "../../11-evidence-in-the-loop/traces/audit-atlas-bare.jsonl",
] as const;

/** The one recording that visits `grounded`, used to show a moved line refused. */
export const GROUNDED_RECORDING = RECORDINGS[4];

/** Reads one recording. A line the parse refuses is an error, not a skip. */
export function readRecording(path: string): TraceEvent[] {
  const lines = parseTrace(readFileSync(new URL(path, import.meta.url), "utf8"));
  return lines.map((line) => {
    if (!line.ok) throw new Error(`${path} line ${line.line}: ${line.reason}`);
    return line.event;
  });
}

/** The file name alone, for printing. */
export function recordingName(path: string): string {
  return path.split("/").pop() ?? path;
}
