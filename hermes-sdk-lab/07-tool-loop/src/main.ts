/**
 * Exercise 07 — one call becomes a loop.
 *
 * Lesson: ../../../lessons/0008-tool-use-the-loops-heartbeat.html
 *
 * Three parts. Run them separately:
 *   pnpm job a   — one tool call answered, end to end, against the mock
 *   pnpm job b   — the loop with a fake: a refused tool, then an answer
 *   pnpm job c   — a job that permits no tools (mock running)
 * `pnpm job` with no argument runs a then b.
 */
import { readFile } from "node:fs/promises";
import Anthropic from "@anthropic-ai/sdk";
import { AnthropicModelGateway } from "./anthropic-gateway.js";
import { FakeModelGateway } from "./fake-gateway.js";
import { runTask } from "./supervisor.js";
import { admitTaskSpec } from "./task-spec.js";
import { offerTools } from "./tools.js";

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

async function main(): Promise<void> {
  const part = (process.argv[2] ?? "ab").toLowerCase();
  if (part.includes("a")) await partA_oneToolCallAnswered();
  if (part.includes("b")) await partB_theLoopWithAFake();
  if (part.includes("c")) await partC_aJobThatPermitsNoTools();
}

main().catch((err: unknown) => {
  console.error("\njob crashed (unclassified):", err);
  process.exitCode = 1;
});
