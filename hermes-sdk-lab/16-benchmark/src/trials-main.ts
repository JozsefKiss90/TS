/**
 * Exercise 16, part two — many trials per task (lesson 0026).
 *
 * Lesson: ../../../lessons/0026-many-runs-one-verdict.html
 *
 *   pnpm trials                          — every task in tasks/trials.json, n = 20, k = 4
 *   pnpm trials --n 40 --k 8             — other counts
 *   pnpm trials --rerun audit --seed 7   — one trial again, from its seed
 *   pnpm trials --settle                 — the measurement: when does the pass rate stop moving?
 *
 * The real loop only. Each trial lands under runs/trials/. The seeded fake
 * chooses among recordings, so every number is a measurement of the
 * harness at a failure rate written in the task file, never of a model.
 */
import { fileURLToPath } from "node:url";
import { DEFAULT_MODEL, PRICES } from "../../14-reliability/src/prices.js";
import { loadGoldenTasks, variantsOf, type GoldenTask } from "./golden-task.js";
import { REAL_LOOP } from "./loop.js";
import { passHatK, rerunTrial, runSeries, runTrials, settlePoint, trueRate, type TrialRun } from "./trials.js";

const TASK_FILE = fileURLToPath(new URL("../tasks/trials.json", import.meta.url));
const RUNS = fileURLToPath(new URL("../runs/trials", import.meta.url));
const PRICE = PRICES[DEFAULT_MODEL];

function usage(message: string): never {
  console.error(message);
  console.error("usage: pnpm trials [--n <count>] [--k <count>] | --rerun <task> --seed <seed> | --settle");
  process.exit(2);
}

function valueAfter(args: string[], flag: string): string | undefined {
  const i = args.indexOf(flag);
  return i === -1 ? undefined : args[i + 1];
}

function wholeNumber(args: string[], flag: string, fallback: number): number {
  const raw = valueAfter(args, flag);
  if (raw === undefined) return args.includes(flag) ? usage(`${flag} needs a number`) : fallback;
  const value = Number(raw);
  return Number.isSafeInteger(value) && value >= 1 ? value : usage(`${flag} needs a whole number of 1 or more, got ${raw}`);
}

const shortName = (variant: string): string => variant.split("/").at(-1) ?? variant;
const percent = (share: number): string => `${(share * 100).toFixed(1)}%`;

const printRun = (task: string, r: TrialRun): void =>
  console.log(`${r.pass ? "PASS" : "FAIL"} ${task} seed ${r.seed}  ${shortName(r.variant)}${r.pass ? "" : `  failed: ${r.failed.join(", ")}`}`);

/**
 * The measurement. Ten series of 400 trials of one task, each series on
 * its own seeds. The target is the pass rate the task file's weights
 * imply, so changing the weights changes the target too. For each series:
 * the trial count after which the running pass rate stays within 5 and
 * within 10 points of that target.
 */
async function settle(task: GoldenTask): Promise<void> {
  const SERIES = 10;
  const LENGTH = 400;
  const series: TrialRun[][] = [];
  for (let s = 0; s < SERIES; s++) {
    series.push(await runSeries(task, TASK_FILE, `${RUNS}/settle`, REAL_LOOP, PRICE, { first: s * LENGTH + 1, count: LENGTH }));
  }
  const all = series.flat();
  const weights = variantsOf(task);
  const target = trueRate(weights, all);
  if (target === null) usage(`${task.id}: a recording never ran, or both passed and failed, so there is no true rate`);
  console.log(
    `${task.id}: weights ${weights.map((w) => `${shortName(w.recording)} ${w.weight}`).join(", ")}; ` +
      `true pass rate ${percent(target)}. ${SERIES} series of ${LENGTH} trials.`,
  );
  for (const [s, runs] of series.entries()) {
    const passes = runs.map((r) => r.pass);
    const at = (n: number): string => percent(passes.slice(0, n).filter(Boolean).length / n);
    console.log(
      `series ${String(s + 1).padStart(2)} (seeds ${s * LENGTH + 1}-${(s + 1) * LENGTH}): ` +
        `rate at 10 ${at(10)}, 50 ${at(50)}, 100 ${at(100)}, 400 ${at(400)}; ` +
        `settles within 10 points at ${settlePoint(passes, target, 0.1) ?? "never"}, within 5 at ${settlePoint(passes, target, 0.05) ?? "never"}`,
    );
  }
  const passed = all.filter((r) => r.pass).length;
  console.log(`all ${all.length} trials: ${passed} passed, ${percent(passed / all.length)}`);
  for (const k of [1, 2, 4, 8]) {
    console.log(`pass^${k}: ${passHatK(all.length, passed, k).toFixed(3)} (${target.toFixed(3)}^${k} = ${(target ** k).toFixed(3)})`);
  }
}

const args = process.argv.slice(2);
const loaded = loadGoldenTasks(TASK_FILE);
if (!loaded.ok) usage(`the task file is refused: ${loaded.reason}`);
const find = (id: string): GoldenTask =>
  loaded.tasks.find((t) => t.id === id) ?? usage(`no task "${id}"; tasks: ${loaded.tasks.map((t) => t.id).join(", ")}`);

if (args.includes("--settle")) {
  await settle(find("audit"));
} else if (args.includes("--rerun")) {
  const id = valueAfter(args, "--rerun") ?? usage("--rerun needs a task id");
  if (!args.includes("--seed")) usage("--rerun needs --seed");
  const run = await rerunTrial(find(id), TASK_FILE, `${RUNS}/rerun`, REAL_LOOP, PRICE, wholeNumber(args, "--seed", 1));
  printRun(id, run);
  process.exit(run.pass ? 0 : 1);
} else {
  const n = wholeNumber(args, "--n", 20);
  const k = wholeNumber(args, "--k", 4);
  if (k > n) usage(`--k (${k}) cannot be larger than --n (${n})`);
  const card = await runTrials(loaded.tasks, TASK_FILE, RUNS, REAL_LOOP, PRICE, { n, k });
  for (const t of card.tasks) {
    console.log(`\n=== ${t.id}: ${t.passed} of ${card.n} trials pass; pass rate ${percent(t.passRate)}; pass^${card.k} ${t.passHatK.toFixed(3)} ===`);
    for (const r of t.runs.filter((x) => !x.pass)) printRun(t.id, r);
  }
}
