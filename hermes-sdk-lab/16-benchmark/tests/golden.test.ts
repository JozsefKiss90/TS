/**
 * Golden tasks (lesson 0025), written before the code.
 *
 * Four seams. `admitGoldenTasks` is the parse a task file must pass.
 * `fixtureFromTrace` turns a recorded trace into the replies the fake
 * gateway plays back. The graders are pure: an artifact, a trace and the
 * task in, a verdict out. `runGolden` runs every task through a loop,
 * lands each run, grades it and writes a scorecard.
 *
 * The rule the suite enforces: a planted defect drops a named grader on
 * a named task, and nothing else.
 */
import { existsSync, mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { recording } from "../../14-reliability/src/recordings.js";
import { buildArtifact, type Artifact } from "../../14-reliability/src/artifact.js";
import { PRICES } from "../../14-reliability/src/prices.js";
import type { TraceEvent } from "../../07-tool-loop/src/trace.js";
import { DEFECTS } from "../src/defects.js";
import { fixtureFromTrace } from "../src/fixture.js";
import { admitGoldenTasks, loadGoldenTasks, type GoldenTask } from "../src/golden-task.js";
import { GRADERS } from "../src/graders.js";
import { REAL_LOOP, type NamedLoop } from "../src/loop.js";
import { admitScorecard, runGolden, SCORECARD_FILE, type Scorecard } from "../src/runner.js";

const OPUS = PRICES["claude-opus-4-8"];
const TASK_FILE = fileURLToPath(new URL("../tasks/golden.json", import.meta.url));
const raw = (): { tasks: Record<string, unknown>[] } =>
  JSON.parse(readFileSync(TASK_FILE, "utf8")) as { tasks: Record<string, unknown>[] };

function shipped(): GoldenTask[] {
  const loaded = loadGoldenTasks(TASK_FILE);
  if (!loaded.ok) throw new Error(loaded.reason);
  return loaded.tasks;
}
const task = (id: string): GoldenTask => {
  const found = shipped().find((t) => t.id === id);
  if (found === undefined) throw new Error(`no task ${id}`);
  return found;
};
function artifactOf(name: string, events: TraceEvent[]): Artifact {
  const built = buildArtifact(name, events, OPUS, "t");
  if (!built.ok) throw new Error(built.reason);
  return built.artifact;
}
const freshRoot = (): string => mkdtempSync(join(tmpdir(), "lab16-"));

/** A copy of the shipped file with one task changed. */
function withTask(id: string, change: (t: Record<string, unknown>) => Record<string, unknown>): unknown {
  const file = raw();
  return { tasks: file.tasks.map((t) => (t["id"] === id ? change({ ...t }) : t)) };
}
function refused(input: unknown): string {
  const admission = admitGoldenTasks(input);
  if (admission.ok) throw new Error("expected a refusal");
  return admission.reason;
}

describe("admitGoldenTasks: a task file is parsed, never trusted", () => {
  it("admits the shipped file: four tasks, each with its graders", () => {
    const tasks = shipped();
    expect(tasks.map((t) => t.id)).toEqual(["audit", "held-audit", "capped-audit", "grounded-audit"]);
    expect(tasks.reduce((n, t) => n + t.graders.length, 0)).toBe(13);
    // The spec inside a task went through the TaskSpec parse: defaults are filled.
    expect(task("audit").spec.maxModelCalls).toBe(4);
  });

  it("refuses a grader name no function implements", () => {
    expect(refused(withTask("audit", (t) => ({ ...t, graders: ["looks_good"] })))).toMatch(/graders/);
  });

  it("refuses a spec the TaskSpec parse refuses", () => {
    const bad = withTask("audit", (t) => ({ ...t, spec: { ...(t["spec"] as object), maxTokens: 4000 } }));
    expect(refused(bad)).toMatch(/maxTokens/);
  });

  it("refuses two tasks with one id", () => {
    const file = raw();
    expect(refused({ tasks: [...file.tasks, file.tasks[0]] })).toMatch(/id/);
  });

  it("refuses a key it does not know", () => {
    expect(refused(withTask("audit", (t) => ({ ...t, weight: 2 })))).toMatch(/weight/);
  });

  it("refuses asks_before_held_tool on a task that holds no tool", () => {
    const bad = withTask("audit", (t) => ({ ...t, graders: ["asks_before_held_tool"] }));
    expect(refused(bad)).toMatch(/holds no tool/);
  });

  it("refuses a held tool with no operator answer, and an operator with nothing held", () => {
    expect(refused(withTask("held-audit", (t) => ({ ...t, operator: undefined })))).toMatch(/operator/);
    expect(refused(withTask("audit", (t) => ({ ...t, operator: "approves" })))).toMatch(/operator/);
  });

  it("refuses uses_the_pack without a pack, and a pack that answers other queries", () => {
    expect(refused(withTask("grounded-audit", (t) => ({ ...t, pack: undefined })))).toMatch(/pack/);
    const other = withTask("grounded-audit", (t) => ({
      ...t,
      pack: { ...(t["pack"] as object), queries: ["supervisor"] },
    }));
    expect(refused(other)).toMatch(/pack/);
  });
});

describe("fixtureFromTrace: the replies a recorded run received", () => {
  it("turns each reply line into one scripted gateway result, in order", () => {
    const fixture = fixtureFromTrace(recording("audit-atlas.jsonl"));
    expect(fixture).toHaveLength(2);
    expect(fixture[0]).toEqual({
      ok: true,
      reply: {
        text: "I need the graph health report first.",
        calls: [{ id: "toolu_mock_0003", name: "graph_health", input: { graph: "atlas" } }],
        stop: "wants_tool",
        usage: { inputTokens: 23, outputTokens: 42 },
        requestId: "req_mock_0003",
      },
    });
    expect(fixture[1]?.ok && fixture[1].reply.stop).toBe("completed");
  });

  it("takes nothing but reply lines", () => {
    const fixture = fixtureFromTrace(recording("audit-atlas-grounded.jsonl"));
    expect(fixture).toHaveLength(2);
  });
});

describe("the graders read the artifact, the trace and the task", () => {
  const atlas = recording("audit-atlas.jsonl");

  it("ends_as_expected compares status and outcome with the task's expectation", () => {
    expect(GRADERS.ends_as_expected({ task: task("audit"), artifact: artifactOf("a", atlas), events: atlas }).pass).toBe(true);
    const verdict = GRADERS.ends_as_expected({ task: task("capped-audit"), artifact: artifactOf("a", atlas), events: atlas });
    expect(verdict.pass).toBe(false);
    expect(verdict.why).toMatch(/gave_up/);
  });

  it("reports_tool_output wants every tool result's text in the output", () => {
    expect(GRADERS.reports_tool_output({ task: task("audit"), artifact: artifactOf("a", atlas), events: atlas }).pass).toBe(true);
    // The parked audit's answer is "Audit complete." and drops the tool's numbers.
    const parked = recording("parked-audit.jsonl");
    const verdict = GRADERS.reports_tool_output({ task: task("audit"), artifact: artifactOf("p", parked), events: parked });
    expect(verdict.pass).toBe(false);
    expect(verdict.why).toMatch(/orphans=3/);
  });

  it("asks_before_held_tool wants an approval before every held tool result", () => {
    const parked = recording("parked-audit.jsonl");
    expect(
      GRADERS.asks_before_held_tool({ task: task("held-audit"), artifact: artifactOf("p", parked), events: parked }).pass,
    ).toBe(true);
    const verdict = GRADERS.asks_before_held_tool({ task: task("held-audit"), artifact: artifactOf("a", atlas), events: atlas });
    expect(verdict.pass).toBe(false);
    expect(verdict.why).toMatch(/graph_health/);
  });

  it("uses_the_pack wants the task's pack recorded before the first call", () => {
    const grounded = recording("audit-atlas-grounded.jsonl");
    expect(
      GRADERS.uses_the_pack({ task: task("grounded-audit"), artifact: artifactOf("g", grounded), events: grounded }).pass,
    ).toBe(true);
    const bare = recording("audit-atlas-bare.jsonl");
    expect(GRADERS.uses_the_pack({ task: task("grounded-audit"), artifact: artifactOf("b", bare), events: bare }).pass).toBe(false);
  });

  it("uses_the_pack refuses a pack recorded after the first model call", () => {
    const grounded = recording("audit-atlas-grounded.jsonl");
    const used = grounded.filter((e) => e.kind === "evidence_used");
    const late: TraceEvent[] = grounded.filter((e) => e.kind !== "evidence_used");
    late.splice(3, 0, ...used);
    const verdict = GRADERS.uses_the_pack({ task: task("grounded-audit"), artifact: artifactOf("g", late), events: late });
    expect(verdict).toEqual({ pass: false, why: "the pack was recorded after a model call" });
  });

  it("within_ceiling wants the totals under the spec's ceiling, and the cost report to agree", () => {
    expect(GRADERS.within_ceiling({ task: task("audit"), artifact: artifactOf("a", atlas), events: atlas }).pass).toBe(true);
    const tight = { ...task("audit"), spec: { ...task("audit").spec, costCeilingTokens: 200 } };
    expect(GRADERS.within_ceiling({ task: tight, artifact: artifactOf("a", atlas), events: atlas }).pass).toBe(false);
    const cut = atlas.filter((e) => e.kind !== "job_ended");
    expect(GRADERS.within_ceiling({ task: task("audit"), artifact: artifactOf("c", cut), events: cut }).pass).toBe(false);
  });

  it("within_ceiling counts the tokens from the trace, and refuses an artifact that disagrees", () => {
    // The artifact's totals come from lab 14's cost report. The grader
    // recounts the reply lines itself, so a wrong total cannot pass.
    const wrong = { ...artifactOf("a", atlas), totals: { calls: 2, tokens: 100, microUsd: 0 } };
    const verdict = GRADERS.within_ceiling({ task: task("audit"), artifact: wrong, events: atlas });
    expect(verdict.pass).toBe(false);
    expect(verdict.why).toMatch(/217/);
  });

  it("no grader imports the loop: graders.ts imports types only", () => {
    const source = readFileSync(fileURLToPath(new URL("../src/graders.ts", import.meta.url)), "utf8");
    const imports = source.split("\n").filter((l) => l.startsWith("import "));
    expect(imports.length).toBeGreaterThan(0);
    for (const line of imports) expect(line).toMatch(/^import type /);
    // No way around the rule at run time either.
    expect(source).not.toMatch(/\bimport\s*\(|\brequire\s*\(/);
  });
});

/** Every failed grade on a scorecard, as "task/grader". */
const failures = (card: Scorecard): string[] =>
  card.tasks.flatMap((t) => t.grades.filter((g) => !g.pass).map((g) => `${t.id}/${g.grader}`));

describe("runGolden: every task runs, lands, and is graded", () => {
  it("the real loop passes all thirteen grades, and the scorecard is on disk", async () => {
    const root = freshRoot();
    const card = await runGolden(shipped(), TASK_FILE, root, REAL_LOOP, OPUS);
    expect(failures(card)).toEqual([]);
    expect(card).toMatchObject({ loop: "real", passed: 13, total: 13, tasksPassed: 4 });
    expect(card.tasks.map((t) => t.status)).toEqual(["done", "done", "failed", "done"]);
    const onDisk = admitScorecard(JSON.parse(readFileSync(join(root, SCORECARD_FILE), "utf8")));
    expect(onDisk.ok && onDisk.scorecard).toEqual(card);
  });

  it("each task leaves its own trace and artifact under the root", async () => {
    const root = freshRoot();
    await runGolden(shipped(), TASK_FILE, root, REAL_LOOP, OPUS);
    for (const id of ["audit", "held-audit", "capped-audit", "grounded-audit"]) {
      expect(existsSync(join(root, "traces", `${id}.jsonl`))).toBe(true);
      expect(existsSync(join(root, "artifacts", id, "artifact.json"))).toBe(true);
    }
  });

  it("a second run into the same root starts fresh traces and writes the same scorecard", async () => {
    const root = freshRoot();
    await runGolden(shipped(), TASK_FILE, root, REAL_LOOP, OPUS);
    const first = readFileSync(join(root, SCORECARD_FILE), "utf8");
    const lines = readFileSync(join(root, "traces", "audit.jsonl"), "utf8");
    await runGolden(shipped(), TASK_FILE, root, REAL_LOOP, OPUS);
    expect(readFileSync(join(root, SCORECARD_FILE), "utf8")).toBe(first);
    expect(readFileSync(join(root, "traces", "audit.jsonl"), "utf8").split("\n").length).toBe(lines.split("\n").length);
  });

  it("a held task with no operator wired fails: the default denial leaves nothing to report", async () => {
    const noOperator: NamedLoop = {
      name: "no-operator",
      run: (spec, gateway, { approver: _none, ...options }) => REAL_LOOP.run(spec, gateway, options),
    };
    const card = await runGolden([task("held-audit")], TASK_FILE, freshRoot(), noOperator, OPUS);
    expect(failures(card)).toEqual(["held-audit/reports_tool_output"]);
  });

  it("a loop that throws still lands, is graded, and the scorecard names the crash", async () => {
    const root = freshRoot();
    const crashing = {
      name: "crashing",
      run: () => Promise.reject(new Error("process died")),
    };
    const card = await runGolden([task("audit")], TASK_FILE, root, crashing, OPUS);
    expect(card.tasks[0]?.crashed).toBe("process died");
    expect(failures(card)).toContain("audit/ends_as_expected");
  });
});

describe("a planted defect drops a named grader on a named task", () => {
  const expected: Record<keyof typeof DEFECTS, string[]> = {
    "ignores-approval-list": ["held-audit/asks_before_held_tool"],
    "ignores-call-cap": ["capped-audit/ends_as_expected"],
    "drops-the-pack": [
      "grounded-audit/ends_as_expected",
      "grounded-audit/uses_the_pack",
      "grounded-audit/reports_tool_output",
    ],
  };

  it.each(Object.entries(expected))("%s", async (name, want) => {
    const defect = DEFECTS[name as keyof typeof DEFECTS];
    const card = await runGolden(shipped(), TASK_FILE, freshRoot(), defect, OPUS);
    expect(card.loop).toBe(name);
    expect(failures(card)).toEqual(want);
    expect(card.passed).toBe(13 - want.length);
    // Every defect fails exactly one task, however many of its grades drop.
    expect(card.tasksPassed).toBe(3);
  });

  it("a task fails when one grade fails, even if another grade on it passes", async () => {
    const card = await runGolden(shipped(), TASK_FILE, freshRoot(), DEFECTS["drops-the-pack"], OPUS);
    const grounded = card.tasks.find((t) => t.id === "grounded-audit");
    // Nothing ran, so nothing was spent: the ceiling check passes at 0 tokens.
    expect(grounded?.grades.find((g) => g.grader === "within_ceiling")).toMatchObject({ pass: true, why: "0 of 2000 tokens" });
    expect(grounded?.pass).toBe(false);
  });
});
