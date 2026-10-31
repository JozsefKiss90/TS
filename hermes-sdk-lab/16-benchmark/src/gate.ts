/**
 * The regression gate (lesson 0027): one pure function.
 *
 * It has the shape of lab 07's gateToolCall: it reads, answers, and runs
 * nothing. Its question: does the candidate fail any trial the baseline
 * passed? A regression is one (task, seed, grader) failure that the
 * baseline does not list. Comparing pass counts alone would miss a change
 * that fixes seed 4 and breaks seed 2.
 *
 * Seeds pick the recording, so the same seed replays the same trial on
 * both sides. A live model gives no such pairing; see the lesson footer.
 */
import type { Baseline } from "./benchmark.js";
import type { TrialScorecard } from "./trials.js";

export type Refusal =
  | { kind: "benchmark_changed"; baseline: string; candidate: string }
  | { kind: "counts_changed"; baseline: string; candidate: string }
  | { kind: "tasks_changed"; baseline: string[]; candidate: string[] }
  | { kind: "regression"; task: string; seed: number; grader: string };

/** A failure the baseline lists and the candidate no longer has. */
export interface Fixed {
  task: string;
  seed: number;
  grader: string;
}

export type GateVerdict = { ok: true; fixed: Fixed[] } | { ok: false; refusals: Refusal[] };

/** The first question every caller asks: is this the benchmark the baseline was measured on? */
export function checkBenchmark(baseline: Baseline, hash: string): Refusal | null {
  return hash === baseline.hash ? null : { kind: "benchmark_changed", baseline: baseline.hash, candidate: hash };
}

const key = (task: string, seed: number, grader: string): string => `${task}\u0000${seed}\u0000${grader}`;

export function gate(baseline: Baseline, candidate: { hash: string; card: TrialScorecard }): GateVerdict {
  // A different benchmark has no comparable score. Stop before any trial.
  const changed = checkBenchmark(baseline, candidate.hash);
  if (changed !== null) return { ok: false, refusals: [changed] };
  const { card } = candidate;
  if (card.n !== baseline.n || card.k !== baseline.k) {
    return {
      ok: false,
      refusals: [{ kind: "counts_changed", baseline: `n=${baseline.n} k=${baseline.k}`, candidate: `n=${card.n} k=${card.k}` }],
    };
  }
  const ids = { baseline: baseline.tasks.map((t) => t.id), candidate: card.tasks.map((t) => t.id) };
  if (ids.baseline.join("\n") !== ids.candidate.join("\n")) {
    return { ok: false, refusals: [{ kind: "tasks_changed", ...ids }] };
  }

  const before = new Set(baseline.tasks.flatMap((t) => t.failures.flatMap((f) => f.graders.map((g) => key(t.id, f.seed, g)))));
  const after = new Set<string>();
  const refusals: Refusal[] = [];
  for (const t of card.tasks) {
    for (const run of t.runs) {
      for (const grader of run.failed) {
        after.add(key(t.id, run.seed, grader));
        if (!before.has(key(t.id, run.seed, grader))) refusals.push({ kind: "regression", task: t.id, seed: run.seed, grader });
      }
    }
  }
  if (refusals.length > 0) return { ok: false, refusals };

  const fixed = baseline.tasks.flatMap((t) =>
    t.failures.flatMap((f) => f.graders.filter((g) => !after.has(key(t.id, f.seed, g))).map((grader) => ({ task: t.id, seed: f.seed, grader }))),
  );
  return { ok: true, fixed };
}

/** One line per refusal, for the terminal and for promote's reason. */
export function describeRefusal(r: Refusal): string {
  switch (r.kind) {
    case "benchmark_changed":
      return `benchmark changed: baseline ${r.baseline.slice(0, 19)}…, now ${r.candidate.slice(0, 19)}…`;
    case "counts_changed":
      return `trial counts changed: baseline ${r.baseline}, now ${r.candidate}`;
    case "tasks_changed":
      return `tasks changed: baseline [${r.baseline.join(", ")}], now [${r.candidate.join(", ")}]`;
    case "regression":
      return `regression: ${r.task} seed ${r.seed} fails ${r.grader}`;
  }
}
