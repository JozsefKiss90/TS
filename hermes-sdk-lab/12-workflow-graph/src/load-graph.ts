/**
 * Reads a graph file and admits it, or throws with every reason (lesson 0017).
 *
 * Wiring, not domain code: it knows about files. The parse it calls is the
 * same one a test calls with an in-memory candidate.
 */
import { readFileSync } from "node:fs";
import { admitWorkflowGraph, type WorkflowGraph } from "./workflow-graph.js";

export function loadGraph(path: URL): WorkflowGraph {
  const raw: unknown = JSON.parse(readFileSync(path, "utf8"));
  const admission = admitWorkflowGraph(raw);
  if (!admission.admitted) {
    throw new Error(`graph refused at ${path.pathname}:\n  ${admission.rejections.join("\n  ")}`);
  }
  return admission.graph;
}
