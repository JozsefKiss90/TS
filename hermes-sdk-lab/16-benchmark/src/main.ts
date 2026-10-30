/**
 * Exercise 16 — golden tasks (lesson 0025).
 *
 * Lesson: ../../../lessons/0025-golden-tasks.html
 *
 *   pnpm bench                     — the real loop on every golden task
 *   pnpm bench --defect <name>     — one planted defect instead
 *   pnpm bench --all               — the real loop, then every defect
 *
 * Each run writes runs/<loop>/scorecard.json, with the traces and
 * artifacts beside it. No model and no network: the fake gateway replays
 * each task's recorded fixture. Every number is a measurement of the
 * harness, not of a model.
 */
import { fileURLToPath } from "node:url";
import { DEFAULT_MODEL, PRICES } from "../../14-reliability/src/prices.js";
import { DEFECTS, isDefect } from "./defects.js";
import { loadGoldenTasks } from "./golden-task.js";
import { REAL_LOOP, type NamedLoop } from "./loop.js";
import { runGolden, type Scorecard } from "./runner.js";

const TASK_FILE = fileURLToPath(new URL("../tasks/golden.json", import.meta.url));
const RUNS = fileURLToPath(new URL("../runs/", import.meta.url));

const DEFECT_NAMES = Object.keys(DEFECTS);

function usage(message: string): never {
  console.error(message);
  console.error(`usage: pnpm bench [--defect <${DEFECT_NAMES.join(" | ")}> | --all]`);
  process.exit(2);
}

function chooseLoops(args: string[]): NamedLoop[] {
  if (args.includes("--all")) return [REAL_LOOP, ...Object.values(DEFECTS)];
  const i = args.indexOf("--defect");
  if (i === -1) return [REAL_LOOP];
  const name = args[i + 1];
  if (name === undefined || !isDefect(name)) usage(`--defect needs one of: ${DEFECT_NAMES.join(", ")}`);
  return [DEFECTS[name]];
}

function print(card: Scorecard): void {
  console.log(`\n=== ${card.loop}: ${card.tasksPassed} of ${card.tasks.length} tasks pass, ${card.passed} of ${card.total} grades ===`);
  for (const t of card.tasks) {
    console.log(`${t.pass ? "PASS" : "FAIL"} ${t.id.padEnd(15)} ${String(t.status ?? "nothing landed").padEnd(7)}${t.crashed ? ` crashed: ${t.crashed}` : ""}`);
    for (const g of t.grades) console.log(`    ${g.pass ? "pass" : "FAIL"}  ${g.grader.padEnd(22)} ${g.why}`);
  }
}

const loaded = loadGoldenTasks(TASK_FILE);
if (!loaded.ok) usage(`the task file is refused: ${loaded.reason}`);

let failed = 0;
for (const loop of chooseLoops(process.argv.slice(2))) {
  const card = await runGolden(loaded.tasks, TASK_FILE, `${RUNS}${loop.name}`, loop, PRICES[DEFAULT_MODEL]);
  print(card);
  failed += card.total - card.passed;
}
process.exit(failed === 0 ? 0 : 1);
