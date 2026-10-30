/**
 * A run under its own job's graph (lesson 0021).
 *
 * Under vitest these runs go through LangGraph.js: the swap in
 * vitest.config.ts hands lab 12's handlers the runner. `pnpm job e` runs
 * the same cases on lab 12's own interpreter. Both engines read the same
 * job graph, so both refuse the same move.
 *
 * The two mismatches below hand the run a spec other than the one its
 * graph was built from. That stands in for a gate or a handler that
 * disagrees with the spec: the graph is the second check, and it holds.
 */
import { describe, expect, it } from "vitest";
import { FakeModelGateway } from "../../07-tool-loop/src/fake-gateway.js";
import type { AdmittedPack } from "../../07-tool-loop/src/supervisor.js";
import { startJob } from "../../12-workflow-graph/src/handlers.js";
import { loadGraph } from "../../12-workflow-graph/src/load-graph.js";
import { done, wantsTool } from "../../12-workflow-graph/src/scripted-replies.js";
import { jobLifecycleGuards } from "../../12-workflow-graph/src/guards.js";
import { walk } from "../../12-workflow-graph/src/walker.js";
import { collector, keeper, spec } from "../../12-workflow-graph/tests/helpers.js";
import { dispatch } from "../src/dispatch.js";
import { requireJobGraph } from "../src/graph-for-spec.js";

const full = loadGraph(new URL("../../12-workflow-graph/graphs/job-lifecycle.json", import.meta.url));

const jobGraphOf = (s: ReturnType<typeof spec>) => requireJobGraph(full, s);

const pack: AdmittedPack = {
  text: "[MOD-004] Job supervisor loop is implemented (module).",
  queries: ["supervisor"],
  snapshot: "snap-test",
  assembledAt: "2026-10-30T00:00:00.000Z",
  ids: ["MOD-004"],
};

describe("dispatch builds the graph from the spec it runs", () => {
  it("lands the audit at 2 calls and 80 tokens, as on the full graph", async () => {
    const trace = collector();
    const gateway = new FakeModelGateway([wantsTool, done]);
    const result = await dispatch(full, spec(), gateway, { trace: trace.port });
    expect(result).toMatchObject({ ok: true, report: { outcome: "landed", modelCalls: 2, tokensSpent: 80 } });
    expect(walk(jobGraphOf(spec()), jobLifecycleGuards, trace.events)).toMatchObject({ ok: true, complete: true });
  });

  it("parks a held call, because the held spec's graph keeps awaiting_approval", async () => {
    const result = await dispatch(full, spec({ approvalRequired: ["graph_health"] }), new FakeModelGateway([wantsTool]), {
      park: true,
    });
    expect(result).toMatchObject({ ok: false, kind: "parked", node: "awaiting_approval", step: 4 });
  });

  it("grounds an evidence job through the grounded node", async () => {
    const trace = collector();
    const result = await dispatch(full, spec({ evidenceQueries: ["supervisor"] }), new FakeModelGateway([done]), {
      pack,
      trace: trace.port,
    });
    expect(result).toMatchObject({ ok: true, report: { outcome: "landed", evidenceIds: ["MOD-004"] } });
    expect(trace.events.map((e) => e.kind).slice(0, 2)).toEqual(["job_started", "evidence_used"]);
  });
});

describe("the graph refuses what its spec ruled out", () => {
  it("refuses a hold on the audit's graph before anyone is asked", async () => {
    const trace = collector();
    const checkpoints = keeper();
    const gateway = new FakeModelGateway([wantsTool, done]);
    const result = await startJob(jobGraphOf(spec()), spec({ approvalRequired: ["graph_health"] }), gateway, {
      park: true,
      trace: trace.port,
      checkpoints: checkpoints.port,
    });
    expect(result).toEqual({ ok: false, kind: "no_edge", step: 4, from: "gating", to: "awaiting_approval" });
    expect(gateway.calls).toHaveLength(1);
    expect(trace.events.map((e) => e.kind)).toEqual(["job_started", "call_started", "reply", "gate"]);
    expect(checkpoints.latest()?.node).toBe("gating");
  });

  it("refuses a call on the evidence job's graph when no pack grounded it", async () => {
    const trace = collector();
    const gateway = new FakeModelGateway([done]);
    const result = await startJob(jobGraphOf(spec({ evidenceQueries: ["supervisor"] })), spec(), gateway, {
      trace: trace.port,
    });
    expect(result).toEqual({ ok: false, kind: "no_edge", step: 1, from: "started", to: "calling" });
    expect(gateway.calls).toHaveLength(0);
    expect(trace.events.map((e) => e.kind)).toEqual(["job_started"]);
  });
});
