/**
 * The JOB GRAPH — one job's workflow graph, built from its TaskSpec
 * (lesson 0021).
 *
 * Lab 12 runs every job under one graph of 13 nodes and 26 edges. That
 * graph holds every path any spec could need, so the audit, which holds
 * nothing for approval, still has an edge into `awaiting_approval`. The
 * edge stays closed only because `gateToolCall` never answers "hold" for
 * it. This file moves that fact out of the gate code and into the graph:
 * before the job starts, the nodes and edges its spec makes unreachable
 * are cut.
 *
 * Three rules, each read from one spec field. Each is a fact about lab
 * 12's handlers, checked against them:
 *
 *   approvalRequired empty — `gating` can never answer "hold", so no run
 *                            enters `awaiting_approval`. This is Hermes's
 *                            --no-writeback audit: lab 07's spec has no
 *                            writeback flag, so the job that may hold
 *                            nothing is a spec with this list empty.
 *   evidenceQueries empty  — `started` moves to `grounded` only when a pack
 *                            matches the spec's queries, and no pack
 *                            matches an empty list.
 *   evidenceQueries listed — `started` moves straight to `calling` only
 *                            with no pack and no queries. With queries
 *                            listed, no pack means `no_evidence`, so the
 *                            edge that skips `grounded` is cut. S2's "no
 *                            pack, no dispatch" becomes a missing edge.
 *
 * What no rule cuts: `gating` and `tool_ran`, even when allowedTools is
 * empty. The model's reply is untrusted output and may name a tool the
 * spec never offered (lesson 0008), so the gate must still run and refuse.
 * And `no_evidence`, because a pack the spec never asked for still ends
 * there.
 *
 * The result is admitted through `admitWorkflowGraph`, the parse the
 * graph file goes through. So a job graph is held to the same strict
 * shape: names only, no claims, no events.
 */
import type { TaskSpec } from "../../07-tool-loop/src/task-spec.js";
import { admitWorkflowGraph, type WorkflowGraph } from "../../12-workflow-graph/src/workflow-graph.js";

/** One spec-driven removal: the field that caused it, and what it removed. */
export interface Cut {
  field: "approvalRequired" | "evidenceQueries";
  because: string;
  nodes: string[];
  /** Each removed edge, as "from>to". */
  edges: string[];
}

export type JobGraph =
  | { admitted: true; graph: WorkflowGraph; cuts: Cut[] }
  | { admitted: false; rejections: string[] };

/** What a rule asks to remove. Edges touching a removed node go with it. */
interface Rule {
  field: Cut["field"];
  because: string;
  applies: (spec: TaskSpec) => boolean;
  nodes: string[];
  edges: Array<[from: string, to: string]>;
}

const RULES: Rule[] = [
  {
    field: "approvalRequired",
    because: "no tool is held for approval, so the gate never answers hold",
    applies: (spec) => spec.approvalRequired.length === 0,
    nodes: ["awaiting_approval"],
    edges: [],
  },
  {
    field: "evidenceQueries",
    because: "no evidence is asked for, so no pack can ground the job",
    applies: (spec) => spec.evidenceQueries.length === 0,
    nodes: ["grounded"],
    edges: [],
  },
  {
    field: "evidenceQueries",
    because: "evidence is asked for, so no model call may start before it is used",
    applies: (spec) => spec.evidenceQueries.length > 0,
    nodes: [],
    edges: [["started", "calling"]],
  },
];

/**
 * Builds the job's graph. Pure: the full graph is not changed, and the
 * same spec gives the same graph. Guards no remaining edge cites are
 * dropped, so the job graph names only rules its job can meet.
 */
export function graphForSpec(full: WorkflowGraph, spec: TaskSpec): JobGraph {
  let nodes = [...full.nodes];
  let edges = [...full.edges];
  const cuts: Cut[] = [];

  for (const rule of RULES) {
    if (!rule.applies(spec)) continue;
    const isRemoved = (e: { from: string; to: string }): boolean =>
      rule.nodes.includes(e.from) ||
      rule.nodes.includes(e.to) ||
      rule.edges.some(([from, to]) => e.from === from && e.to === to);

    const removed = edges.filter(isRemoved);
    const removedNodes = rule.nodes.filter((n) => nodes.includes(n));
    if (removed.length === 0 && removedNodes.length === 0) continue;

    nodes = nodes.filter((n) => !rule.nodes.includes(n));
    edges = edges.filter((e) => !isRemoved(e));
    cuts.push({
      field: rule.field,
      because: rule.because,
      nodes: removedNodes,
      edges: removed.map((e) => `${e.from}>${e.to}`),
    });
  }

  const cited = new Set(edges.map((e) => e.guard).filter((g): g is string => g !== undefined));
  const admission = admitWorkflowGraph({
    name: `${full.name}, for ${spec.title}`,
    nodes,
    start: full.start,
    terminal: full.terminal.filter((n) => nodes.includes(n)),
    guards: full.guards.filter((g) => cited.has(g)),
    edges,
  });
  if (!admission.admitted) return admission;
  return { admitted: true, graph: admission.graph, cuts };
}

/**
 * The job graph, or a thrown refusal. A refused job graph is a wiring
 * fault, like a graph file `loadGraph` refuses. With lab 12's file no
 * spec produces one.
 */
export function requireJobGraph(full: WorkflowGraph, spec: TaskSpec): WorkflowGraph {
  const built = graphForSpec(full, spec);
  if (!built.admitted) {
    throw new Error(`job graph refused for "${spec.title}":\n  ${built.rejections.join("\n  ")}`);
  }
  return built.graph;
}
