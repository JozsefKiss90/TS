/**
 * The job's graph, built from its TaskSpec (lesson 0021).
 *
 * Lab 12 runs every job under one graph: 13 nodes, 26 edges. A job whose
 * spec holds nothing for approval still has an edge into
 * `awaiting_approval`, closed only because the gate code never says
 * "hold". `graphForSpec` removes what the spec makes unreachable, so the
 * job's graph itself says what the job may do.
 *
 * Measured here with no model and no engine: the cuts, the counts, the
 * re-admission, and the seven recorded traces walked against the graph
 * of the spec each one ran under.
 */
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { admitTaskSpec, type TaskSpec } from "../../07-tool-loop/src/task-spec.js";
import { parseTrace, type TraceEvent } from "../../07-tool-loop/src/trace.js";
import { spec } from "../../12-workflow-graph/tests/helpers.js";
import { jobLifecycleGuards } from "../../12-workflow-graph/src/guards.js";
import { loadGraph } from "../../12-workflow-graph/src/load-graph.js";
import { walk } from "../../12-workflow-graph/src/walker.js";
import { admitWorkflowGraph, type WorkflowGraph } from "../../12-workflow-graph/src/workflow-graph.js";
import { graphForSpec, requireJobGraph } from "../src/graph-for-spec.js";

const full = loadGraph(new URL("../../12-workflow-graph/graphs/job-lifecycle.json", import.meta.url));

const jobGraph = (s: TaskSpec): WorkflowGraph => requireJobGraph(full, s);

const edgeNames = (g: WorkflowGraph): string[] => g.edges.map((e) => `${e.from}>${e.to}`);

const audit = spec();
const held = spec({ approvalRequired: ["graph_health"] });
const grounded = spec({ evidenceQueries: ["supervisor", "trace"], evidenceLimit: 3 });

describe("the audit, which holds nothing and asks for no evidence", () => {
  it("loses awaiting_approval and grounded, with every edge that touches them", () => {
    const g = jobGraph(audit);
    expect(g.nodes).not.toContain("awaiting_approval");
    expect(g.nodes).not.toContain("grounded");
    expect(edgeNames(g).some((e) => e.includes("awaiting_approval") || e.includes("grounded"))).toBe(false);
    expect([g.nodes.length, g.edges.length]).toEqual([11, 17]);
  });

  it("keeps only the guards its remaining edges cite", () => {
    expect(jobGraph(audit).guards).toEqual(["reply_wants_tool", "reply_finished", "gate_decided"]);
  });

  it("keeps gating, because the model may name a tool the spec never offered", () => {
    const g = jobGraph(spec({ allowedTools: [] }));
    expect(g.nodes).toContain("gating");
    expect(edgeNames(g)).toContain("gating>tool_ran");
  });

  it("keeps no_evidence, because a pack the spec never asked for still ends there", () => {
    expect(edgeNames(jobGraph(audit))).toContain("started>no_evidence");
  });

  it("names each cut and the spec field that caused it", () => {
    const built = graphForSpec(full, audit);
    if (!built.admitted) throw new Error("refused");
    expect(built.cuts.map((c) => [c.field, c.nodes, c.edges.length])).toEqual([
      ["approvalRequired", ["awaiting_approval"], 5],
      ["evidenceQueries", ["grounded"], 4],
    ]);
  });
});

describe("a spec that holds a tool", () => {
  it("keeps awaiting_approval and all six guards", () => {
    const g = jobGraph(held);
    expect(g.nodes).toContain("awaiting_approval");
    expect(g.guards).toHaveLength(6);
    expect([g.nodes.length, g.edges.length]).toEqual([12, 22]);
  });
});

describe("a spec that asks for evidence", () => {
  it("keeps grounded and loses the edge that would skip it", () => {
    const g = jobGraph(grounded);
    expect(g.nodes).toContain("grounded");
    expect(edgeNames(g)).not.toContain("started>calling");
    expect(edgeNames(g)).toContain("grounded>calling");
    expect([g.nodes.length, g.edges.length]).toEqual([12, 20]);
  });
});

describe("what a job graph is", () => {
  it("passes the same strict parse as the full graph: names only, no claims, no events", () => {
    for (const s of [audit, held, grounded]) {
      expect(admitWorkflowGraph(jobGraph(s)).admitted).toBe(true);
      expect(Object.keys(jobGraph(s)).sort()).toEqual(["edges", "guards", "name", "nodes", "start", "terminal"]);
    }
  });

  it("is a new value, and the full graph is left as it was", () => {
    const before = JSON.stringify(full);
    jobGraph(audit);
    jobGraph(grounded);
    expect(JSON.stringify(full)).toBe(before);
    expect([full.nodes.length, full.edges.length]).toEqual([13, 26]);
  });

  it("is the same graph for the same spec, every time", () => {
    expect(jobGraph(audit)).toEqual(jobGraph(spec()));
  });
});

/** A spec file from an earlier lab, admitted through the real gate. */
function specFile(path: string): TaskSpec {
  const admission = admitTaskSpec(JSON.parse(readFileSync(new URL(path, import.meta.url), "utf8")));
  if (!admission.admitted) throw new Error(admission.rejections.join("; "));
  return admission.spec;
}

function recording(path: string): TraceEvent[] {
  return parseTrace(readFileSync(new URL(path, import.meta.url), "utf8")).map((line) => {
    if (!line.ok) throw new Error(`${path} line ${line.line}: ${line.reason}`);
    return line.event;
  });
}

/** Every recorded trace in the repo, with the spec it ran under. */
const RECORDED: Array<[trace: string, spec: TaskSpec]> = [
  ["../../07-tool-loop/traces/audit-atlas.jsonl", specFile("../../07-tool-loop/specs/audit-atlas.json")],
  ["../../07-tool-loop/traces/tight-budget.jsonl", specFile("../../07-tool-loop/specs/tight-budget.json")],
  ["../../07-tool-loop/traces/tight-deadline.jsonl", specFile("../../07-tool-loop/specs/tight-deadline.json")],
  ["../../07-tool-loop/traces/tight-deadline-resume.jsonl", specFile("../../07-tool-loop/specs/tight-deadline.json")],
  ["../../11-evidence-in-the-loop/traces/audit-atlas-grounded.jsonl", specFile("../../11-evidence-in-the-loop/specs/audit-atlas-grounded.json")],
  ["../../11-evidence-in-the-loop/traces/audit-atlas-bare.jsonl", specFile("../../11-evidence-in-the-loop/specs/audit-atlas-bare.json")],
  ["../../12-workflow-graph/traces/parked-audit.jsonl", held],
];

describe("the trace proves which graph a run stayed inside", () => {
  it.each(RECORDED)("%s walks legal and complete on its own spec's graph", (path, s) => {
    const result = walk(jobGraph(s), jobLifecycleGuards, recording(path));
    expect(result).toMatchObject({ ok: true, complete: true });
  });

  it("refuses the parked audit's trace on the audit's graph, at the approval line", () => {
    const result = walk(jobGraph(audit), jobLifecycleGuards, recording("../../12-workflow-graph/traces/parked-audit.jsonl"));
    expect(result).toEqual({
      ok: false,
      line: 5,
      from: "gating",
      to: "awaiting_approval",
      reason: "no edge gating > awaiting_approval",
    });
  });

  it("refuses the grounded trace on the bare audit's graph, at the evidence line", () => {
    const result = walk(jobGraph(audit), jobLifecycleGuards, recording("../../11-evidence-in-the-loop/traces/audit-atlas-grounded.jsonl"));
    expect(result).toMatchObject({ ok: false, line: 2, from: "started", to: "grounded" });
  });
});
