/**
 * Landing (lesson 0024): the wiring that writes an artifact to disk.
 *
 * `landTrace` reads one trace file and writes `<root>/<run>/`. It reads
 * the FILE, not the events a run held in memory, so the same function
 * serves a run that just ended and a process that died: the trace is on
 * disk either way, and nothing else is needed.
 *
 * Two rules keep a kill from leaving a torn artifact:
 *
 *   1. Every file is written to `<name>.tmp` and then renamed over the
 *      real name. A reader sees the old file or the new one, never half.
 *   2. artifact.json is written last. A reader opens only artifact.json,
 *      so a folder holding the cost report and no artifact.json reads as
 *      "not landed", and landing again from the trace completes it.
 *
 * Landing writes files under `root` and nothing else. It never commits,
 * pushes or touches a repository: Hermes OS Wave 1 does zero writeback.
 */
import * as fs from "node:fs";
import { basename, join, relative, sep } from "node:path";
import { parseTrace } from "../../07-tool-loop/src/trace.js";
import { admitArtifact, ARTIFACT_FILE, buildArtifact, COST_FILE, type Artifact, type ArtifactAdmission } from "./artifact.js";
import type { ModelPrice } from "./prices.js";

/** The two calls an atomic write makes. A test swaps them to die halfway. */
export interface AtomicFs {
  writeFileSync(path: string, text: string): void;
  renameSync(from: string, to: string): void;
}

const nodeFs: AtomicFs = {
  writeFileSync: (path, text) => fs.writeFileSync(path, text),
  renameSync: (from, to) => fs.renameSync(from, to),
};

/**
 * Write beside the target, then rename over it. Node documents that
 * rename overwrites an existing file. POSIX rename(2) also promises the
 * swap is atomic. Windows documents no such promise, so on this
 * machine the guarantee is the order of the two steps, not the swap.
 */
export function writeAtomic(path: string, text: string, io: AtomicFs = nodeFs): void {
  const temp = `${path}.tmp`;
  io.writeFileSync(temp, text);
  io.renameSync(temp, path);
}

/** How one file is written. The default is `writeAtomic`. */
export type FileWriter = (path: string, text: string) => void;

export type Landing = { ok: true; run: string; dir: string; artifact: Artifact } | { ok: false; reason: string };

/** The run's name is its trace file's name, without `.jsonl`. */
export function runName(tracePath: string): string {
  return basename(tracePath, ".jsonl");
}

export function landTrace(tracePath: string, root: string, price: ModelPrice, write: FileWriter = writeAtomic): Landing {
  // A run that died before its first event left no file. Say so, rather
  // than throw from inside a caller's `finally`.
  if (!fs.existsSync(tracePath)) return { ok: false, reason: `no trace file at ${tracePath}` };
  const lines = parseTrace(fs.readFileSync(tracePath, "utf8"));
  const refused = lines.find((l) => !l.ok);
  // An artifact built on a skipped line would disagree with the record
  // without saying why, so a refused line lands nothing.
  if (refused !== undefined && !refused.ok) return { ok: false, reason: `line ${refused.line}: ${refused.reason}` };
  const events = lines.flatMap((l) => (l.ok ? [l.event] : []));

  const run = runName(tracePath);
  const dir = join(root, run);
  // Stored with forward slashes, so the link reads the same on any machine.
  const link = relative(dir, tracePath).split(sep).join("/");
  const built = buildArtifact(run, events, price, link);
  if (!built.ok) return { ok: false, reason: built.reason };

  fs.mkdirSync(dir, { recursive: true });
  write(join(dir, COST_FILE), `${JSON.stringify(built.report, null, 2)}\n`);
  write(join(dir, ARTIFACT_FILE), `${JSON.stringify(built.artifact, null, 2)}\n`);
  return { ok: true, run, dir, artifact: built.artifact };
}

/** Opens artifact.json only. A folder without it has not landed. */
export function readArtifact(root: string, run: string): ArtifactAdmission {
  const path = join(root, run, ARTIFACT_FILE);
  if (!fs.existsSync(path)) return { ok: false, reason: `${run}: no ${ARTIFACT_FILE}, so the run has not landed` };
  let raw: unknown;
  try {
    raw = JSON.parse(fs.readFileSync(path, "utf8"));
  } catch {
    return { ok: false, reason: `${run}: ${ARTIFACT_FILE} is not JSON` };
  }
  return admitArtifact(raw);
}
