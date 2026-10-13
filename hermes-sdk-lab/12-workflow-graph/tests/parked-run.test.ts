/**
 * The audit job, parked and answered out of process (lesson 0019).
 *
 * Three claims, measured against the fake gateway:
 *
 *   park    — with nobody wired to answer in-process and `park` set, a
 *             held call stops the run at awaiting_approval. The result is
 *             typed, the trace ends at the gate event, the checkpoint
 *             names the node, and one model call was made.
 *   answer  — the verdict is written into the checkpoint by another
 *             caller, through a JSON round trip, which is what a file is.
 *             The resumed handler reads it, records the approval event,
 *             and the call is answered. Two calls, 80 tokens, one trace
 *             file that walks legal and complete: the same numbers as
 *             lesson 0018's in-process resume.
 *   never   — a job whose spec requires no approval never visits the node,
 *             so the queue stays empty however the run is wired.
 */
import { describe, expect, it } from "vitest";
import { FakeModelGateway } from "../../07-tool-loop/src/fake-gateway.js";
import { admitCheckpoint, type JobCheckpoint } from "../src/checkpoint.js";
import { jobLifecycleGuards } from "../src/guards.js";
import { resumeJob, startJob } from "../src/handlers.js";
import { loadGraph } from "../src/load-graph.js";
import { answerParked, parkedJobs } from "../src/queue.js";
import { done, wantsTool } from "../src/scripted-replies.js";
import { walk } from "../src/walker.js";
import { collector, keeper, spec } from "./helpers.js";

const graph = loadGraph(new URL("../graphs/job-lifecycle.json", import.meta.url));
const held = (): ReturnType<typeof spec> => spec({ approvalRequired: ["graph_health"] });

/** What a file does to a checkpoint: bytes out, bytes in, parsed. */
function throughDisk(checkpoint: JobCheckpoint): JobCheckpoint {
  const admission = admitCheckpoint(JSON.parse(JSON.stringify(checkpoint)));
  if (!admission.admitted) throw new Error(admission.rejections.join("; "));
  return admission.checkpoint;
}

describe("a held call with nobody in-process to ask", () => {
  it("parks the run at awaiting_approval: typed result, trace at the gate, one call made", async () => {
    const { port, events } = collector();
    const checkpoints = keeper();
    const gateway = new FakeModelGateway([wantsTool, done]);

    const result = await startJob(graph, held(), gateway, {
      trace: port,
      checkpoints: checkpoints.port,
      park: true,
    });

    expect(result).toMatchObject({ ok: false, kind: "parked", step: 4, node: "awaiting_approval" });
    expect(events.map((e) => e.kind)).toEqual(["job_started", "call_started", "reply", "gate"]);
    expect(gateway.calls).toHaveLength(1);
    const last = checkpoints.latest();
    expect(last).toMatchObject({ step: 4, node: "awaiting_approval" });
    expect(last?.state).toMatchObject({ gate: "hold", verdict: null, modelCalls: 1, tokensSpent: 30 });
    expect(last?.state.pending.map((c) => c.name)).toEqual(["graph_health"]);
    // The park is not a move: a legal trace, cut short, and no job_ended.
    expect(walk(graph, jobLifecycleGuards, events)).toMatchObject({ ok: true, complete: false });
  });

  it("still denies by default when park is not set, as lesson 0010 wired it", async () => {
    const result = await startJob(graph, held(), new FakeModelGateway([wantsTool, done]));
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.report.toolRuns).toEqual(["graph_health → denied by default"]);
  });
});

describe("the verdict given out of process", () => {
  async function park(): Promise<{ checkpoint: JobCheckpoint; port: ReturnType<typeof collector>["port"]; events: ReturnType<typeof collector>["events"] }> {
    const { port, events } = collector();
    const checkpoints = keeper();
    await startJob(graph, held(), new FakeModelGateway([wantsTool]), {
      trace: port,
      checkpoints: checkpoints.port,
      park: true,
    });
    const latest = checkpoints.latest();
    if (latest === undefined) throw new Error("no checkpoint");
    return { checkpoint: throughDisk(latest), port, events };
  }

  it("is in the queue until answered, and the answer leaves the queue empty", async () => {
    const { checkpoint } = await park();
    expect(parkedJobs([checkpoint]).map((c) => c.job)).toEqual(["Audit the atlas graph"]);
    const answered = answerParked(checkpoint, "approved");
    if (!answered.ok) throw new Error(answered.reason);
    expect(parkedJobs([throughDisk(answered.checkpoint)])).toEqual([]);
  });

  it("approved: the resume records the approval, runs the tool, and lands at 2 calls and 80 tokens", async () => {
    const { checkpoint, port, events } = await park();
    const answered = answerParked(checkpoint, "approved");
    if (!answered.ok) throw new Error(answered.reason);

    const result = await resumeJob(graph, throughDisk(answered.checkpoint), held(), new FakeModelGateway([done]), {
      trace: port,
      park: true,
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.report).toMatchObject({ outcome: "landed", modelCalls: 2, tokensSpent: 80 });
    expect(result.report.toolRuns).toEqual(["graph_health → ran (approved)"]);
    expect(events.map((e) => e.kind)).toEqual([
      "job_started",
      "call_started",
      "reply",
      "gate",
      "approval",
      "tool_result",
      "call_started",
      "reply",
      "job_ended",
    ]);
    const approval = events[4];
    expect(approval).toMatchObject({ kind: "approval", tool: "graph_health", verdict: "approved" });
    expect(walk(graph, jobLifecycleGuards, events)).toMatchObject({ ok: true, complete: true });
  });

  it("denied: the resume records the denial and the model hears it", async () => {
    const { checkpoint, port, events } = await park();
    const answered = answerParked(checkpoint, "denied");
    if (!answered.ok) throw new Error(answered.reason);

    const result = await resumeJob(graph, throughDisk(answered.checkpoint), held(), new FakeModelGateway([done]), {
      trace: port,
      park: true,
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.report).toMatchObject({ outcome: "landed", modelCalls: 2 });
    expect(result.report.toolRuns).toEqual(["graph_health → denied by the operator"]);
    expect(events[4]).toMatchObject({ kind: "approval", verdict: "denied" });
    expect(walk(graph, jobLifecycleGuards, events)).toMatchObject({ ok: true, complete: true });
  });

  it("resumed before anyone answered: parks again, same step, no event, no checkpoint", async () => {
    const { checkpoint, port, events } = await park();
    const checkpoints = keeper();
    const result = await resumeJob(graph, checkpoint, held(), new FakeModelGateway([done]), {
      trace: port,
      checkpoints: checkpoints.port,
      park: true,
    });
    expect(result).toMatchObject({ ok: false, kind: "parked", step: 4, node: "awaiting_approval" });
    expect(events).toHaveLength(4);
    expect(checkpoints.saved).toHaveLength(0);
  });
});

describe("a job that requires no approval", () => {
  it("never visits awaiting_approval, so the queue holds nothing from it", async () => {
    const { events } = collector();
    const checkpoints = keeper();
    const result = await startJob(graph, spec(), new FakeModelGateway([wantsTool, done]), {
      checkpoints: checkpoints.port,
      park: true,
    });
    expect(result.ok).toBe(true);
    expect(checkpoints.saved.map((c) => c.node)).not.toContain("awaiting_approval");
    expect(parkedJobs(checkpoints.saved)).toEqual([]);
    expect(events).toHaveLength(0);
  });
});
