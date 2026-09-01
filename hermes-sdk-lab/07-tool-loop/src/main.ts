/**
 * Exercise 07 — one call becomes a loop (lesson 0008), the loop gets its
 * bounds (lesson 0009), tool calls pass an approval gate (lesson 0010), and
 * every run leaves a durable trace (lesson 0011).
 *
 * Lessons: ../../../lessons/0008-tool-use-the-loops-heartbeat.html
 *          ../../../lessons/0009-bounds-and-termination.html
 *          ../../../lessons/0010-approval-gates-and-permissions.html
 *          ../../../lessons/0011-the-trace-is-what-happened.html
 *
 * Twelve parts. Run them separately:
 *   pnpm job a   — one tool call answered, end to end, against the mock
 *   pnpm job b   — the loop with a fake: a refused tool, then an answer
 *   pnpm job c   — a job that permits no tools (mock running)
 *   pnpm job d   — the call cap, from the spec, with a fake (no mock needed)
 *   pnpm job e   — the budget: abort mid-generation at the ceiling (mock)
 *   pnpm job f   — the deadline: abort mid-generation on the clock (mock)
 *   pnpm job g   — the gate, offline: auto beside denied, with a fake
 *   pnpm job h   — the gate, live: YOU approve or deny in the terminal (mock)
 *   pnpm job i   — the wait races the deadline: an operator who never answers
 *   pnpm job j   — every run leaves a trace: Part A's job, written down (mock)
 *   pnpm job k   — diagnose a finished run from its trace file alone (mock)
 *   pnpm job l   — resume an interrupted job from its trace (mock)
 * `pnpm job` with no argument runs a then b.
 * `pnpm trace traces/<file>.jsonl` reads any trace back as a story.
 */
import { appendFileSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { createInterface } from "node:readline/promises";
import { fileURLToPath } from "node:url";
import Anthropic from "@anthropic-ai/sdk";
import type { ApprovalPort } from "./approval.js";
import { AnthropicModelGateway } from "./anthropic-gateway.js";
import { FakeModelGateway } from "./fake-gateway.js";
import type { GatewayResult } from "./gateway.js";
import { runTask } from "./supervisor.js";
import { admitTaskSpec } from "./task-spec.js";
import { offerTools } from "./tools.js";
import { parseTrace, rebuildResumePoint, type TracePort } from "./trace.js";
import { printTraceStory } from "./trace-story.js";

const BASE_URL = process.env["ANTHROPIC_BASE_URL"] ?? "http://localhost:8787";
const API_KEY = process.env["ANTHROPIC_API_KEY"] ?? "mock-key-any-value-passes";
const MODEL = "claude-opus-4-8";

const SPEC_DIR = new URL("../specs/", import.meta.url);

/** The boundary, in three lines. Lesson 0005's pipeline, aimed at a file. */
async function readSpecFile(name: string): Promise<unknown> {
  const text = await readFile(new URL(name, SPEC_DIR), "utf8");
  const raw: unknown = JSON.parse(text);
  return raw;
}

function liveGateway(): AnthropicModelGateway {
  const client = new Anthropic({ baseURL: BASE_URL, apiKey: API_KEY });
  return new AnthropicModelGateway(client, MODEL);
}

async function partA_oneToolCallAnswered(): Promise<void> {
  console.log("\n=== A. One tool call, answered ===");

  const admission = admitTaskSpec(await readSpecFile("audit-atlas.json"));
  if (!admission.admitted) {
    console.log("refused:", admission.rejections);
    return;
  }
 
  const spec = admission.spec;
  const offered = offerTools(spec.allowedTools);
  console.log("allowedTools :", spec.allowedTools.join(", ") || "(none)");
  console.log("declared     :", offered.map((tool) => tool.name).join(", ") || "(none)");
  console.log("input_schema :", JSON.stringify(offered[0]?.inputSchema));

  const report = await runTask(liveGateway(), spec);
  console.log(report);
  console.log(
    `\n${report.modelCalls} model calls for one job, and one tool call between them. ` +
      "Watch the mock's terminal: the first reply asked, the second answered.",
  );
}

async function partB_theLoopWithAFake(): Promise<void> {
  console.log("\n=== B. The loop, with a fake and a tool the job never permitted ===");

  // A script of two replies. The first asks for a tool the spec does not
  // list — a reply is model output, so it can name anything at all.
  const fake = new FakeModelGateway([
    {
      ok: true,
      reply: {
        text: "I will patch the graph first.",
        calls: [
          {
            id: "toolu_fake_0001",
            name: "graph_writeback",
            input: { graph: "atlas", patch: "drop orphans" },
          },
        ],
        stop: "wants_tool",
        usage: { inputTokens: 20, outputTokens: 12 },
        requestId: null,
      },
    },
    {
      ok: true,
      reply: {
        text: "Understood. Reporting from the health counters instead.",
        calls: [],
        stop: "completed",
        usage: { inputTokens: 48, outputTokens: 15 },
        requestId: null,
      },
    },
  ]);

  const admission = admitTaskSpec(await readSpecFile("audit-atlas.json"));
  if (!admission.admitted) return;

  const report = await runTask(fake, admission.spec);
  console.log(report);

  // The measurement: the fake recorded each request, so the transcript's
  // growth is visible without a network.
  console.log("\nturns sent per model call:", fake.calls.map((call) => call.transcript.length));
  for (const [index, call] of fake.calls.entries()) {
    console.log(`  model call ${index + 1}:`, call.transcript.map((turn) => turn.from).join(" → "));
  }
}

async function partC_aJobThatPermitsNoTools(): Promise<void> {
  console.log("\n=== C. A job that permits no tools ===");

  const admission = admitTaskSpec(await readSpecFile("no-tools.json"));
  if (!admission.admitted) {
    console.log("refused:", admission.rejections);
    return;
  }

  console.log("allowedTools :", admission.spec.allowedTools.join(", ") || "(none, by default)");
  console.log("declared     :", offerTools(admission.spec.allowedTools).length, "tool(s)");

  const report = await runTask(liveGateway(), admission.spec);
  console.log(report);
  console.log("\nNo tools declared, so no request carried a tools key, and one call finished the job.");
}

/** A scripted reply that always asks for the same tool, for Part D. */
function wantsToolForever(id: string): GatewayResult {
  return {
    ok: true,
    reply: {
      text: "Let me check the graph again.",
      calls: [{ id, name: "graph_health", input: { graph: "atlas" } }],
      stop: "wants_tool",
      usage: { inputTokens: 20, outputTokens: 10 },
      requestId: null,
    },
  };
}

async function partD_theCallCap(): Promise<void> {
  console.log("\n=== D. The call cap comes from the spec ===");

  // Three scripted replies, each asking for a tool. The spec permits two
  // model calls, so the third scripted reply must never be requested.
  const fake = new FakeModelGateway([
    wantsToolForever("toolu_fake_0001"),
    wantsToolForever("toolu_fake_0002"),
    wantsToolForever("toolu_fake_0003"),
  ]);

  const admission = admitTaskSpec(await readSpecFile("capped.json"));
  if (!admission.admitted) {
    console.log("refused:", admission.rejections);
    return;
  }
  console.log("maxModelCalls:", admission.spec.maxModelCalls, "(from the spec, not a literal)");

  const report = await runTask(fake, admission.spec);
  console.log(report);
  console.log(
    `\nThe fake was scripted for 3 replies and answered ${fake.calls.length}. ` +
      "The cap held whatever the model wanted.",
  );
}

async function partE_theBudget(): Promise<void> {
  console.log("\n=== E. The budget: abort mid-generation at the ceiling ===");

  const admission = admitTaskSpec(await readSpecFile("tight-budget.json"));
  if (!admission.admitted) {
    console.log("refused:", admission.rejections);
    return;
  }
  console.log("costCeilingTokens:", admission.spec.costCeilingTokens);

  const report = await runTask(liveGateway(), admission.spec);
  console.log(report);
  console.log(
    "\nWatch the mock's terminal: the second reply stops mid-delta. The rest " +
      "was never generated, and the partial text above is what the abort kept.",
  );
}

async function partF_theDeadline(): Promise<void> {
  console.log("\n=== F. The deadline: abort mid-generation on the clock ===");

  const admission = admitTaskSpec(await readSpecFile("tight-deadline.json"));
  if (!admission.admitted) {
    console.log("refused:", admission.rejections);
    return;
  }
  console.log("deadlineMs:", admission.spec.deadlineMs);

  const startedAt = Date.now();
  const report = await runTask(liveGateway(), admission.spec);
  console.log(report);
  console.log(`\nelapsed: ~${Date.now() - startedAt} ms — the job ended near its deadline, not after it.`);
}

/** A reply that asks for the writeback tool, for Parts G and I. */
function wantsWriteback(id: string): GatewayResult {
  return {
    ok: true,
    reply: {
      text: "I will check the counters and patch the orphans.",
      calls: [
        { id: `${id}_health`, name: "graph_health", input: { graph: "atlas" } },
        { id: `${id}_patch`, name: "graph_writeback", input: { graph: "atlas", patch: "drop orphans" } },
      ],
      stop: "wants_tool",
      usage: { inputTokens: 24, outputTokens: 18 },
      requestId: null,
    },
  };
}

async function partG_theGateOffline(): Promise<void> {
  console.log("\n=== G. The gate, offline: auto beside denied ===");

  // One reply, two calls. graph_health is permitted and ungated, so it
  // runs. graph_writeback is permitted AND gated, so it waits for the
  // approver — here a script that denies everything, standing in for an
  // operator who said no.
  const fake = new FakeModelGateway([
    wantsWriteback("toolu_fake_0001"),
    {
      ok: true,
      reply: {
        text: "The patch was declined. Reporting the orphan count instead.",
        calls: [],
        stop: "completed",
        usage: { inputTokens: 78, outputTokens: 16 },
        requestId: null,
      },
    },
  ]);

  const denyEverything: ApprovalPort = {
    decide: (call) => {
      console.log(`  operator (scripted): deny ${call.name}`);
      return Promise.resolve("denied");
    },
  };

  const admission = admitTaskSpec(await readSpecFile("patch-orphans.json"));
  if (!admission.admitted) {
    console.log("refused:", admission.rejections);
    return;
  }
  console.log("allowedTools    :", admission.spec.allowedTools.join(", "));
  console.log("approvalRequired:", admission.spec.approvalRequired.join(", "));

  const report = await runTask(fake, admission.spec, { approver: denyEverything });
  console.log(report);
  console.log(
    "\nOne reply, two calls, two different gate decisions. The denial went " +
      "back to the model as a failed tool result, and the loop still landed.",
  );
}

/** Part H's approver: one terminal question per held call. */
function terminalApprover(): ApprovalPort & { close: () => void } {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  return {
    decide: async (call) => {
      try {
        const answer = await rl.question(
          `\n  approve ${call.name}(${JSON.stringify(call.input)})? [y/N] `,
        );
        return answer.trim().toLowerCase().startsWith("y") ? "approved" : "denied";
      } catch {
        // stdin closed, so nobody can answer. The default-deny rule applies.
        console.log("  (stdin closed — denied)");
        return "denied";
      }
    },
    close: () => rl.close(),
  };
}

async function partH_theGateLive(): Promise<void> {
  console.log("\n=== H. The gate, live: you are the operator ===");

  const admission = admitTaskSpec(await readSpecFile("patch-orphans.json"));
  if (!admission.admitted) {
    console.log("refused:", admission.rejections);
    return;
  }

  // The mock always asks for the FIRST declared tool, and patch-orphans.json
  // lists graph_writeback first — so the held call is the mutating one.
  const approver = terminalApprover();
  try {
    const report = await runTask(liveGateway(), admission.spec, { approver });
    console.log(report);
    console.log(
      "\nRun it twice: approve once, deny once. Compare toolRuns and the " +
        "final answer — the provider never saw the gate, only your outcome.",
    );
  } finally {
    approver.close();
  }
}

async function partI_theWaitRacesTheDeadline(): Promise<void> {
  console.log("\n=== I. An operator who never answers ===");

  // The approver's promise never resolves. The spec's 2000 ms deadline is
  // what ends the job — the same AbortController as every other bound.
  const nobodyAnswers: ApprovalPort = {
    decide: () => new Promise(() => {}),
  };

  const fake = new FakeModelGateway([wantsWriteback("toolu_fake_0001")]);

  const admission = admitTaskSpec(await readSpecFile("patch-unattended.json"));
  if (!admission.admitted) {
    console.log("refused:", admission.rejections);
    return;
  }
  console.log("deadlineMs:", admission.spec.deadlineMs);

  const startedAt = Date.now();
  const report = await runTask(fake, admission.spec, { approver: nobodyAnswers });
  console.log(report);
  console.log(
    `\nelapsed: ~${Date.now() - startedAt} ms — the deadline ended the wait. ` +
      "The tool never ran, and the job still terminated with a classified outcome.",
  );
}

const TRACE_DIR = new URL("../traces/", import.meta.url);

/**
 * The wiring's trace sink: one JSON line appended per event, synchronously.
 * Synchronous on purpose — a buffered writer can lose its tail when the
 * process dies, and losing the tail is losing the part that says why.
 * (This survives the process dying, not the machine losing power: that
 * would need fsync, which the lab skips.)
 */
function fileTrace(name: string): { trace: TracePort; path: string } {
  mkdirSync(TRACE_DIR, { recursive: true });
  const path = fileURLToPath(new URL(name, TRACE_DIR));
  writeFileSync(path, ""); // one file per run: a rerun starts a fresh record
  return {
    path,
    trace: { append: (event) => appendFileSync(path, `${JSON.stringify(event)}\n`) },
  };
}

async function partJ_everyRunLeavesATrace(): Promise<void> {
  console.log("\n=== J. Every run leaves a trace ===");

  const admission = admitTaskSpec(await readSpecFile("audit-atlas.json"));
  if (!admission.admitted) {
    console.log("refused:", admission.rejections);
    return;
  } 

  const { trace, path } = fileTrace("audit-atlas.jsonl");
  const report = await runTask(liveGateway(), admission.spec, { trace });
  console.log(report);

  const entries = parseTrace(readFileSync(path, "utf8"));
  console.log(`\ntrace: ${path}`);
  console.log(`${entries.length} lines, one event each:`);
  for (const entry of entries) {
    console.log(entry.ok ? `  ${entry.event.kind}` : `  line ${entry.line} refused: ${entry.reason}`);
  }
  console.log(
    "\nSame job as Part A, same report — plus a file that outlives the process. " +
      "Open it: every line is one JSON object you can read in any editor.",
  );
}

async function partK_diagnoseFromTheTraceAlone(): Promise<void> {
  console.log("\n=== K. Diagnose a finished run from its trace alone ===");

  const admission = admitTaskSpec(await readSpecFile("tight-budget.json"));
  if (!admission.admitted) {
    console.log("refused:", admission.rejections);
    return;
  }

  const { trace, path } = fileTrace("tight-budget.jsonl");
  await runTask(liveGateway(), admission.spec, { trace });
  console.log("The run finished. Its report is deliberately not printed.\n");

  console.log(`Reading ${path} back:`);
  printTraceStory(readFileSync(path, "utf8"));
  console.log(
    "\nEverything above came from the file — which call overspent, what the " +
      "abort kept, and the request ids the provider also logged. Now tamper " +
      "with one line in the file and run: pnpm trace traces/tight-budget.jsonl",
  );
}

async function partL_resumeFromTheTrace(): Promise<void> {
  console.log("\n=== L. Resume an interrupted job from its trace ===");

  const admission = admitTaskSpec(await readSpecFile("tight-deadline.json"));
  if (!admission.admitted) {
    console.log("refused:", admission.rejections);
    return;
  }

  const first = fileTrace("tight-deadline.jsonl");
  console.log("run 1, under the spec's 2400 ms deadline:");
  const report1 = await runTask(liveGateway(), admission.spec, { trace: first.trace });
  console.log(report1);

  // The resume point comes from the FILE, not from run 1's report — the
  // process that ran it could be long gone.
  const events = parseTrace(readFileSync(first.path, "utf8")).flatMap((entry) =>
    entry.ok ? [entry.event] : [],
  );
  const resume = rebuildResumePoint(events);
  if (resume === null) {
    console.log("no job_started in the trace — nothing to resume");
    return;
  }
  console.log("\nrebuilt from the file:", {
    turns: resume.transcript.map((turn) => turn.from).join(" → "),
    tokensSpent: resume.tokensSpent,
    modelCalls: resume.modelCalls,
  });

  const second = fileTrace("tight-deadline-resume.jsonl");
  console.log("\nrun 2, resumed — fresh clock, same ledger:");
  const report2 = await runTask(liveGateway(), admission.spec, {
    trace: second.trace,
    resume,
  });
  console.log(report2);
  console.log(
    `\nRun 2's ledger started at ${resume.tokensSpent}, so ${report2.tokensSpent} is the whole ` +
      "job's spend, and its calls continue run 1's numbering. The deadline restarted: " +
      "time lost is gone either way, but tokens spent stay spent.",
  );
}

async function main(): Promise<void> {
  const part = (process.argv[2] ?? "ab").toLowerCase();
  if (part.includes("a")) await partA_oneToolCallAnswered();
  if (part.includes("b")) await partB_theLoopWithAFake();
  if (part.includes("c")) await partC_aJobThatPermitsNoTools();
  if (part.includes("d")) await partD_theCallCap();
  if (part.includes("e")) await partE_theBudget();
  if (part.includes("f")) await partF_theDeadline();
  if (part.includes("g")) await partG_theGateOffline();
  if (part.includes("h")) await partH_theGateLive();
  if (part.includes("i")) await partI_theWaitRacesTheDeadline();
  if (part.includes("j")) await partJ_everyRunLeavesATrace();
  if (part.includes("k")) await partK_diagnoseFromTheTraceAlone();
  if (part.includes("l")) await partL_resumeFromTheTrace();
}

main().catch((err: unknown) => {
  console.error("\njob crashed (unclassified):", err);
  process.exitCode = 1;
});
