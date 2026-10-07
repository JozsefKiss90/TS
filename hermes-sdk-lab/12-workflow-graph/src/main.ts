/**
 * Exercise 12 — thinking in state graphs (lesson 0017) and the loop that
 * walks the graph (lesson 0018).
 *
 * Lessons: ../../../lessons/0017-thinking-in-state-graphs.html
 *          ../../../lessons/0018-the-loop-walks-the-graph.html
 *
 * Six parts. Run them separately:
 *   pnpm job a   — the graph, parsed from disk: nodes, edges, guards
 *   pnpm job b   — six recorded runs replayed against it, zero model calls
 *   pnpm job c   — the graph's rules, each broken on purpose
 * Lesson 0018 adds three:
 *   pnpm job d   — the same job run by the graph and by the supervisor
 *   pnpm job e   — an edge removed from the file: a typed refusal
 *   pnpm job f   — a job killed mid-run, resumed from its checkpoint file
 * `pnpm job` with no argument runs a.
 *
 * Nothing here needs the mock, a key, or a network. The recordings are
 * exercise 07's and exercise 11's trace files, read back through the
 * parse lesson 0011 built. Parts d to f use the fake gateway of lab 07.
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import type { ApprovalPort } from "../../07-tool-loop/src/approval.js";
import { FakeModelGateway } from "../../07-tool-loop/src/fake-gateway.js";
import { runTask } from "../../07-tool-loop/src/supervisor.js";
import { admitTaskSpec, type TaskSpec } from "../../07-tool-loop/src/task-spec.js";
import { rebuildResumePoint, type TraceEvent, type TracePort } from "../../07-tool-loop/src/trace.js";
import { admitCheckpoint, type JobCheckpoint } from "./checkpoint.js";
import { jobLifecycleGuards } from "./guards.js";
import { resumeJob, startJob } from "./handlers.js";
import type { CheckpointPort } from "./interpreter.js";
import type { JobState } from "./job-state.js";
import { loadGraph } from "./load-graph.js";
import { GROUNDED_RECORDING, RECORDINGS, readRecording, recordingName } from "./recordings.js";
import { done, wantsTool } from "./scripted-replies.js";
import { walk } from "./walker.js";
import { admitWorkflowGraph } from "./workflow-graph.js";

const GRAPH_PATH = new URL("../graphs/job-lifecycle.json", import.meta.url);
const CHECKPOINT_DIR = new URL("../checkpoints/", import.meta.url);

function partA_theGraph(): void {
  console.log("\n=== A. The graph, parsed from disk ===");
  const graph = loadGraph(GRAPH_PATH);

  console.log(`name     : ${graph.name}`);
  console.log(`nodes    : ${graph.nodes.length}, start at "${graph.start}"`);
  console.log(`terminal : ${graph.terminal.join(", ")}`);
  console.log(`guards   : ${graph.guards.join(", ")}`);
  console.log(`edges    : ${graph.edges.length}`);

  console.log("\nedges by node:");
  for (const node of graph.nodes) {
    const out = graph.edges.filter((e) => e.from === node);
    if (out.length === 0) continue;
    const list = out.map((e) => (e.guard ? `${e.to} [${e.guard}]` : e.to)).join(", ");
    console.log(`  ${node.padEnd(18)} > ${list}`);
  }

  console.log(
    "\nSix fields, every one a name or a list of names. No claim, no event, " +
      "no timestamp, no token count can live in this file.",
  );
}

function partB_replayTheRecordings(): void {
  console.log("\n=== B. Six recorded runs, replayed (no model, no mock) ===");
  const graph = loadGraph(GRAPH_PATH);
  const taken = new Set<string>();

  for (const path of RECORDINGS) {
    const name = recordingName(path);
    const events = readRecording(path);
    const result = walk(graph, jobLifecycleGuards, events);
    if (!result.ok) {
      console.log(`  ${name.padEnd(30)} REFUSED at line ${result.line}: ${result.reason}`);
      continue;
    }
    for (const edge of result.edgesTaken) taken.add(edge);
    const status = result.complete ? "legal, complete" : "legal, cut short";
    console.log(`  ${name.padEnd(30)} ${status}, ${events.length} events`);
    console.log(`  ${"".padEnd(30)} ${result.path.join(" > ")}`);
  }

  console.log(`\n${taken.size} of ${graph.edges.length} edges taken by the recordings:`);
  console.log(`  ${[...taken].sort().join(", ")}`);
  const untaken = graph.edges
    .map((e) => `${e.from}>${e.to}`)
    .filter((edge) => !taken.has(edge));
  console.log(`\n${untaken.length} edges drawn from supervisor.ts that no recording took:`);
  console.log(`  ${untaken.join(", ")}`);
  console.log("\nmodel calls made by this part: 0");
}

function partC_theRulesBroken(): void {
  console.log("\n=== C. The graph's rules, each broken on purpose ===");
  const raw = JSON.parse(readFileSync(GRAPH_PATH, "utf8")) as Record<string, unknown>;
  const edges = raw["edges"] as Array<Record<string, string>>;

  const cases: Array<[string, unknown]> = [
    ["start not declared", { ...raw, start: "requested" }],
    [
      "edge to an unknown node",
      { ...raw, edges: [...edges, { from: "calling", to: "published" }] },
    ],
    [
      "edge with an unknown guard",
      { ...raw, edges: [...edges, { from: "calling", to: "replied", guard: "moon_is_full" }] },
    ],
    [
      "edge out of a terminal",
      { ...raw, edges: [...edges, { from: "landed", to: "calling" }] },
    ],
    ["a claim in the graph", { ...raw, claims: [{ id: "MOD-004", claim: "..." }] }],
    ["an event in the graph", { ...raw, events: [{ kind: "job_started" }] }],
  ];

  for (const [name, candidate] of cases) {
    const admission = admitWorkflowGraph(candidate);
    const verdict = admission.admitted ? "ADMITTED" : admission.rejections.join(" | ");
    console.log(`  ${name.padEnd(26)} > ${verdict}`);
  }

  console.log("\nAnd one legal graph with an illegal run:");
  const graph = loadGraph(GRAPH_PATH);
  const events = readRecording(GROUNDED_RECORDING);
  const [started, evidence, call, ...rest] = events;
  if (started && evidence && call) {
    const result = walk(graph, jobLifecycleGuards, [started, call, evidence, ...rest]);
    if (!result.ok) {
      console.log(`  evidence line moved after call 1 > REFUSED at line ${result.line}: ${result.reason}`);
    }
  }
}

// ---------------------------------------------------------------- lesson 0018

/** The audit spec of lab 11's tests, admitted through the real gate. */
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


