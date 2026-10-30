/**
 * DISPATCH — a job runs under the graph its own spec builds (lesson 0021).
 *
 * The only wiring that matters here is that one spec value feeds both
 * sides: `requireJobGraph` cuts the graph from it, and `startJob` hands it
 * to the handlers. A run started any other way can disagree with its
 * graph, and the tests do that on purpose to show the graph refusing.
 */
import type { ModelGateway } from "../../07-tool-loop/src/gateway.js";
import type { TaskSpec } from "../../07-tool-loop/src/task-spec.js";
import { startJob, type JobOptions, type JobResult } from "../../12-workflow-graph/src/handlers.js";
import type { WorkflowGraph } from "../../12-workflow-graph/src/workflow-graph.js";
import { requireJobGraph } from "./graph-for-spec.js";

export function dispatch(
  full: WorkflowGraph,
  spec: TaskSpec,
  gateway: ModelGateway,
  options?: JobOptions,
): Promise<JobResult> {
  return startJob(requireJobGraph(full, spec), spec, gateway, options);
}
