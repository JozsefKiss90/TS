/**
 * The workflow graph's rules, written before the schema that enforces them
 * (lesson 0017). A graph is data at a JSON boundary, so it is admitted by a
 * parse like a spec, a pack or a trace line, and refused with reasons.
 */
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { admitWorkflowGraph, WorkflowGraphSchema } from "../src/workflow-graph.js";
import { smallGraph } from "./helpers.js";

describe("the graph's admissibility rules", () => {
  it("admits a small graph and keeps its edges in order", () => {
    const admission = admitWorkflowGraph(smallGraph());
    expect(admission.admitted).toBe(true);
    if (!admission.admitted) return;
    expect(admission.graph.edges.map((e) => `${e.from}>${e.to}`)).toEqual([
      "started>calling",
      "calling>landed",
    ]);
  });

  it("refuses a start node the graph does not declare", () => {
    const admission = admitWorkflowGraph({ ...smallGraph(), start: "nowhere" });
    expect(admission.admitted).toBe(false);
    if (admission.admitted) return;
    expect(admission.rejections.join(" ")).toContain("start");
  });

  it("refuses an edge that leaves or enters an undeclared node", () => {
    const graph = smallGraph();
    graph["edges"] = [{ from: "started", to: "elsewhere" }];
    const admission = admitWorkflowGraph(graph);
    expect(admission.admitted).toBe(false);
    if (admission.admitted) return;
    expect(admission.rejections.join(" ")).toContain("elsewhere");
  });

  it("refuses an edge whose guard the graph does not declare", () => {
    const graph = smallGraph();
    graph["edges"] = [{ from: "started", to: "calling", guard: "moon_is_full" }];
    const admission = admitWorkflowGraph(graph);
    expect(admission.admitted).toBe(false);
    if (admission.admitted) return;
    expect(admission.rejections.join(" ")).toContain("moon_is_full");
  });

  it("refuses an edge that leaves a terminal node", () => {
    const graph = smallGraph();
    graph["edges"] = [
      { from: "started", to: "landed" },
      { from: "landed", to: "calling" },
    ];
    const admission = admitWorkflowGraph(graph);
    expect(admission.admitted).toBe(false);
    if (admission.admitted) return;
    expect(admission.rejections.join(" ")).toContain("terminal");
  });

  it("refuses a node name that is not a lowercase identifier", () => {
    const graph = smallGraph();
    graph["nodes"] = ["started", "Calling", "landed"];
    const admission = admitWorkflowGraph(graph);
    expect(admission.admitted).toBe(false);
  });
});

describe("the graph holds no claims and no events", () => {
  it("refuses a graph that carries claims", () => {
    const admission = admitWorkflowGraph({
      ...smallGraph(),
      claims: [{ id: "MOD-004", claim: "Job supervisor loop is implemented (module)." }],
    });
    expect(admission.admitted).toBe(false);
    if (admission.admitted) return;
    expect(admission.rejections.join(" ")).toContain("claims");
  });

  it("refuses a graph that carries events", () => {
    const admission = admitWorkflowGraph({
      ...smallGraph(),
      events: [{ kind: "job_started", at: 0 }],
    });
    expect(admission.admitted).toBe(false);
    if (admission.admitted) return;
    expect(admission.rejections.join(" ")).toContain("events");
  });

  it("declares only names, edges and guards, and nothing with a value", () => {
    // The shape itself is the proof: six keys, every one a name or a list
    // of names. No field can hold a claim, a timestamp or a token count.
    const keys = Object.keys(WorkflowGraphSchema.shape).sort();
    expect(keys).toEqual(["edges", "guards", "name", "nodes", "start", "terminal"]);
  });
});

describe("the job lifecycle graph on disk", () => {
  const raw: unknown = JSON.parse(
    readFileSync(new URL("../graphs/job-lifecycle.json", import.meta.url), "utf8"),
  );

  it("is admitted", () => {
    const admission = admitWorkflowGraph(raw);
    expect(admission.admitted).toBe(true);
  });

  it("names every outcome the supervisor can report as a terminal node", () => {
    const admission = admitWorkflowGraph(raw);
    if (!admission.admitted) throw new Error(admission.rejections.join("; "));
    expect([...admission.graph.terminal].sort()).toEqual([
      "gave_up",
      "landed",
      "no_evidence",
      "out_of_time",
      "over_budget",
      "retry_later",
    ]);
  });

  it("gives every node except the terminals a way out", () => {
    const admission = admitWorkflowGraph(raw);
    if (!admission.admitted) throw new Error(admission.rejections.join("; "));
    const { graph } = admission;
    const exits = new Set(graph.edges.map((e) => e.from));
    for (const node of graph.nodes) {
      if (graph.terminal.includes(node)) continue;
      expect(exits.has(node), `${node} has no exit`).toBe(true);
    }
  });
});
