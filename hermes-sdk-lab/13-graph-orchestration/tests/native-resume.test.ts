/**
 * The framework's own resume protocol, on the audit job (lesson 0020).
 *
 * Lab 12 parks a held call by returning `{ park: true }` and resumes from
 * its own checkpoint, with the verdict written into the state. LangGraph
 * has its own way: `interrupt()` inside the node, a checkpointer that
 * keeps the paused thread, and `new Command({ resume })` with the same
 * thread id. Four claims, measured against the fake gateway:
 *
 *   park     — interrupt() stops the audit at awaiting_approval after one
 *              model call; the framework's thread holds the pause.
 *   resume   — Command({ resume: "approved" }) in a fresh context lands at
 *              2 calls and 80 tokens, the numbers of lessons 0018 and 0019,
 *              and the trace walks legal and complete.
 *   refused  — a resume value outside the verdict schema is refused by the
 *              framework's parse, and the trace gains nothing.
 *   re-run   — the node restarts from its first line, so lab 12's
 *              checkpoint for step 4 is written twice.
 */
import { MemorySaver } from "@langchain/langgraph";
import { describe, expect, it } from "vitest";
import { FakeModelGateway } from "../../07-tool-loop/src/fake-gateway.js";
import { jobLifecycleGuards } from "../../12-workflow-graph/src/guards.js";
import { loadGraph } from "../../12-workflow-graph/src/load-graph.js";
import { parkedJobs } from "../../12-workflow-graph/src/queue.js";
import { done, wantsTool } from "../../12-workflow-graph/src/scripted-replies.js";
import { walk } from "../../12-workflow-graph/src/walker.js";
import { collector, keeper, spec } from "../../12-workflow-graph/tests/helpers.js";
import { answerOnThread, startOnThread, waitingAt } from "../src/job-thread.js";

const graph = loadGraph(new URL("../../12-workflow-graph/graphs/job-lifecycle.json", import.meta.url));
const held = (): ReturnType<typeof spec> => spec({ approvalRequired: ["graph_health"] });

async function parked(thread: string) {
  const saver = new MemorySaver();
  const trace = collector();
  const checkpoints = keeper();
  const gateway = new FakeModelGateway([wantsTool]);
  const result = await startOnThread(graph, held(), gateway, {
    saver,
    thread,
    trace: trace.port,
    checkpoints: checkpoints.port,
  });
  return { saver, trace, checkpoints, gateway, result };
}

describe("a held call, paused by interrupt()", () => {
  it("stops at awaiting_approval after one call, and the thread says it waits there", async () => {
    const { saver, trace, checkpoints, gateway, result } = await parked("audit-1");
    expect(result).toMatchObject({ ok: false, kind: "parked", step: 4, node: "awaiting_approval" });
    expect(gateway.calls).toHaveLength(1);
    expect(trace.events.map((e) => e.kind)).toEqual(["job_started", "call_started", "reply", "gate"]);
    expect(checkpoints.latest()).toMatchObject({ step: 4, node: "awaiting_approval" });

    // Two records now say the job waits. Lab 12's queue reads one,
    // the framework's thread holds the other.
    expect(parkedJobs(checkpoints.saved).map((c) => c.step)).toEqual([4]);
    expect(await waitingAt(graph, saver, "audit-1")).toEqual(["awaiting_approval"]);
  });
});

describe("the same thread, resumed with Command({ resume })", () => {
  it("approved: lands at 2 calls and 80 tokens, one legal and complete trace", async () => {
    const { saver, trace, checkpoints } = await parked("audit-2");
    const result = await answerOnThread(graph, held(), new FakeModelGateway([done]), "approved", {
      saver,
      thread: "audit-2",
      trace: trace.port,
      checkpoints: checkpoints.port,
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.report).toMatchObject({ outcome: "landed", modelCalls: 2, tokensSpent: 80 });
    expect(result.report.toolRuns).toEqual(["graph_health → ran (approved)"]);
    expect(trace.events.map((e) => e.kind)).toEqual([
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
    expect(walk(graph, jobLifecycleGuards, trace.events)).toMatchObject({ ok: true, complete: true });
    expect(await waitingAt(graph, saver, "audit-2")).toEqual([]);
  });

  it("re-runs the paused node from its first line: step 4's checkpoint is written twice", async () => {
    const { saver, trace, checkpoints } = await parked("audit-3");
    await answerOnThread(graph, held(), new FakeModelGateway([done]), "denied", {
      saver,
      thread: "audit-3",
      trace: trace.port,
      checkpoints: checkpoints.port,
    });
    expect(checkpoints.saved.map((c) => c.step)).toEqual([1, 2, 3, 4, 4, 5, 6, 7, 8]);
    expect(trace.events[4]).toMatchObject({ kind: "approval", verdict: "denied" });
  });

  it("refuses a resume sent to a thread that holds no pause", async () => {
    const { saver, trace } = await parked("audit-5");
    await expect(
      answerOnThread(graph, held(), new FakeModelGateway([done]), "approved", {
        saver,
        thread: "another-thread",
        trace: trace.port,
      }),
    ).rejects.toThrow(/thread "another-thread" holds no paused run/);
    expect(trace.events).toHaveLength(4);
  });

  it("refuses a resume value outside the verdict schema, and the trace gains nothing", async () => {
    const { saver, trace } = await parked("audit-4");
    await expect(
      answerOnThread(graph, held(), new FakeModelGateway([done]), "maybe", {
        saver,
        thread: "audit-4",
        trace: trace.port,
      }),
    ).rejects.toThrow();
    expect(trace.events).toHaveLength(4);
  });
});
