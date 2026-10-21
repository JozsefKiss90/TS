/**
 * Exercise 13 — LangGraph.js, evaluated (lesson 0020).
 *
 * Lesson: ../../../lessons/0020-langgraph-js-evaluated.html
 *
 * Three parts. Run them separately:
 *   pnpm job a   — the audit on StateGraph: same report, two checkpoint records
 *   pnpm job b   — a held call paused by interrupt(), resumed by Command
 *   pnpm job c   — a resume value the verdict schema refuses
 * `pnpm job` with no argument runs a.
 *
 * The main measurement is not here. It is `pnpm test`, which runs lab 12's
 * 74 tests unchanged with the interpreter swapped for the framework
 * (vitest.config.ts). Nothing here needs the mock, a key, or a network.
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
import { walk } from "../../12-workflow-graph/src/walker.js";
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

const parts: Record<string, () => Promise<void>> = {
  a: partA_sameJobTwoRecords,
  b: partB_pausedAndResumed,
  c: partC_refusedAnswer,
};

const which = process.argv[2] ?? "a";
const part = parts[which];
if (part === undefined) {
  console.error(`unknown part "${which}"; use one of: ${Object.keys(parts).join(", ")}`);
  process.exit(1);
}
await part();
