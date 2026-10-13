/**
 * Exercise 12 — thinking in state graphs (lesson 0017) and the loop that
 * walks the graph (lesson 0018).
 *
 * Lessons: ../../../lessons/0017-thinking-in-state-graphs.html
 *          ../../../lessons/0018-the-loop-walks-the-graph.html
 *          ../../../lessons/0019-interruption-is-a-state.html
 *
 * Ten parts. Run them separately:
 *   pnpm job a   — the graph, parsed from disk: nodes, edges, guards
 *   pnpm job b   — six recorded runs replayed against it, zero model calls
 *   pnpm job c   — the graph's rules, each broken on purpose
 * Lesson 0018 adds three:
 *   pnpm job d   — the same job run by the graph and by the supervisor
 *   pnpm job e   — an edge removed from the file: a typed refusal
 *   pnpm job f   — a job killed mid-run, resumed from its checkpoint file
 * Lesson 0019 adds four, each a separate process on purpose:
 *   pnpm job g   — a held call parks the run; the process exits
 *   pnpm job h   — the queue: every checkpoint that waits for a verdict
 *   pnpm job i approved|denied — the verdict, written into the checkpoint
 *   pnpm job j   — the parked run resumed, continuing the same trace file
 * `pnpm job` with no argument runs a.
 *
 * Nothing here needs the mock, a key, or a network. The recordings are
 * exercise 07's and exercise 11's trace files, read back through the
 * parse lesson 0011 built. Parts d to f use the fake gateway of lab 07.
 */
