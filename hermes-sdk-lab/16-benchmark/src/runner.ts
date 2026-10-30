/**
 * The runner (lesson 0025): every golden task, once, offline.
 *
 * For each task it builds a fake gateway from the task's recorded
 * fixture, runs the loop it was given through lab 14's runAndLand, reads
 * the landed artifact and the trace back from disk, and asks each named
 * grader for a verdict. Then it writes one scorecard.
 *
 * The graders see only what landed. If the loop crashed, the artifact
 * says failed and the scorecard names the crash; the run still counts.
 */
import { existsSync, mkdirSync, readFileSync, rmSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { z } from "zod";
import type { ApprovalPort } from "../../07-tool-loop/src/approval.js";
import type { ModelGateway } from "../../07-tool-loop/src/gateway.js";
import { formatIssues } from "../../07-tool-loop/src/issues.js";
import { parseTrace, type TraceEvent } from "../../07-tool-loop/src/trace.js";
import { RunNameSchema } from "../../14-reliability/src/artifact.js";
import { readArtifact, writeAtomic } from "../../14-reliability/src/landing.js";
import type { ModelPrice } from "../../14-reliability/src/prices.js";
import { runAndLand } from "../../14-reliability/src/run-and-land.js";
import { fixtureFromTrace } from "./fixture.js";
import { GraderNameSchema, variantsOf, type GoldenTask } from "./golden-task.js";
import { GRADERS } from "./graders.js";
import type { NamedLoop } from "./loop.js";
import { SeededFakeGateway, type Variant } from "./seeded-gateway.js";

export const SCORECARD_FILE = "scorecard.json";

/**
 * Strict, and with no clock in it: the same loop on the same tasks writes
 * the same bytes, so two scorecards can be compared with a diff.
 */
export const ScorecardSchema = z.strictObject({
  loop: z.string().min(1),
  tasks: z.array(
    z.strictObject({
      id: RunNameSchema,
      /** The artifact's status. Null when nothing landed. */
      status: z.enum(["done", "failed"]).nullable(),
      /** The error the loop threw, or null. */
      crashed: z.string().nullable(),
      /** True only when every grade passes. One passing grade proves nothing about the task. */
      pass: z.boolean(),
      grades: z.array(z.strictObject({ grader: GraderNameSchema, pass: z.boolean(), why: z.string() })),
    }),
  ),
  /** Grades that passed, of all grades. */
  passed: z.number().int().nonnegative(),
  total: z.number().int().nonnegative(),
  /** Tasks whose every grade passed, of all tasks. */
  tasksPassed: z.number().int().nonnegative(),
});

export type Scorecard = z.infer<typeof ScorecardSchema>;
export type TaskScore = Scorecard["tasks"][number];

export function admitScorecard(raw: unknown): { ok: true; scorecard: Scorecard } | { ok: false; reason: string } {
  const parsed = ScorecardSchema.safeParse(raw);
  return parsed.success ? { ok: true, scorecard: parsed.data } : { ok: false, reason: formatIssues(parsed.error).join("; ") };
}

/** Reads a trace file through lab 07's parse. A refused line is an error, never skipped. */
export function readEvents(path: string): TraceEvent[] {
  const lines = parseTrace(readFileSync(path, "utf8"));
  return lines.map((l) => {
    if (!l.ok) throw new Error(`${path} line ${l.line}: ${l.reason}`);
    return l.event;
  });
}

const operatorFor = (task: GoldenTask): ApprovalPort | undefined =>
  task.operator === undefined
    ? undefined
    : { decide: () => Promise.resolve(task.operator === "approves" ? "approved" : "denied") };

/**
 * A task's recordings, read and turned into scripts once (lesson 0026).
 * A seed then picks one per trial. A task with one recording has one variant.
 */
export function variantsFor(task: GoldenTask, taskDir: string): Variant[] {
  return variantsOf(task).map((v) => ({
    recording: v.recording,
    weight: v.weight,
    script: fixtureFromTrace(readEvents(resolve(taskDir, v.recording))),
  }));
}

/**
 * One run of one task: run it, land it, read it back, grade it.
 * `run` names the trace file and the artifact folder, so trials of one
 * task (lesson 0026) do not overwrite each other.
 */
export async function runOnce(
  task: GoldenTask,
  gateway: ModelGateway,
  run: string,
  root: string,
  loop: NamedLoop,
  price: ModelPrice,
): Promise<TaskScore> {
  const tracePath = join(root, "traces", `${run}.jsonl`);
  // The trace sink appends, so an old file would join two runs into one record.
  rmSync(tracePath, { force: true });
  const approver = operatorFor(task);
  let crashed: string | null = null;
  try {
    await runAndLand(tracePath, join(root, "artifacts"), price, (trace) =>
      loop.run(task.spec, gateway, {
        trace,
        ...(approver ? { approver } : {}),
        ...(task.pack ? { pack: task.pack } : {}),
      }),
    );
  } catch (error) {
    crashed = error instanceof Error ? error.message : String(error);
  }

  const read = readArtifact(join(root, "artifacts"), run);
  if (!read.ok || !existsSync(tracePath)) {
    const why = read.ok ? "no trace file" : read.reason;
    return { id: task.id, status: null, crashed, pass: false, grades: task.graders.map((grader) => ({ grader, pass: false, why })) };
  }
  const seen = { task, artifact: read.artifact, events: readEvents(tracePath) };
  const grades = task.graders.map((grader) => ({ grader, ...GRADERS[grader](seen) }));
  return { id: task.id, status: read.artifact.status, crashed, pass: grades.every((g) => g.pass), grades };
}

/**
 * Runs every task in order and writes `<root>/scorecard.json`.
 * `taskFile` is the path the tasks came from: fixtures resolve against it.
 */
export async function runGolden(
  tasks: GoldenTask[],
  taskFile: string,
  root: string,
  loop: NamedLoop,
  price: ModelPrice,
): Promise<Scorecard> {
  mkdirSync(join(root, "traces"), { recursive: true });
  const scores: TaskScore[] = [];
  // One at a time, so the scorecard keeps the order of the file. Seed 1
  // for every task: lesson 0025's tasks have one recording each, so the
  // seed changes nothing. Lesson 0026's runTrials varies it.
  for (const task of tasks) {
    const gateway = new SeededFakeGateway(variantsFor(task, dirname(taskFile)), 1);
    scores.push(await runOnce(task, gateway, task.id, root, loop, price));
  }
  const grades = scores.flatMap((s) => s.grades);
  const scorecard = ScorecardSchema.parse({
    loop: loop.name,
    tasks: scores,
    passed: grades.filter((g) => g.pass).length,
    total: grades.length,
    tasksPassed: scores.filter((s) => s.pass).length,
  });
  writeAtomic(join(root, SCORECARD_FILE), `${JSON.stringify(scorecard, null, 2)}\n`);
  return scorecard;
}
