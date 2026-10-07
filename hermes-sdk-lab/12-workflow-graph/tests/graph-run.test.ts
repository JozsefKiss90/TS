/**
 * The job lifecycle, run by the graph instead of by if statements
 * (lesson 0018).
 *
 * Three claims, each measured against a fake gateway:
 *
 *   same job   — for every scenario the fake can script, the graph-driven
 *                run and lab 07's supervisor return the same report and
 *                write the same events, and the trace is a legal path.
 *   refusal    — an edge removed from the graph file stops the run before
 *                the move, as a typed result, with no model call made for
 *                it and no checkpoint written for it.
 *   resume     — a run killed mid-way resumes from its last checkpoint,
 *                and the result is compared with lesson 0011's resume from
 *                the trace: what each recovers, and what neither can.
 */
import { describe, expect, it } from "vitest";
import type { ApprovalPort } from "../../07-tool-loop/src/approval.js";
import { FakeModelGateway } from "../../07-tool-loop/src/fake-gateway.js";
import type { GatewayResult, ModelCall, ModelGateway } from "../../07-tool-loop/src/gateway.js";
import { runTask, type AdmittedPack, type JobReport } from "../../07-tool-loop/src/supervisor.js";
import { rebuildResumePoint, type TraceEvent } from "../../07-tool-loop/src/trace.js";
import { jobLifecycleGuards } from "../src/guards.js";
import { resumeJob, startJob, type JobOptions } from "../src/handlers.js";
import { loadGraph } from "../src/load-graph.js";
import { done, wantsTool } from "../src/scripted-replies.js";
import { walk, type GuardTable } from "../src/walker.js";
import { admitWorkflowGraph } from "../src/workflow-graph.js";
import { collector, keeper, spec } from "./helpers.js";

const GRAPH_PATH = new URL("../graphs/job-lifecycle.json", import.meta.url);
const graph = loadGraph(GRAPH_PATH);

const throttled: GatewayResult = { ok: false, failure: { kind: "throttled", retryAfterMs: 1000 } };

const pack: AdmittedPack = {
  text: "[MOD-004] Job supervisor loop is implemented (module).",
  queries: ["supervisor"],
  snapshot: "snap-test",
  assembledAt: "2026-10-07T00:00:00.000Z",
  ids: ["MOD-004"],
};

/**
 * A gateway that reports progress like the mock does, then waits for the
 * job's signal and returns what it had. It lets the in-flight bounds act,
 * which the instant fake cannot: the budget estimate trips on the chars
 * reported, and the deadline fires while the call waits.
 */
class SlowFakeGateway implements ModelGateway {
  constructor(private readonly chars: number) {}
  complete(
    _call: ModelCall,
    options?: { signal?: AbortSignal; onProgress?: (p: { kind: "text"; chars: number }) => void },
  ): Promise<GatewayResult> {
    options?.onProgress?.({ kind: "text", chars: this.chars });
    return new Promise((resolve) => {
      const give = (): void =>
        resolve({ ok: false, failure: { kind: "aborted", partialText: "Audit complete. The" } });
      if (options?.signal?.aborted) give();
      else options?.signal?.addEventListener("abort", give, { once: true });
    });
  }
}

/** The at field is a clock reading, so two runs never share it. */
const timeless = (events: TraceEvent[]): Omit<TraceEvent, "at">[] =>
  events.map(({ at: _at, ...rest }) => rest);

const approved: ApprovalPort = { decide: () => Promise.resolve("approved") };

type Scenario = {
  name: string;
  gateway: () => ModelGateway;
  spec: () => ReturnType<typeof spec>;
  options?: Omit<JobOptions, "trace" | "checkpoints">;
  calls: number;
};

