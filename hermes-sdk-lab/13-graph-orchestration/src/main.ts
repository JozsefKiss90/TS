/**
 * Exercise 13 — LangGraph.js, evaluated (lesson 0020), and the job graph
 * built from the spec (lesson 0021).
 *
 * Lessons: ../../../lessons/0020-langgraph-js-evaluated.html
 *          ../../../lessons/0021-the-spec-decides-the-graph.html
 *
 * Five parts. Run them separately:
 *   pnpm job a   — the audit on StateGraph: same report, two checkpoint records
 *   pnpm job b   — a held call paused by interrupt(), resumed by Command
 *   pnpm job c   — a resume value the verdict schema refuses
 *   pnpm job d   — three specs, three job graphs, and what each one cut
 *   pnpm job e   — runs under a job graph, and two moves it refuses
 * `pnpm job` with no argument runs a.
 *
 * Parts d and e run on lab 12's own interpreter. The swap lives only in
 * vitest.config.ts, so tsx loads lab 12's file, and `pnpm test` runs the
 * same cases on the framework (tests/job-graph-run.test.ts).
 *
 * The main measurement of lesson 0020 is not here. It is `pnpm test`, which
 * runs lab 12's 74 tests unchanged with the interpreter swapped for the
 * framework. Nothing here needs the mock, a key, or a network.
 */
import { MemorySaver } from "@langchain/langgraph";
import { FakeModelGateway } from "../../07-tool-loop/src/fake-gateway.js";
import { admitTaskSpec, type TaskSpec } from "../../07-tool-loop/src/task-spec.js";
import type { TraceEvent, TracePort } from "../../07-tool-loop/src/trace.js";
import { jobLifecycleGuards } from "../../12-workflow-graph/src/guards.js";
import type { JobResult } from "../../12-workflow-graph/src/handlers.js";
import type { Checkpoint, CheckpointPort } from "../../12-workflow-graph/src/interpreter.js";
import type { JobState } from "../../12-workflow-graph/src/job-state.js";
import { loadGraph } from "../../12-workflow-graph/src/load-graph.js";
import { parkedJobs } from "../../12-workflow-graph/src/queue.js";
import { done, wantsTool } from "../../12-workflow-graph/src/scripted-replies.js";
import { readFileSync } from "node:fs";
import { parseTrace } from "../../07-tool-loop/src/trace.js";
import { startJob } from "../../12-workflow-graph/src/handlers.js";
import { walk } from "../../12-workflow-graph/src/walker.js";
import type { WorkflowGraph } from "../../12-workflow-graph/src/workflow-graph.js";
import { dispatch } from "./dispatch.js";
import { graphForSpec, requireJobGraph } from "./graph-for-spec.js";
import { answerOnThread, frameworkCheckpoints, startOnThread, waitingAt } from "./job-thread.js";

const graph = loadGraph(new URL("../../12-workflow-graph/graphs/job-lifecycle.json", import.meta.url));

/** Lab 12's audit spec, the job every Phase 3 lesson measures. */
function auditSpec(overrides: Record<string, unknown> = {}): TaskSpec {
  const admission = admitTaskSpec({
    title: "Audit the atlas graph",
    owner: "themis",
    instruction: "Summarize the atlas graph health check in three bullet points.",
    costCeilingTokens: 2000,
    allowedTools: ["graph_health"],
    outputPath: "vault/audits/atlas.md",
    ...overrides,
  });
  if (!admission.admitted) throw new Error(admission.rejections.join("; "));
  return admission.spec;
}

function memoryTrace(): { port: TracePort; events: TraceEvent[] } {
  const events: TraceEvent[] = [];
  return { port: { append: (e) => void events.push(e) }, events };
}

function memoryCheckpoints(): { port: CheckpointPort<JobState>; saved: Checkpoint<JobState>[] } {
  const saved: Checkpoint<JobState>[] = [];
  return { port: { save: (c) => void saved.push(structuredClone(c)) }, saved };
}

function summarize(result: JobResult): string {
  if (result.ok) {
    const r = result.report;
    return `${r.outcome}, ${r.modelCalls} calls, ${r.tokensSpent} tokens, tools: ${r.toolRuns.join("; ")}`;
  }
  if (result.kind === "parked") return `parked at ${result.node}, step ${result.step}`;
  return `refused: ${result.kind} ${result.from} > ${result.to} at step ${result.step}`;
}

