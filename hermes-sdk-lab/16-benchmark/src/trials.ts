/**
 * Many trials per task (lesson 0026).
 *
 * One run of a task is one sample. A loop that passes once may fail the
 * next time the model answers differently. So every task runs n times,
 * trial i with seed i, and the scorecard reports two numbers:
 *
 *   passRate — passed trials over all trials: how often it works.
 *   passHatK — τ-bench's estimate that k trials in a row ALL pass:
 *              whether it can be trusted k times. At n = k it is 1 when
 *              every trial passed and 0 otherwise.
 *
 * Every trial's result depends on its seed and nothing else, so the
 * scorecard records the seed beside each failure, and rerunTrial runs it
 * again.
 */
import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { z } from "zod";
import { formatIssues } from "../../07-tool-loop/src/issues.js";
import { RunNameSchema } from "../../14-reliability/src/artifact.js";
import { writeAtomic } from "../../14-reliability/src/landing.js";
import type { ModelPrice } from "../../14-reliability/src/prices.js";
import { GraderNameSchema, type GoldenTask, type WeightedRecording } from "./golden-task.js";
import type { NamedLoop } from "./loop.js";
import { runOnce, variantsFor } from "./runner.js";
import { SeededFakeGateway, type Variant } from "./seeded-gateway.js";

export const TRIALS_FILE = "trials.json";

const Count = z.number().int().nonnegative();
const Share = z.number().min(0).max(1);

const TrialRunSchema = z.strictObject({
  seed: z.number().int().positive(),
  /** The recording the seed chose. */
  variant: z.string().min(1),
  pass: z.boolean(),
  /** The graders that failed on this trial. Empty when it passed. */
  failed: z.array(GraderNameSchema),
});
export type TrialRun = z.infer<typeof TrialRunSchema>;

/** Strict and clock-free, like lesson 0025's scorecard: the same seeds write the same bytes. */
export const TrialScorecardSchema = z.strictObject({
  loop: z.string().min(1),
  n: z.number().int().positive(),
  k: z.number().int().positive(),
  tasks: z.array(
    z.strictObject({
      id: RunNameSchema,
      passed: Count,
      passRate: Share,
      passHatK: Share,
      runs: z.array(TrialRunSchema),
    }),
  ),
});
export type TrialScorecard = z.infer<typeof TrialScorecardSchema>;

export function admitTrialScorecard(
  raw: unknown,
): { ok: true; scorecard: TrialScorecard } | { ok: false; reason: string } {
  const parsed = TrialScorecardSchema.safeParse(raw);
  return parsed.success ? { ok: true, scorecard: parsed.data } : { ok: false, reason: formatIssues(parsed.error).join("; ") };
}

/** n choose k, as a product of k fractions, so no factorial overflows. */
function choose(n: number, k: number): number {
  let result = 1;
  for (let i = 1; i <= k; i++) result *= (n - k + i) / i;
  return result;
}

/**
 * τ-bench (arXiv 2406.12045, §3): pass^k = C(c, k) / C(n, k) for one
 * task, where n trials ran and c passed. It is the chance that k trials
 * drawn from the n, without replacement, all passed.
 */
export function passHatK(n: number, c: number, k: number): number {
  if (!Number.isInteger(k) || k < 1 || k > n) throw new Error(`k must be between 1 and n (${n}), got ${k}`);
  if (!Number.isInteger(c) || c < 0 || c > n) throw new Error(`c must be between 0 and n (${n}), got ${c}`);
  return c < k ? 0 : choose(c, k) / choose(n, k);
}

/**
 * The first trial count n from which the running pass rate stays within
 * `band` of `target` up to the last trial. Null when the last rate is
 * still outside. It says when the verdict stopped moving in THIS series.
 */
export function settlePoint(passes: boolean[], target: number, band: number): number | null {
  let settled: number | null = null;
  let passed = 0;
  for (const [i, pass] of passes.entries()) {
    if (pass) passed++;
    const inside = Math.abs(passed / (i + 1) - target) <= band + 1e-9;
    if (!inside) settled = null;
    else settled ??= i + 1;
  }
  return settled;
}