const scenarios: Scenario[] = [
  { name: "one tool call answered", gateway: () => new FakeModelGateway([wantsTool, done]), spec: () => spec(), calls: 2 },
  { name: "a held tool, approved", gateway: () => new FakeModelGateway([wantsTool, done]), spec: () => spec({ approvalRequired: ["graph_health"] }), options: { approver: approved }, calls: 2 },
  { name: "a held tool with nobody to ask", gateway: () => new FakeModelGateway([wantsTool, done]), spec: () => spec({ approvalRequired: ["graph_health"] }), calls: 2 },
  { name: "a grounded job", gateway: () => new FakeModelGateway([done]), spec: () => spec({ evidenceQueries: ["supervisor"] }), options: { pack }, calls: 1 },
  { name: "a spec that asks for evidence and gets none", gateway: () => new FakeModelGateway([done]), spec: () => spec({ evidenceQueries: ["supervisor"] }), calls: 0 },
  { name: "a throttled provider", gateway: () => new FakeModelGateway([throttled]), spec: () => spec(), calls: 1 },
  { name: "the call cap", gateway: () => new FakeModelGateway([wantsTool, wantsTool]), spec: () => spec({ maxModelCalls: 2 }), calls: 2 },
  { name: "the ceiling reached mid-generation", gateway: () => new SlowFakeGateway(600), spec: () => spec({ costCeilingTokens: 100, maxTokens: 50 }), calls: 1 },
  { name: "the deadline passed mid-generation", gateway: () => new SlowFakeGateway(3), spec: () => spec({ deadlineMs: 30 }), calls: 1 },
];

describe("the same job, run by the graph", () => {
  for (const scenario of scenarios) {
    it(`${scenario.name}: same report, same events, a legal path`, async () => {
      const byCode = collector();
      const expected: JobReport = await runTask(scenario.gateway(), scenario.spec(), {
        ...scenario.options,
        trace: byCode.port,
      });

      const byGraph = collector();
      const gateway = scenario.gateway();
      const result = await startJob(graph, scenario.spec(), gateway, {
        ...scenario.options,
        trace: byGraph.port,
      });

      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.report).toEqual(expected);
      expect(timeless(byGraph.events)).toEqual(timeless(byCode.events));
      expect(walk(graph, jobLifecycleGuards, byGraph.events)).toMatchObject({
        ok: true,
        complete: true,
      });
      if (gateway instanceof FakeModelGateway) expect(gateway.calls).toHaveLength(scenario.calls);
    });
  }
});

describe("a move the graph does not hold", () => {
  it("is refused before it happens, costing no model call and no checkpoint", async () => {
    const raw = JSON.parse(JSON.stringify(graph)) as { edges: Array<{ from: string; to: string }> };
    raw.edges = raw.edges.filter((e) => !(e.from === "tool_ran" && e.to === "calling"));
    const admission = admitWorkflowGraph(raw);
    if (!admission.admitted) throw new Error(admission.rejections.join("; "));

    const gateway = new FakeModelGateway([wantsTool, done]);
    const { port, events } = collector();
    const checkpoints = keeper();
    const result = await startJob(admission.graph, spec(), gateway, {
      trace: port,
      checkpoints: checkpoints.port,
    });

    expect(result).toEqual({ ok: false, kind: "no_edge", step: 5, from: "tool_ran", to: "calling" });
    expect(gateway.calls).toHaveLength(1);
    expect(events.map((e) => e.kind)).toEqual([
      "job_started",
      "call_started",
      "reply",
      "gate",
      "tool_result",
    ]);
    expect(checkpoints.latest()).toMatchObject({ step: 4, node: "tool_ran" });
  });

  it("is refused by a guard that says no, naming the guard", async () => {
    const guards: GuardTable = { ...jobLifecycleGuards, reply_finished: () => false };
    const result = await startJob(graph, spec(), new FakeModelGateway([done]), { guards });
    expect(result).toEqual({
      ok: false,
      kind: "guard_refused",
      step: 3,
      from: "replied",
      to: "landed",
      guards: ["reply_finished"],
    });
  });
});

