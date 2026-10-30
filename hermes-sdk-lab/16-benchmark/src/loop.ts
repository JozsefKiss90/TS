/**
 * The loop under test (lesson 0025), as one function type.
 *
 * The runner never names lab 12's internals. It receives a Loop and calls
 * it. The real loop is lab 12's startJob on lab 12's graph file. A planted
 * defect (defects.ts) is another Loop with one change, so the runner and
 * the graders cannot tell which one they were given.
 */
import type { ModelGateway } from "../../07-tool-loop/src/gateway.js";
import type { TaskSpec } from "../../07-tool-loop/src/task-spec.js";
import { startJob, type JobOptions, type JobResult } from "../../12-workflow-graph/src/handlers.js";
import { loadGraph } from "../../12-workflow-graph/src/load-graph.js";

export type Loop = (spec: TaskSpec, gateway: ModelGateway, options: JobOptions) => Promise<JobResult>;

/** A loop and the name the scorecard prints for it. */
export interface NamedLoop {
  name: string;
  run: Loop;
}

const GRAPH = loadGraph(new URL("../../12-workflow-graph/graphs/job-lifecycle.json", import.meta.url));

export const REAL_LOOP: NamedLoop = {
  name: "real",
  run: (spec, gateway, options) => startJob(GRAPH, spec, gateway, options),
};
