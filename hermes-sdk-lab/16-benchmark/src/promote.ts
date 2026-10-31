/**
 * Promotion (lesson 0027): the only way the baseline moves.
 *
 * The Hermes OS README says a promotion needs at least ten consecutive
 * clean runs plus a signed ADR. Here that rule guards the course's own
 * choice of baseline:
 *
 *   1. the ADR's status line says accepted, and the ADR names the
 *      benchmark's hash, so a signature covers one benchmark only;
 *   2. the candidate loop runs the whole benchmark `runs` times in a row,
 *      each run into a fresh folder;
 *   3. every run is clean: no regression against the current baseline,
 *      if there is one, and the same scorecard bytes as run 1.
 *
 * On a seeded fake, step 3's "same bytes" is what ten runs can show: the
 * harness repeats itself, and no state leaks from one run into the next.
 * It says nothing about a live model's pass^10.
 */
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { loadGoldenTasks } from "./golden-task.js";
import type { ModelPrice } from "../../14-reliability/src/prices.js";
import { AdrRefSchema, baselineFrom, benchmarkHash, type Baseline } from "./benchmark.js";
import { checkBenchmark, describeRefusal, gate } from "./gate.js";
import type { NamedLoop } from "./loop.js";
import { runTrials } from "./trials.js";

export const REQUIRED_CLEAN_RUNS = 10;

/** The ADR is signed when its status line says accepted and it names this benchmark's hash. */
export function adrIsAccepted(path: string, hash: string): { ok: true } | { ok: false; reason: string } {
  if (!existsSync(path)) return { ok: false, reason: `no ADR at ${path}` };
  const text = readFileSync(path, "utf8");
  if (!/^- \*\*Status:\*\* accepted\b/m.test(text)) return { ok: false, reason: `the ADR is not accepted: ${path}` };
  if (!text.includes(hash)) return { ok: false, reason: `the ADR does not name the benchmark hash ${hash}` };
  return { ok: true };
}

export interface PromoteOptions {
  taskFile: string;
  /** Each run writes <root>/run-<j>/. */
  root: string;
  loop: NamedLoop;
  price: ModelPrice;
  n: number;
  k: number;
  /** The ADR on disk. */
  adr: string;
  /** The same ADR as the baseline records it, relative to the repository root. */
  adrRef: string;
  benchmark: string;
  /** The baseline in force, or null for a new benchmark. */
  current: Baseline | null;
  runs: number;
}

export type PromoteResult =
  | { ok: true; cleanRuns: number; baseline: Baseline }
  | { ok: false; cleanRuns: number; reason: string };

export async function promote(o: PromoteOptions): Promise<PromoteResult> {
  if (!AdrRefSchema.safeParse(o.adrRef).success) {
    return { ok: false, cleanRuns: 0, reason: `the ADR must be named as docs/adr/NNNN-name.md, got ${o.adrRef}` };
  }
  const loaded = loadGoldenTasks(o.taskFile);
  if (!loaded.ok) return { ok: false, cleanRuns: 0, reason: `the task file is refused: ${loaded.reason}` };
  const hash = benchmarkHash(o.taskFile);
  const signed = adrIsAccepted(o.adr, hash);
  if (!signed.ok) return { ok: false, cleanRuns: 0, reason: signed.reason };
  const changed = o.current === null ? null : checkBenchmark(o.current, hash);
  if (changed !== null) {
    return { ok: false, cleanRuns: 0, reason: `${describeRefusal(changed)}; a new benchmark needs its own name and baseline file` };
  }

  let first: { bytes: string; baseline: Baseline } | null = null;
  for (let j = 1; j <= o.runs; j++) {
    const card = await runTrials(loaded.tasks, o.taskFile, join(o.root, `run-${j}`), o.loop, o.price, { n: o.n, k: o.k });
    if (o.current !== null) {
      const verdict = gate(o.current, { hash, card });
      if (!verdict.ok) {
        const [head] = verdict.refusals.map(describeRefusal);
        return { ok: false, cleanRuns: j - 1, reason: `run ${j}: ${verdict.refusals.length} refusals, first ${head}` };
      }
    }
    const bytes = JSON.stringify(card);
    if (first === null) first = { bytes, baseline: baselineFrom(card, o.benchmark, hash, o.adrRef) };
    else if (bytes !== first.bytes) {
      const now = baselineFrom(card, o.benchmark, hash, o.adrRef);
      const changed = now.tasks.filter((t, i) => JSON.stringify(t) !== JSON.stringify(first?.baseline.tasks[i])).map((t) => `${t.id} ${t.passed} of ${o.n}`);
      const which = changed.length > 0 ? changed.join(", ") : "the scorecard bytes";
      return { ok: false, cleanRuns: j - 1, reason: `run ${j} differs from run 1: ${which}` };
    }
  }
  if (first === null) return { ok: false, cleanRuns: 0, reason: "no runs" };
  return { ok: true, cleanRuns: o.runs, baseline: first.baseline };
}
