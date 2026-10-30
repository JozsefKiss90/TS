/**
 * Many trials per task (lesson 0026), written before the code.
 *
 * Four seams. `pickVariant` turns a seed into a choice among weighted
 * recordings. `SeededFakeGateway` is a ModelGateway that replays the
 * recording its seed chose. `passHatK` is τ-bench's estimator. `runTrials`
 * runs every task n times and writes one scorecard; `rerunTrial` runs one
 * trial again from its seed.
 *
 * The rule the suite enforces: a trial's result depends on its seed and
 * nothing else, so any failure can be run again and watched.
 */
import { mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { PRICES } from "../../14-reliability/src/prices.js";
import { fixtureFromTrace } from "../src/fixture.js";
import { admitGoldenTasks, loadGoldenTasks, type GoldenTask } from "../src/golden-task.js";
import { REAL_LOOP } from "../src/loop.js";
import { pickVariant, SeededFakeGateway } from "../src/seeded-gateway.js";
import { recording } from "../../14-reliability/src/recordings.js";
import {
  admitTrialScorecard,
  passHatK,
  rerunTrial,
  runTrials,
  settlePoint,
  TRIALS_FILE,
  trueRate,
  type TrialRun,
} from "../src/trials.js";

const OPUS = PRICES["claude-opus-4-8"];
const TRIAL_TASKS = fileURLToPath(new URL("../tasks/trials.json", import.meta.url));
const GOLDEN = fileURLToPath(new URL("../tasks/golden.json", import.meta.url));
const freshRoot = (): string => mkdtempSync(join(tmpdir(), "lab16-trials-"));

function load(path: string): GoldenTask[] {
  const loaded = loadGoldenTasks(path);
  if (!loaded.ok) throw new Error(loaded.reason);
  return loaded.tasks;
}
const trialTask = (id: string): GoldenTask => {
  const found = load(TRIAL_TASKS).find((t) => t.id === id);
  if (found === undefined) throw new Error(`no task ${id}`);
  return found;
};

describe("pickVariant: a seed chooses one recording, the same one every time", () => {
  it("returns the same index for the same seed", () => {
    for (const seed of [1, 2, 17, 4096]) expect(pickVariant([9, 1], seed)).toBe(pickVariant([9, 1], seed));
  });

  it("follows the weights over many seeds", () => {
    const rare = Array.from({ length: 1000 }, (_, i) => pickVariant([9, 1], i + 1)).filter((v) => v === 1).length;
    expect(rare).toBeGreaterThan(70);
    expect(rare).toBeLessThan(130);
  });

  it("always picks the only variant there is", () => {
    for (let seed = 1; seed <= 20; seed++) expect(pickVariant([1], seed)).toBe(0);
  });

  it("refuses no weights, a weight below one, and a seed that is not a whole number", () => {
    expect(() => pickVariant([], 1)).toThrow(/weight/);
    expect(() => pickVariant([9, 0], 1)).toThrow(/weight/);
    expect(() => pickVariant([9, 1], 1.5)).toThrow(/seed/);
  });
});

describe("SeededFakeGateway: a ModelGateway that replays the recording its seed chose", () => {
  const variants = [
    { recording: "audit-atlas.jsonl", weight: 9, script: fixtureFromTrace(recording("audit-atlas.jsonl")) },
    { recording: "parked-audit.jsonl", weight: 1, script: fixtureFromTrace(recording("parked-audit.jsonl")) },
  ];

  it("names the variant it chose, and replays that variant's replies", async () => {
    for (let seed = 1; seed <= 30; seed++) {
      const gateway = new SeededFakeGateway(variants, seed);
      const chosen = variants[pickVariant([9, 1], seed)];
      expect(gateway.variant).toBe(chosen?.recording);
      const first = await gateway.complete({ transcript: [], maxTokens: 100, tools: [] });
      expect(first).toEqual(chosen?.script[0]);
    }
  });
});

describe("the task file: a fixture may be a list of weighted recordings", () => {
  it("admits the trials file: an audit that fails one time in ten, and a task with one recording", () => {
    const tasks = load(TRIAL_TASKS);
    expect(tasks.map((t) => t.id)).toEqual(["audit", "grounded-audit"]);
    expect(trialTask("audit").fixture).toEqual([
      { recording: "../../07-tool-loop/traces/audit-atlas.jsonl", weight: 9 },
      { recording: "../../12-workflow-graph/traces/parked-audit.jsonl", weight: 1 },
    ]);
  });

  it("still admits lesson 0025's file, where every fixture is one path", () => {
    expect(load(GOLDEN)).toHaveLength(4);
  });

  it("refuses a weight of zero and a list of one recording", () => {
    const file = JSON.parse(readFileSync(TRIAL_TASKS, "utf8")) as { tasks: Record<string, unknown>[] };
    const audit = file.tasks[0] as { fixture: { recording: string; weight: number }[] };
    const zero = { tasks: [{ ...audit, fixture: [audit.fixture[0], { ...audit.fixture[1], weight: 0 }] }] };
    const one = { tasks: [{ ...audit, fixture: [audit.fixture[0]] }] };
    for (const bad of [zero, one]) {
      const admission = admitGoldenTasks(bad);
      expect(admission.ok).toBe(false);
      expect(!admission.ok && admission.reason).toMatch(/fixture/);
    }
  });
});

describe("passHatK: τ-bench's estimate that all k trials pass", () => {
  it("is 1 when every trial passed, and 0 when fewer than k passed", () => {
    expect(passHatK(4, 4, 4)).toBe(1);
    expect(passHatK(4, 3, 4)).toBe(0);
    expect(passHatK(10, 3, 4)).toBe(0);
  });

  it("is the pass rate at k = 1, and falls as k grows", () => {
    expect(passHatK(10, 9, 1)).toBeCloseTo(0.9);
    expect(passHatK(10, 9, 2)).toBeCloseTo(36 / 45);
    expect(passHatK(10, 9, 8)).toBeCloseTo(9 / 45);
  });

  it("refuses k larger than n, and c larger than n", () => {
    expect(() => passHatK(3, 3, 4)).toThrow(/k/);
    expect(() => passHatK(3, 4, 1)).toThrow(/c/);
  });
});

describe("settlePoint: the trial count after which the pass rate stays in its band", () => {
  it("returns the first n from which every running rate stays within the band", () => {
    // Running rates: 0, .5, .667, .75, .8, .833, .857, .875
    const passes = [false, true, true, true, true, true, true, true];
    expect(settlePoint(passes, 0.85, 0.05)).toBe(5);
  });

  it("starts again when the rate leaves the band after entering it", () => {
    // Running rates: 0, .5, .333, .5, .6. In at 2, out at 3, in from 4.
    expect(settlePoint([false, true, false, true, true], 0.5, 0.1)).toBe(4);
  });

  it("returns null when the last rate is still outside the band", () => {
    expect(settlePoint([true, true, true, true], 0.5, 0.1)).toBeNull();
  });
});

describe("trueRate: the pass rate the weights imply, once each recording's result is known", () => {
  const weights = [
    { recording: "a.jsonl", weight: 9 },
    { recording: "b.jsonl", weight: 1 },
  ];
  const run = (variant: string, pass: boolean): TrialRun => ({ seed: 1, variant, pass, failed: [] });

  it("adds the weights of the recordings that pass", () => {
    expect(trueRate(weights, [run("a.jsonl", true), run("b.jsonl", false), run("a.jsonl", true)])).toBeCloseTo(0.9);
    expect(trueRate([{ recording: "a.jsonl", weight: 3 }, { recording: "b.jsonl", weight: 1 }], [run("a.jsonl", true), run("b.jsonl", false)])).toBeCloseTo(0.75);
  });

  it("is null when a recording never ran, or both passed and failed", () => {
    expect(trueRate(weights, [run("a.jsonl", true)])).toBeNull();
    expect(trueRate(weights, [run("a.jsonl", true), run("a.jsonl", false), run("b.jsonl", false)])).toBeNull();
  });
});

describe("runTrials: every task, n times, one scorecard", () => {
  it("a parked-audit trial fails reports_tool_output and nothing else; the rest pass", async () => {
    const card = await runTrials(load(TRIAL_TASKS), TRIAL_TASKS, freshRoot(), REAL_LOOP, OPUS, { n: 20, k: 4 });
    const audit = card.tasks.find((t) => t.id === "audit");
    expect(audit?.runs).toHaveLength(20);
    expect(audit?.runs.map((r) => r.seed)).toEqual(Array.from({ length: 20 }, (_, i) => i + 1));
    for (const run of audit?.runs ?? []) {
      expect(run.failed).toEqual(run.variant.endsWith("parked-audit.jsonl") ? ["reports_tool_output"] : []);
      expect(run.pass).toBe(run.failed.length === 0);
    }
    const passed = audit?.runs.filter((r) => r.pass).length ?? 0;
    expect(audit).toMatchObject({ passed, passRate: passed / 20, passHatK: passHatK(20, passed, 4) });
  });

  it("a task with one recording gives the same result on every trial", async () => {
    const card = await runTrials(load(TRIAL_TASKS), TRIAL_TASKS, freshRoot(), REAL_LOOP, OPUS, { n: 8, k: 8 });
    const grounded = card.tasks.find((t) => t.id === "grounded-audit");
    expect(new Set(grounded?.runs.map((r) => r.variant)).size).toBe(1);
    expect(grounded).toMatchObject({ passed: 8, passRate: 1, passHatK: 1 });
  });

  it("writes a strict, clock-free scorecard, the same bytes on a second run", async () => {
    const root = freshRoot();
    const card = await runTrials(load(TRIAL_TASKS), TRIAL_TASKS, root, REAL_LOOP, OPUS, { n: 6, k: 2 });
    const first = readFileSync(join(root, TRIALS_FILE), "utf8");
    const admitted = admitTrialScorecard(JSON.parse(first));
    expect(admitted.ok && admitted.scorecard).toEqual(card);
    await runTrials(load(TRIAL_TASKS), TRIAL_TASKS, root, REAL_LOOP, OPUS, { n: 6, k: 2 });
    expect(readFileSync(join(root, TRIALS_FILE), "utf8")).toBe(first);
  });

  it("refuses k larger than n before any trial runs", async () => {
    await expect(runTrials(load(TRIAL_TASKS), TRIAL_TASKS, freshRoot(), REAL_LOOP, OPUS, { n: 2, k: 4 })).rejects.toThrow(/k/);
  });
});

/** A trace with its clock removed: what a rerun must reproduce. */
const withoutClock = (path: string): unknown[] =>
  readFileSync(path, "utf8")
    .trim()
    .split("\n")
    .map((l) => {
      const { at: _clock, ...rest } = JSON.parse(l) as Record<string, unknown>;
      return rest;
    });

describe("rerunTrial: a failed trial runs again from its seed", () => {
  it("chooses the same recording, fails the same grade, and writes the same trace", async () => {
    const first = freshRoot();
    const card = await runTrials(load(TRIAL_TASKS), TRIAL_TASKS, first, REAL_LOOP, OPUS, { n: 20, k: 4 });
    const failed = card.tasks.find((t) => t.id === "audit")?.runs.find((r) => !r.pass);
    if (failed === undefined) throw new Error("seeds 1 to 20 hold no failed audit trial");

    const again = freshRoot();
    const rerun = await rerunTrial(trialTask("audit"), TRIAL_TASKS, again, REAL_LOOP, OPUS, failed.seed);
    expect(rerun).toEqual(failed);
    const name = `audit-s${failed.seed}.jsonl`;
    expect(withoutClock(join(again, "traces", name))).toEqual(withoutClock(join(first, "traces", name)));
  });
});