async function partA_sameJobTwoRecords(): Promise<void> {
  console.log("\n=== A. The audit on StateGraph: same report, two checkpoint records ===");
  const saver = new MemorySaver();
  const trace = memoryTrace();
  const checkpoints = memoryCheckpoints();
  const gateway = new FakeModelGateway([wantsTool, done]);
  const result = await startOnThread(graph, auditSpec(), gateway, {
    saver,
    thread: "audit-a",
    trace: trace.port,
    checkpoints: checkpoints.port,
  });
  console.log(`result                 : ${summarize(result)}`);
  console.log(`trace                  : ${trace.events.map((e) => e.kind).join(" > ")}`);
  console.log(`walks                  : ${JSON.stringify(walk(graph, jobLifecycleGuards, trace.events))}`);
  console.log(`lab 12 checkpoints     : ${checkpoints.saved.length} (one per move)`);
  console.log(`framework checkpoints  : ${await frameworkCheckpoints(saver, "audit-a")} (one per framework step, plus the input)`);
}

async function partB_pausedAndResumed(): Promise<void> {
  console.log("\n=== B. A held call paused by interrupt(), resumed by Command ===");
  const saver = new MemorySaver();
  const trace = memoryTrace();
  const checkpoints = memoryCheckpoints();
  const held = auditSpec({ approvalRequired: ["graph_health"] });

  const first = new FakeModelGateway([wantsTool]);
  const paused = await startOnThread(graph, held, first, {
    saver,
    thread: "audit-b",
    trace: trace.port,
    checkpoints: checkpoints.port,
  });
  console.log(`paused                 : ${summarize(paused)}, ${first.calls.length} model call`);
  console.log(`framework says waiting : ${JSON.stringify(await waitingAt(graph, saver, "audit-b"))}`);
  console.log(`lab 12 queue says      : ${parkedJobs(checkpoints.saved).map((c) => `${c.job} at step ${c.step}`).join(", ")}`);

  const resumed = await answerOnThread(graph, held, new FakeModelGateway([done]), "approved", {
    saver,
    thread: "audit-b",
    trace: trace.port,
    checkpoints: checkpoints.port,
  });
  console.log(`resumed                : ${summarize(resumed)}`);
  console.log(`trace                  : ${trace.events.length} lines, ${JSON.stringify(walk(graph, jobLifecycleGuards, trace.events))}`);
  console.log(`lab 12 checkpoint steps: ${checkpoints.saved.map((c) => c.step).join(", ")}`);
  console.log(`framework checkpoints  : ${await frameworkCheckpoints(saver, "audit-b")}`);
  // A checkpoint file holds the latest save only, so the queue reads that one.
  const latest = checkpoints.saved.slice(-1);
  console.log(`lab 12 queue after     : ${parkedJobs(latest).length} waiting (latest checkpoint at ${latest[0]?.node ?? "none"})`);
}

async function partC_refusedAnswer(): Promise<void> {
  console.log("\n=== C. A resume value the verdict schema refuses ===");
  const saver = new MemorySaver();
  const trace = memoryTrace();
  const held = auditSpec({ approvalRequired: ["graph_health"] });
  await startOnThread(graph, held, new FakeModelGateway([wantsTool]), { saver, thread: "audit-c", trace: trace.port });
  try {
    await answerOnThread(graph, held, new FakeModelGateway([done]), "maybe", { saver, thread: "audit-c", trace: trace.port });
    console.log("accepted (unexpected)");
  } catch (error) {
    const issues = (error as { issues?: Array<{ code: string; message: string }> }).issues;
    const reason = issues?.map((i) => `${i.code}: ${i.message}`).join("; ") ?? String(error);
    console.log(`refused                : ${error instanceof Error ? error.name : "error"}, ${reason}`);
  }
  console.log(`trace                  : ${trace.events.length} lines, unchanged`);
  console.log(`framework says waiting : ${JSON.stringify(await waitingAt(graph, saver, "audit-c"))}`);
}

const jobGraph = (spec: TaskSpec): WorkflowGraph => requireJobGraph(graph, spec);