/** A trace sink that keeps every event in memory, in order. */
function memoryTrace(): { port: TracePort; events: TraceEvent[] } {
  const events: TraceEvent[] = [];
  return { port: { append: (event) => void events.push(event) }, events };
}

/**
 * The wiring's checkpoint sink: one file per job, REPLACED on every step.
 * Compare the trace sink in lab 07, which APPENDS one line per event and
 * never rewrites one. A checkpoint is where the run is. A trace is what
 * the run did. The file names say which is which.
 */
function fileCheckpoint(name: string): { port: CheckpointPort<JobState>; path: string } {
  mkdirSync(CHECKPOINT_DIR, { recursive: true });
  const path = fileURLToPath(new URL(name, CHECKPOINT_DIR));
  return {
    path,
    port: { save: (checkpoint) => writeFileSync(path, JSON.stringify(checkpoint, null, 2)) },
  };
}

/** Reads a checkpoint back. Bytes on disk are parsed, never cast. */
function readCheckpoint(path: string): JobCheckpoint {
  const admission = admitCheckpoint(JSON.parse(readFileSync(path, "utf8")));
  if (!admission.admitted) throw new Error(admission.rejections.join("; "));
  return admission.checkpoint;
}

const kinds = (events: TraceEvent[]): string => events.map((e) => e.kind).join(" > ");

async function partD_theSameJobRunByTheGraph(): Promise<void> {
  console.log("\n=== D. The same job, run by the supervisor and by the graph ===");
  const graph = loadGraph(GRAPH_PATH);
  const spec = auditSpec();

  const byCode = memoryTrace();
  const report1 = await runTask(new FakeModelGateway([wantsTool, done]), spec, { trace: byCode.port });

  const byGraph = memoryTrace();
  const steps: string[] = [];
  const result = await startJob(graph, spec, new FakeModelGateway([wantsTool, done]), {
    trace: byGraph.port,
    checkpoints: { save: (c) => void steps.push(`${c.step}:${c.node}`) },
  });
  if (!result.ok) {
    console.log("refused:", result);
    return;
  }

  console.log("supervisor.ts :", report1);
  console.log("by the graph  :", result.report);
  console.log(`\nsame report   : ${JSON.stringify(report1) === JSON.stringify(result.report)}`);
  console.log(`events, code  : ${kinds(byCode.events)}`);
  console.log(`events, graph : ${kinds(byGraph.events)}`);
  console.log(`\ncheckpoints   : ${steps.join("  ")}`);
  const verdict = walk(graph, jobLifecycleGuards, byGraph.events);
  console.log(`walked        : ${verdict.ok ? `legal, ${verdict.complete ? "complete" : "cut short"}` : verdict.reason}`);
  console.log(
    "\nSame report, same events, one checkpoint per step. The if statements " +
      "that chose the next node are gone; the graph chose it.",
  );
}