import { appendFileSync, existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import type { ApprovalPort } from "../../07-tool-loop/src/approval.js";
import { FakeModelGateway } from "../../07-tool-loop/src/fake-gateway.js";
import { runTask } from "../../07-tool-loop/src/supervisor.js";
import { admitTaskSpec, type TaskSpec } from "../../07-tool-loop/src/task-spec.js";
import { parseTrace, rebuildResumePoint, type TraceEvent, type TracePort } from "../../07-tool-loop/src/trace.js";
import { admitCheckpoint, type CheckpointAdmission, type JobCheckpoint } from "./checkpoint.js";
import { jobLifecycleGuards } from "./guards.js";
import { resumeJob, startJob, type JobResult } from "./handlers.js";
import type { CheckpointPort } from "./interpreter.js";
import type { JobState } from "./job-state.js";
import { loadGraph } from "./load-graph.js";
import { answerParked, parkedJobs } from "./queue.js";
import { GROUNDED_RECORDING, RECORDINGS, readRecording, recordingName } from "./recordings.js";
import { done, wantsTool } from "./scripted-replies.js";
import { walk } from "./walker.js";
import { admitWorkflowGraph } from "./workflow-graph.js";

const GRAPH_PATH = new URL("../graphs/job-lifecycle.json", import.meta.url);
const CHECKPOINT_DIR = new URL("../checkpoints/", import.meta.url);
const TRACE_DIR = new URL("../traces/", import.meta.url);

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

// ---------------------------------------------------------------- lesson 0019

/** The parked job's two files. Three processes read and write them in turn. */
const PARKED_CHECKPOINT = "parked-audit.json";
const PARKED_TRACE = "parked-audit.jsonl";

/**
 * The trace sink for a run that spans processes: one line appended per
 * event, synchronously, and the file is NOT truncated on open. Lab 07's
 * sink starts a fresh file per run, because a run was one process. Here
 * the resume continues the record the first process started.
 */
function appendingTrace(name: string, fresh: boolean): { port: TracePort; path: string } {
  mkdirSync(TRACE_DIR, { recursive: true });
  const path = fileURLToPath(new URL(name, TRACE_DIR));
  if (fresh) writeFileSync(path, "");
  return { path, port: { append: (event) => appendFileSync(path, `${JSON.stringify(event)}\n`) } };
}

/** One line for any job result: a report, a park, or a refusal. */
function describe(result: JobResult): string {
  if (result.ok) return `${result.report.outcome}, ${result.report.modelCalls} model calls, ${result.report.tokensSpent} tokens`;
  if (result.kind === "parked") return `{ ok: false, kind: 'parked', step: ${result.step}, node: '${result.node}' }`;
  return JSON.stringify(result);
}

/** The events of a trace file, through lesson 0011's reader. A refused line stops the part. */
function readTrace(path: string): TraceEvent[] {
  return parseTrace(readFileSync(path, "utf8")).map((line) => {
    if (!line.ok) throw new Error(`trace line ${line.line} refused: ${line.reason}`);
    return line.event;
  });
}

/** Every file in the checkpoint directory, through the boundary. Refused files are listed, not hidden. */
function readCheckpointDir(): Array<{ file: string; admission: CheckpointAdmission }> {
  if (!existsSync(CHECKPOINT_DIR)) return [];
  return readdirSync(CHECKPOINT_DIR)
    .filter((file) => file.endsWith(".json"))
    .sort()
    .map((file) => {
      const raw = JSON.parse(readFileSync(new URL(file, CHECKPOINT_DIR), "utf8")) as unknown;
      return { file, admission: admitCheckpoint(raw) };
    });
}

async function partG_aHeldCallParksTheRun(): Promise<void> {
  console.log("\n=== G. A held call parks the run, and the process exits ===");
  const graph = loadGraph(GRAPH_PATH);
  const { port, path: tracePath } = appendingTrace(PARKED_TRACE, true);
  const { port: checkpoints, path } = fileCheckpoint(PARKED_CHECKPOINT);

  console.log("the audit, with graph_health held for approval and nobody wired to answer:");
  const gateway = new FakeModelGateway([wantsTool, done]);
  const result = await startJob(graph, auditSpec({ approvalRequired: ["graph_health"] }), gateway, {
    trace: port,
    checkpoints,
    park: true,
  });
  console.log(`  result          : ${describe(result)}`);
  console.log(`  model calls made: ${gateway.calls.length} of the 2 the script held`);
  console.log(`  trace file      : ${tracePath}`);
  console.log(`  trace so far    : ${kinds(readTrace(tracePath))}`);
  console.log(`  checkpoint file : ${path}`);

  console.log("\nthe same audit with nothing held, same wiring:");
  const bare = fileCheckpoint("bare-audit.json");
  const plain = await startJob(graph, auditSpec(), new FakeModelGateway([wantsTool, done]), {
    checkpoints: bare.port,
    park: true,
  });
  console.log(`  result          : ${describe(plain)}`);
  console.log(`  checkpoint file : ${bare.path}, node ${readCheckpoint(bare.path).node}`);
  console.log(
    "\nThe held job stands at awaiting_approval with no process holding it. " +
      "The other never visited the node: its gate never said hold. " +
      "Run part h from a new shell.",
  );
}

function partH_theQueue(): void {
  console.log("\n=== H. The queue: every checkpoint that waits for a verdict ===");
  const entries = readCheckpointDir();
  const admitted = entries.flatMap((e) => (e.admission.admitted ? [e.admission.checkpoint] : []));
  for (const entry of entries) {
    const where = entry.admission.admitted
      ? `step ${entry.admission.checkpoint.step}, node ${entry.admission.checkpoint.node}, verdict ${entry.admission.checkpoint.state.verdict}`
      : `REFUSED: ${entry.admission.rejections.join("; ")}`;
    console.log(`  ${entry.file.padEnd(20)} ${where}`);
  }

  const queue = parkedJobs(admitted);
  console.log(`\n${queue.length} waiting for an operator:`);
  for (const job of queue) {
    const call = job.state.pending[0];
    console.log(`  "${job.job}"  step ${job.step}  asks ${call?.name}(${JSON.stringify(call?.input)})`);
  }
  console.log(
    "\nThe queue is a filter over the checkpoint directory: node awaiting_approval, " +
      "verdict null. Answer with: pnpm job i approved   (or denied)",
  );
}

function partI_theVerdict(verdict: string | undefined): void {
  console.log("\n=== I. The verdict, written into the checkpoint by this process ===");
  if (verdict !== "approved" && verdict !== "denied") {
    console.log("  usage: pnpm job i approved | denied");
    return;
  }
  const path = fileURLToPath(new URL(PARKED_CHECKPOINT, CHECKPOINT_DIR));
  const before = readCheckpoint(path);
  console.log(`  before          : step ${before.step}, node ${before.node}, verdict ${before.state.verdict}`);
  const answer = answerParked(before, verdict);
  if (!answer.ok) {
    console.log(`  refused         : ${answer.reason}`);
    return;
  }
  writeFileSync(path, JSON.stringify(answer.checkpoint, null, 2));
  const after = readCheckpoint(path);
  console.log(`  after           : step ${after.step}, node ${after.node}, verdict ${after.state.verdict}`);
  console.log(`  trace file      : untouched, still ${kinds(readTrace(fileURLToPath(new URL(PARKED_TRACE, TRACE_DIR))))}`);
  console.log("\nNo event was recorded. The verdict is state until the run resumes. Run part j.");
}

async function partJ_theResume(): Promise<void> {
  console.log("\n=== J. The parked run, resumed in this process ===");
  const graph = loadGraph(GRAPH_PATH);
  const { port: checkpoints, path } = fileCheckpoint(PARKED_CHECKPOINT);
  const checkpoint = readCheckpoint(path);
  const { port, path: tracePath } = appendingTrace(PARKED_TRACE, false);
  console.log(`  read back       : step ${checkpoint.step}, node ${checkpoint.node}, verdict ${checkpoint.state.verdict}`);
  console.log(`  trace before    : ${kinds(readTrace(tracePath))}`);

  const result = await resumeJob(
    graph,
    checkpoint,
    auditSpec({ approvalRequired: ["graph_health"] }),
    new FakeModelGateway([done]),
    { trace: port, checkpoints, park: true },
  );
  if (!result.ok) {
    console.log(`  result          : ${describe(result)}`);
    if (result.kind === "parked") {
      console.log("\nNobody answered, so the handler parked the run again. Nothing was written. Run part i.");
    }
    return;
  }
  const r = result.report;
  console.log(`  result          : ${r.outcome}, ${r.modelCalls} model calls, ${r.tokensSpent} tokens`);
  console.log(`  tool runs       : ${r.toolRuns.join(", ")}`);
  const events = readTrace(tracePath);
  console.log(`  whole trace     : ${kinds(events)}`);
  const verdict = walk(graph, jobLifecycleGuards, events);
  console.log(`  walked          : ${verdict.ok ? `legal, ${verdict.complete ? "complete" : "cut short"}` : verdict.reason}`);
  console.log(
    "\nThree processes, one trace file, one checkpoint file. The approval event " +
      "was written here, by the process that read the verdict out of the state.",
  );
}

const part = (process.argv[2] ?? "a").toLowerCase();
if (part === "a") partA_theGraph();
else if (part === "b") partB_replayTheRecordings();
else if (part === "c") partC_theRulesBroken();
else if (part === "d") await partD_theSameJobRunByTheGraph();
else if (part === "e") await partE_anEdgeTheGraphDoesNotHold();
else if (part === "f") await partF_killedAndResumed();
else if (part === "g") await partG_aHeldCallParksTheRun();
else if (part === "h") partH_theQueue();
else if (part === "i") partI_theVerdict(process.argv[3]);
else if (part === "j") await partJ_theResume();
else console.log(`unknown part "${part}" — try a to j`);