/** The three specs parts d and e run: the plain audit, one tool held, and evidence asked for. */
const heldSpec = (): TaskSpec => auditSpec({ approvalRequired: ["graph_health"] });
const groundedSpec = (): TaskSpec => auditSpec({ evidenceQueries: ["supervisor", "trace"], evidenceLimit: 3 });
const specs = (): Array<[string, TaskSpec]> => [
  ["audit", auditSpec()],
  ["held", heldSpec()],
  ["grounded", groundedSpec()],
];

async function partD_threeSpecsThreeGraphs(): Promise<void> {
  console.log("\n=== D. Three specs, three job graphs ===");
  console.log(`full graph             : ${graph.nodes.length} nodes, ${graph.edges.length} edges, ${graph.guards.length} guards`);
  for (const [name, spec] of specs()) {
    // graphForSpec rather than jobGraph: this part prints the cuts too.
    const built = graphForSpec(graph, spec);
    if (!built.admitted) throw new Error(built.rejections.join("; "));
    const g = built.graph;
    console.log(`\n${name.padEnd(23)}: ${g.nodes.length} nodes, ${g.edges.length} edges, ${g.guards.length} guards`);
    for (const cut of built.cuts) {
      const what = [...cut.nodes.map((n) => `node ${n}`), `${cut.edges.length} edge(s)`].join(", ");
      console.log(`  cut by ${cut.field.padEnd(16)}: ${what}, because ${cut.because}`);
    }
    if (built.cuts.length === 0) console.log("  nothing cut");
  }
}

async function partE_runsUnderTheJobGraph(): Promise<void> {
  console.log("\n=== E. Runs under a job graph, on lab 12's interpreter ===");

  const trace = memoryTrace();
  const landed = await dispatch(graph, auditSpec(), new FakeModelGateway([wantsTool, done]), { trace: trace.port });
  console.log(`audit, dispatched      : ${summarize(landed)}`);
  console.log(`walks its job graph    : ${JSON.stringify(walk(jobGraph(auditSpec()), jobLifecycleGuards, trace.events))}`);

  // The audit's graph, handed a spec that holds graph_health. A gate that
  // disagrees with the spec is what this stands for.
  const holdTrace = memoryTrace();
  const holdCheckpoints = memoryCheckpoints();
  const gateway = new FakeModelGateway([wantsTool, done]);
  const refusedHold = await startJob(jobGraph(auditSpec()), heldSpec(), gateway, {
    park: true,
    trace: holdTrace.port,
    checkpoints: holdCheckpoints.port,
  });
  console.log(`\nhold on audit's graph  : ${summarize(refusedHold)}`);
  console.log(`  model calls made     : ${gateway.calls.length} of the 2 the script held`);
  console.log(`  trace                : ${holdTrace.events.map((e) => e.kind).join(" > ")}`);
  console.log(`  last checkpoint      : step ${holdCheckpoints.saved.at(-1)?.step}, node ${holdCheckpoints.saved.at(-1)?.node}`);

  // The evidence job's graph, handed a spec and a run with no pack.
  const bare = new FakeModelGateway([done]);
  const refusedCall = await startJob(jobGraph(groundedSpec()), auditSpec(), bare);
  console.log(`\nno pack, grounded graph: ${summarize(refusedCall)}, ${bare.calls.length} model calls`);

  // A trace recorded under the held spec, read against the audit's graph.
  const parked = parseTrace(
    readFileSync(new URL("../../12-workflow-graph/traces/parked-audit.jsonl", import.meta.url), "utf8"),
  ).flatMap((line) => (line.ok ? [line.event] : []));
  const held = heldSpec();
  console.log(`\nparked-audit.jsonl     : ${parked.length} lines`);
  console.log(`  on the held graph    : ${JSON.stringify(walk(jobGraph(held), jobLifecycleGuards, parked))}`);
  console.log(`  on the audit's graph : ${JSON.stringify(walk(jobGraph(auditSpec()), jobLifecycleGuards, parked))}`);
}

const parts: Record<string, () => Promise<void>> = {
  a: partA_sameJobTwoRecords,
  b: partB_pausedAndResumed,
  c: partC_refusedAnswer,
  d: partD_threeSpecsThreeGraphs,
  e: partE_runsUnderTheJobGraph,
};

const which = process.argv[2] ?? "a";
const part = parts[which];
if (part === undefined) {
  console.error(`unknown part "${which}"; use one of: ${Object.keys(parts).join(", ")}`);
  process.exit(1);
}
await part();