async function partE_anEdgeTheGraphDoesNotHold(): Promise<void> {
  console.log("\n=== E. An edge removed from the file: a typed refusal ===");
  const raw = JSON.parse(readFileSync(GRAPH_PATH, "utf8")) as { edges: Array<{ from: string; to: string }> };
  raw.edges = raw.edges.filter((e) => !(e.from === "tool_ran" && e.to === "calling"));
  const admission = admitWorkflowGraph(raw);
  if (!admission.admitted) {
    console.log("refused:", admission.rejections);
    return;
  }

  const gateway = new FakeModelGateway([wantsTool, done]);
  const { port, events } = memoryTrace();
  let last = "(none)";
  const result = await startJob(admission.graph, auditSpec(), gateway, {
    trace: port,
    checkpoints: { save: (c) => void (last = `step ${c.step}, node ${c.node}`) },
  });

  console.log("edge removed    : tool_ran > calling");
  console.log("result          :", result);
  console.log(`model calls made: ${gateway.calls.length} of the 2 the script held`);
  console.log(`events          : ${kinds(events)}`);
  console.log(`last checkpoint : ${last}`);
  console.log(
    "\nThe tool ran, its result was recorded, and the move to call 2 was refused " +
      "before the call. No job_ended: the record is cut short, and the refusal " +
      "says where. Lesson 0017's walker could only find this after the run.",
  );
}

async function partF_killedAndResumed(): Promise<void> {
  console.log("\n=== F. A job killed mid-run, resumed from its checkpoint file ===");
  const graph = loadGraph(GRAPH_PATH);
  const spec = auditSpec({ approvalRequired: ["graph_health"] });

  const { port, events } = memoryTrace();
  const { port: checkpoints, path } = fileCheckpoint("audit-atlas.json");
  const dying: ApprovalPort = { decide: () => Promise.reject(new Error("process died")) };

  console.log("run 1: the operator is asked, and the process dies during the wait");
  try {
    await startJob(graph, spec, new FakeModelGateway([wantsTool]), {
      trace: port,
      checkpoints,
      approver: dying,
    });
  } catch (error) {
    console.log(`  crashed         : ${error instanceof Error ? error.message : String(error)}`);
  }
  console.log(`  trace so far    : ${kinds(events)}`);

  const checkpoint = readCheckpoint(path);
  console.log(`  checkpoint file : ${path}`);
  console.log(
    `  read back       : step ${checkpoint.step}, node ${checkpoint.node}, ` +
      `${checkpoint.state.pending.length} pending call, gate ${checkpoint.state.gate}, ` +
      `${checkpoint.state.modelCalls} call, ${checkpoint.state.tokensSpent} tokens`,
  );

  console.log("\nresume 1, lesson 0011's way: rebuild from the trace, run the supervisor");
  const point = rebuildResumePoint(events);
  if (point === null) {
    console.log("  no job_started in the trace");
    return;
  }
  console.log(
    `  rebuilt         : turns ${point.transcript.map((t) => t.from).join(" > ")}, ` +
      `${point.modelCalls} call, ${point.tokensSpent} tokens`,
  );
  const approved: ApprovalPort = { decide: () => Promise.resolve("approved") };
  const byTrace = await runTask(new FakeModelGateway([wantsTool, done]), spec, {
    resume: point,
    approver: approved,
  });
  console.log(`  result          : ${byTrace.outcome}, ${byTrace.modelCalls} model calls, ${byTrace.tokensSpent} tokens`);

  console.log("\nresume 2, lesson 0018's way: continue from the checkpoint, same trace");
  const byCheckpoint = await resumeJob(graph, checkpoint, spec, new FakeModelGateway([done]), {
    trace: port,
    approver: approved,
  });
  if (!byCheckpoint.ok) {
    console.log("  refused:", byCheckpoint);
    return;
  }
  const r = byCheckpoint.report;
  console.log(`  result          : ${r.outcome}, ${r.modelCalls} model calls, ${r.tokensSpent} tokens`);
  console.log(`  whole trace     : ${kinds(events)}`);
  const verdict = walk(graph, jobLifecycleGuards, events);
  console.log(`  walked          : ${verdict.ok ? `legal, ${verdict.complete ? "complete" : "cut short"}` : verdict.reason}`);
  console.log(
    "\nThe trace dropped the unanswered ask and asked the model again: three " +
      "calls. The checkpoint kept the ask and asked the operator again: two " +
      "calls. Neither recovered the time the first wait took.",
  );
}

const part = (process.argv[2] ?? "a").toLowerCase();
if (part === "a") partA_theGraph();
else if (part === "b") partB_replayTheRecordings();
else if (part === "c") partC_theRulesBroken();
else if (part === "d") await partD_theSameJobRunByTheGraph();
else if (part === "e") await partE_anEdgeTheGraphDoesNotHold();
else if (part === "f") await partF_killedAndResumed();
else console.log(`unknown part "${part}" — try a to f`);

