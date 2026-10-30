/**
 * The seven recorded runs (lesson 0022).
 *
 * Lab 12's six recordings, plus the parked audit that lesson 0019's parts
 * g to j wrote into lab 12's traces folder. Read through lab 12's
 * readRecording, which parses every line with lab 07's parseTrace: bytes
 * on disk are untrusted even when this repo wrote them.
 */
import { RECORDINGS as LAB_12_RECORDINGS, readRecording } from "../../12-workflow-graph/src/recordings.js";
import type { TraceEvent } from "../../07-tool-loop/src/trace.js";

/** Paths are relative to lab 12's src folder, where readRecording resolves them. */
export const RECORDINGS = [...LAB_12_RECORDINGS, "../traces/parked-audit.jsonl"] as const;

export { readRecording, recordingName } from "../../12-workflow-graph/src/recordings.js";

/** Finds a recording by its file name, so a test names the run it means. */
export function recording(name: string): TraceEvent[] {
  const path = RECORDINGS.find((p) => p.endsWith(`/${name}`));
  if (path === undefined) throw new Error(`no recording named ${name}`);
  return readRecording(path);
}
