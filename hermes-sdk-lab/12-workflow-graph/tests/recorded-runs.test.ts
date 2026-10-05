/**
 * Every recorded run is a legal path (lesson 0017).
 *
 * Six trace files from exercises 07 and 11, read back through parseTrace,
 * then walked against the job lifecycle graph. No model, no network, no
 * mock: the recordings are the evidence, and the graph is the rule.
 * Then the real supervisor runs against a fake gateway, so the edges no
 * recording took, such as a held tool and a refused pack, are walked too.
 */
import { describe, expect, it } from "vitest";
import type { ApprovalPort } from "../../07-tool-loop/src/approval.js";
import { FakeModelGateway } from "../../07-tool-loop/src/fake-gateway.js";
import type { GatewayResult } from "../../07-tool-loop/src/gateway.js";
import { runTask } from "../../07-tool-loop/src/supervisor.js";
import { jobLifecycleGuards } from "../src/guards.js";
import { loadGraph } from "../src/load-graph.js";
import { GROUNDED_RECORDING, RECORDINGS, readRecording, recordingName } from "../src/recordings.js";
import { walk } from "../src/walker.js";
import { collector, spec } from "./helpers.js";

const graph = loadGraph(new URL("../graphs/job-lifecycle.json", import.meta.url));

describe("the six recorded runs", () => {
  for (const path of RECORDINGS) {
    it(`${recordingName(path)} is a legal, complete path`, () => {
      const result = walk(graph, jobLifecycleGuards, readRecording(path));
      expect(result).toMatchObject({ ok: true, complete: true });
    });
  }

  it("together take ten of the graph's twenty-six edges", () => {
    const taken = new Set<string>();
    for (const path of RECORDINGS) {
      const result = walk(graph, jobLifecycleGuards, readRecording(path));
      if (result.ok) for (const edge of result.edgesTaken) taken.add(edge);
    }
    expect(graph.edges).toHaveLength(26);
    expect([...taken].sort()).toEqual([
      "calling>out_of_time",
      "calling>over_budget",
      "calling>replied",
      "gating>tool_ran",
      "grounded>calling",
      "replied>gating",
      "replied>landed",
      "started>calling",
      "started>grounded",
      "tool_ran>calling",
    ]);
  });

  it("refuses the grounded run once one line is moved", () => {
    const events = readRecording(GROUNDED_RECORDING);
    // Move the evidence line after the first call: a pack that arrived
    // after planning began is not a path the supervisor can take.
    const [started, evidence, call, ...rest] = events;
    if (!started || !evidence || !call) throw new Error("recording too short");
    const result = walk(graph, jobLifecycleGuards, [started, call, evidence, ...rest]);
    expect(result).toMatchObject({ ok: false, line: 3, from: "calling", to: "grounded" });
  });
});

const wantsTool: GatewayResult = {
  ok: true,
  reply: {
    text: "I need the graph health report first.",
    calls: [{ id: "toolu_1", name: "graph_health", input: { graph: "atlas" } }],
    stop: "wants_tool",
    usage: { inputTokens: 20, outputTokens: 10 },
    requestId: "req_fake_1",
  },
};
const done: GatewayResult = {
  ok: true,
  reply: {
    text: "Audit complete.",
    calls: [],
    stop: "completed",
    usage: { inputTokens: 40, outputTokens: 10 },
    requestId: "req_fake_2",
  },
};

describe("runs the recordings never took, through the real supervisor", () => {
  it("a held tool, approved: gating, awaiting_approval, tool_ran", async () => {
    const { port, events } = collector();
    const approver: ApprovalPort = { decide: () => Promise.resolve("approved") };
    await runTask(
      new FakeModelGateway([wantsTool, done]),
      spec({ approvalRequired: ["graph_health"] }),
      { trace: port, approver },
    );
    const result = walk(graph, jobLifecycleGuards, events);
    expect(result).toMatchObject({ ok: true, complete: true });
    if (!result.ok) return;
    expect(result.edgesTaken).toContain("gating>awaiting_approval");
    expect(result.edgesTaken).toContain("awaiting_approval>tool_ran");
  });

  it("a held tool with nobody to ask: the default denial is still tool_ran", async () => {
    const { port, events } = collector();
    await runTask(
      new FakeModelGateway([wantsTool, done]),
      spec({ approvalRequired: ["graph_health"] }),
      { trace: port },
    );
    const result = walk(graph, jobLifecycleGuards, events);
    expect(result).toMatchObject({ ok: true, complete: true });
    if (!result.ok) return;
    expect(result.edgesTaken).toContain("awaiting_approval>tool_ran");
  });

  it("a spec that asks for evidence and gets none: started, no_evidence", async () => {
    const { port, events } = collector();
    const gateway = new FakeModelGateway([done]);
    await runTask(gateway, spec({ evidenceQueries: ["supervisor"] }), { trace: port });
    expect(gateway.calls).toHaveLength(0);
    const result = walk(graph, jobLifecycleGuards, events);
    expect(result).toEqual({
      ok: true,
      complete: true,
      path: ["started", "no_evidence"],
      edgesTaken: ["started>no_evidence"],
    });
  });

  it("a throttled provider: calling, retry_later", async () => {
    const { port, events } = collector();
    const throttled: GatewayResult = {
      ok: false,
      failure: { kind: "throttled", retryAfterMs: 1000 },
    };
    await runTask(new FakeModelGateway([throttled]), spec(), { trace: port });
    const result = walk(graph, jobLifecycleGuards, events);
    expect(result).toMatchObject({ ok: true, path: ["started", "calling", "retry_later"] });
  });
});
