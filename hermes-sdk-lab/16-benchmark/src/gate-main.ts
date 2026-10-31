/**
 * Exercise 16, part three — the regression gate (lesson 0027).
 *
 * Lesson: ../../../lessons/0027-the-regression-gate.html
 *
 *   pnpm gate                                  — the real loop against the committed baseline
 *   pnpm gate --defect <name>                  — a planted defect instead
 *   pnpm gate --promote --adr docs/adr/<file>  — ten clean runs, then write the baseline
 *
 * The benchmark is tasks/benchmark-v1.json and every recording it names.
 * The baseline is baselines/benchmark-v1.json, committed. Exit 0 means the
 * gate passed, 1 that it refused, 2 a usage error. Every number measures
 * the harness on a seeded fake, never a model.
 */
import { writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { DEFAULT_MODEL, PRICES } from "../../14-reliability/src/prices.js";
import { AdrRefSchema, benchmarkHash, loadBaseline } from "./benchmark.js";
import { DEFECTS, isDefect } from "./defects.js";
import { checkBenchmark, describeRefusal, gate } from "./gate.js";
import { dropsThePackAfter, LEAK_LIMIT } from "./gate-defects.js";
import { loadGoldenTasks } from "./golden-task.js";
import { REAL_LOOP, type NamedLoop } from "./loop.js";
import { promote, REQUIRED_CLEAN_RUNS } from "./promote.js";
import { runTrials } from "./trials.js";

const BENCHMARK = "benchmark-v1";
const TASK_FILE = fileURLToPath(new URL(`../tasks/${BENCHMARK}.json`, import.meta.url));
const BASELINE_FILE = fileURLToPath(new URL(`../baselines/${BENCHMARK}.json`, import.meta.url));
const REPO_ROOT = fileURLToPath(new URL("../../../", import.meta.url));
const RUNS = fileURLToPath(new URL("../runs/gate", import.meta.url));
const PRICE = PRICES[DEFAULT_MODEL];
const LEAKY = `drops-the-pack-after-${LEAK_LIMIT}`;
const LOOP_NAMES = ["real", ...Object.keys(DEFECTS), LEAKY];

function usage(message: string): never {
  console.error(message);
  console.error(`usage: pnpm gate [--defect <${LOOP_NAMES.slice(1).join(" | ")}>] [--promote --adr docs/adr/<file>.md]`);
  process.exit(2);
}

function valueAfter(args: string[], flag: string): string | undefined {
  const i = args.indexOf(flag);
  return i === -1 ? undefined : args[i + 1];
}

function chooseLoop(args: string[]): NamedLoop {
  if (!args.includes("--defect")) return REAL_LOOP;
  const name = valueAfter(args, "--defect");
  if (name === LEAKY) return dropsThePackAfter(LEAK_LIMIT);
  if (name === undefined || !isDefect(name)) usage(`--defect needs one of: ${LOOP_NAMES.slice(1).join(", ")}`);
  return DEFECTS[name];
}

const args = process.argv.slice(2);
const loop = chooseLoop(args);
// Admit the task file before hashing it, so a broken file is a usage error, not a stack trace.
const loaded = loadGoldenTasks(TASK_FILE);
if (!loaded.ok) usage(`the task file is refused: ${loaded.reason}`);
const hash = benchmarkHash(TASK_FILE);
const current = loadBaseline(BASELINE_FILE);
console.log(`${BENCHMARK} ${hash}`);

if (args.includes("--promote")) {
  const adrRef = valueAfter(args, "--adr") ?? usage("--promote needs --adr docs/adr/<file>.md");
  if (!AdrRefSchema.safeParse(adrRef).success) usage(`--adr needs a path like docs/adr/0003-name.md, got ${adrRef}`);
  const result = await promote({
    taskFile: TASK_FILE,
    root: `${RUNS}/promote-${loop.name}`,
    loop,
    price: PRICE,
    n: current.ok ? current.baseline.n : 20,
    k: current.ok ? current.baseline.k : 4,
    adr: resolve(REPO_ROOT, adrRef),
    adrRef,
    benchmark: BENCHMARK,
    current: current.ok ? current.baseline : null,
    runs: REQUIRED_CLEAN_RUNS,
  });
  if (!result.ok) {
    console.log(`REFUSED promotion of ${loop.name} after ${result.cleanRuns} clean runs: ${result.reason}`);
    process.exit(1);
  }
  writeFileSync(BASELINE_FILE, `${JSON.stringify(result.baseline, null, 2)}\n`);
  console.log(`PROMOTED ${loop.name} after ${result.cleanRuns} clean runs; wrote baselines/${BENCHMARK}.json`);
  process.exit(0);
}

if (!current.ok) usage(`no committed baseline: ${current.reason}`);
const { baseline } = current;
const changed = checkBenchmark(baseline, hash);
if (changed !== null) {
  // Refused before any trial runs: a changed benchmark has no comparable score.
  console.log(`REFUSED ${loop.name}: ${describeRefusal(changed)}`);
  process.exit(1);
}
const card = await runTrials(loaded.tasks, TASK_FILE, `${RUNS}/${loop.name}`, loop, PRICE, { n: baseline.n, k: baseline.k });
const verdict = gate(baseline, { hash, card });
for (const t of card.tasks) console.log(`${t.id.padEnd(15)} ${String(t.passed).padStart(2)} of ${card.n}  pass^${card.k} ${t.passHatK.toFixed(3)}`);
if (verdict.ok) {
  console.log(`PASSED ${loop.name}: no trial fails that passed in the baseline`);
  for (const f of verdict.fixed) console.log(`  fixed: ${f.task} seed ${f.seed} ${f.grader} (the baseline moves only by promotion)`);
  process.exit(0);
}
console.log(`REFUSED ${loop.name}: ${verdict.refusals.length} regressions`);
const shown = verdict.refusals.slice(0, 3);
for (const r of shown) console.log(`  ${describeRefusal(r)}`);
if (verdict.refusals.length > shown.length) console.log(`  … and ${verdict.refusals.length - shown.length} more`);
process.exit(1);