/**
 * The pass rate the weights imply. A recording replays the same replies
 * every time, so all its trials pass or all fail. Once each recording has
 * run, the true rate is the passing recordings' weight over the total.
 * Null when a recording never ran, or when one both passed and failed.
 */
export function trueRate(weights: WeightedRecording[], runs: TrialRun[]): number | null {
  let passing = 0;
  for (const { recording, weight } of weights) {
    const results = new Set(runs.filter((r) => r.variant === recording).map((r) => r.pass));
    if (results.size !== 1) return null;
    if (results.has(true)) passing += weight;
  }
  return passing / weights.reduce((sum, w) => sum + w.weight, 0);
}

/** The run name of one trial: its trace file and its artifact folder. */
export const trialName = (task: GoldenTask, seed: number): string => `${task.id}-s${seed}`;

async function trial(
  task: GoldenTask,
  variants: Variant[],
  root: string,
  loop: NamedLoop,
  price: ModelPrice,
  seed: number,
): Promise<TrialRun> {
  const gateway = new SeededFakeGateway(variants, seed);
  const score = await runOnce(task, gateway, trialName(task, seed), root, loop, price);
  return {
    seed,
    variant: gateway.variant,
    pass: score.pass,
    failed: score.grades.filter((g) => !g.pass).map((g) => g.grader),
  };
}

/** One trial of one task, from its seed: the command a failed trial row points to. */
export async function rerunTrial(
  task: GoldenTask,
  taskFile: string,
  root: string,
  loop: NamedLoop,
  price: ModelPrice,
  seed: number,
): Promise<TrialRun> {
  mkdirSync(join(root, "traces"), { recursive: true });
  return trial(task, variantsFor(task, dirname(taskFile)), root, loop, price, seed);
}

/** Trials of one task on seeds first, first + 1, …, first + count − 1. The settle measurement uses it. */
export async function runSeries(
  task: GoldenTask,
  taskFile: string,
  root: string,
  loop: NamedLoop,
  price: ModelPrice,
  { first, count }: { first: number; count: number },
): Promise<TrialRun[]> {
  mkdirSync(join(root, "traces"), { recursive: true });
  const variants = variantsFor(task, dirname(taskFile));
  const runs: TrialRun[] = [];
  for (let seed = first; seed < first + count; seed++) runs.push(await trial(task, variants, root, loop, price, seed));
  return runs;
}

/**
 * Runs every task n times, trial i with seed i, and writes
 * `<root>/trials.json`. The seeds are 1 to n, so two runs with the same n
 * replay the same trials.
 */
export async function runTrials(
  tasks: GoldenTask[],
  taskFile: string,
  root: string,
  loop: NamedLoop,
  price: ModelPrice,
  { n, k }: { n: number; k: number },
): Promise<TrialScorecard> {
  if (!Number.isInteger(n) || n < 1) throw new Error(`n must be a whole number of 1 or more, got ${n}`);
  if (!Number.isInteger(k) || k < 1 || k > n) throw new Error(`k must be between 1 and n (${n}), got ${k}`);
  mkdirSync(join(root, "traces"), { recursive: true });
  const scored: TrialScorecard["tasks"] = [];
  for (const task of tasks) {
    // Read once per task, not once per trial: --settle runs 4,000 trials.
    const variants = variantsFor(task, dirname(taskFile));
    const runs: TrialRun[] = [];
    for (let seed = 1; seed <= n; seed++) runs.push(await trial(task, variants, root, loop, price, seed));
    const passed = runs.filter((r) => r.pass).length;
    scored.push({ id: task.id, passed, passRate: passed / n, passHatK: passHatK(n, passed, k), runs });
  }
  const scorecard = TrialScorecardSchema.parse({ loop: loop.name, n, k, tasks: scored });
  writeAtomic(join(root, TRIALS_FILE), `${JSON.stringify(scorecard, null, 2)}\n`);
  return scorecard;
}