describe("a job killed mid-run, resumed two ways", () => {
  it("killed inside call 2: the checkpoint resumes call 2, the trace resumes at call 3", async () => {
    const { port, events } = collector();
    const checkpoints = keeper();
    // One reply in the script, so the second call throws: the process dies
    // inside the call, after call_started was written.
    await expect(
      startJob(graph, spec(), new FakeModelGateway([wantsTool]), {
        trace: port,
        checkpoints: checkpoints.port,
      }),
    ).rejects.toThrow(/exhausted/);

    expect(events.map((e) => e.kind)).toEqual([
      "job_started",
      "call_started",
      "reply",
      "gate",
      "tool_result",
      "call_started",
    ]);
    const last = checkpoints.latest();
    expect(last).toMatchObject({ step: 5, node: "calling" });
    expect(last?.state).toMatchObject({ modelCalls: 1, tokensSpent: 30, pending: [], results: [] });
    expect(last?.state.transcript.map((t) => t.from)).toEqual(["operator", "model", "tools"]);

    // Lesson 0011: rebuild from the trace. The dead call counts, because it
    // may have been billed, and the next call is call 3.
    const point = rebuildResumePoint(events);
    expect(point).toMatchObject({ modelCalls: 2, tokensSpent: 30 });
    if (point === null) throw new Error("nothing to resume");
    const byTrace = await runTask(new FakeModelGateway([done]), spec(), { resume: point });
    expect(byTrace).toMatchObject({ outcome: "landed", modelCalls: 3, tokensSpent: 80 });

    // Lesson 0018: resume from the checkpoint. The dead call never reached
    // it, so call 2 is made again, into the same trace.
    if (last === undefined) throw new Error("no checkpoint");
    const result = await resumeJob(graph, last, spec(), new FakeModelGateway([done]), {
      trace: port,
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.report).toMatchObject({ outcome: "landed", modelCalls: 2, tokensSpent: 80 });

    // The one record now holds a call that never came back, and the graph
    // refuses to read it as a move.
    expect(walk(graph, jobLifecycleGuards, events)).toMatchObject({
      ok: false,
      line: 7,
      from: "calling",
      to: "calling",
    });
  });

  it("killed while a held call waited: the checkpoint keeps the ask, the trace re-asks", async () => {
    const { port, events } = collector();
    const checkpoints = keeper();
    const dying: ApprovalPort = { decide: () => Promise.reject(new Error("process died")) };
    await expect(
      startJob(graph, spec({ approvalRequired: ["graph_health"] }), new FakeModelGateway([wantsTool]), {
        trace: port,
        checkpoints: checkpoints.port,
        approver: dying,
      }),
    ).rejects.toThrow(/died/);

    expect(events.map((e) => e.kind)).toEqual(["job_started", "call_started", "reply", "gate"]);
    const last = checkpoints.latest();
    expect(last).toMatchObject({ step: 4, node: "awaiting_approval" });
    expect(last?.state.pending).toHaveLength(1);
    expect(last?.state.gate).toBe("hold");

    // Lesson 0011: the unanswered ask is dropped from the transcript and
    // asked again, which costs one model call.
    const point = rebuildResumePoint(events);
    if (point === null) throw new Error("nothing to resume");
    expect(point.transcript.map((t) => t.from)).toEqual(["operator"]);
    const byTrace = await runTask(
      new FakeModelGateway([wantsTool, done]),
      spec({ approvalRequired: ["graph_health"] }),
      { resume: point, approver: approved },
    );
    expect(byTrace).toMatchObject({ outcome: "landed", modelCalls: 3, tokensSpent: 110 });

    // Lesson 0018: the ask is in the checkpoint. The operator is asked
    // again, the model is not.
    if (last === undefined) throw new Error("no checkpoint");
    const result = await resumeJob(
      graph,
      last,
      spec({ approvalRequired: ["graph_health"] }),
      new FakeModelGateway([done]),
      { trace: port, approver: approved },
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.report).toMatchObject({ outcome: "landed", modelCalls: 2, tokensSpent: 80 });
    expect(result.report.toolRuns).toEqual(["graph_health → ran (approved)"]);
    expect(walk(graph, jobLifecycleGuards, events)).toMatchObject({ ok: true, complete: true });
  });
});
