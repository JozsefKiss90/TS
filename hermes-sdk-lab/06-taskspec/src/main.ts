/**
 * Exercise 06 — no spec, no dispatch.
 *
 * Lesson: ../../../lessons/0007-the-taskspec-is-a-contract.html
 *
 * Three parts. Run them separately:
 *   pnpm job a   — an admitted spec runs the job    (mock running)
 *   pnpm job b   — bad specs are refused, zero calls (mock running, and SILENT)
 *   pnpm job c   — the cross-field rule             (no mock needed)
 * `pnpm job` with no argument runs a then b.
 */
import { readFile } from "node:fs/promises";
import Anthropic from "@anthropic-ai/sdk";
import { AnthropicModelGateway } from "./anthropic-gateway.js";
import { FakeModelGateway } from "./fake-gateway.js";
import { runTask } from "./supervisor.js";
import { admitTaskSpec, type TaskSpecInput } from "./task-spec.js";

const BASE_URL = process.env["ANTHROPIC_BASE_URL"] ?? "http://localhost:8787";
const API_KEY = process.env["ANTHROPIC_API_KEY"] ?? "mock-key-any-value-passes";
const MODEL = "claude-opus-4-8";

const SPEC_DIR = new URL("../specs/", import.meta.url);

/**
 * The boundary, in three lines. `readFile` gives text, `JSON.parse`
 * checks syntax and nothing else, and the annotation says so out loud.
 * Lesson 0005's pipeline, aimed at a file instead of a response.
 */
async function readSpecFile(name: string): Promise<unknown> {
  const text = await readFile(new URL(name, SPEC_DIR), "utf8");
  const raw: unknown = JSON.parse(text);
  return raw;
}

/** Part A's measurement helper. A JSON array or null has no keys to count. */
function topLevelKeys(value: unknown): string[] {
  return value !== null && typeof value === "object" && !Array.isArray(value) ? Object.keys(value) : [];
}

function liveGateway(): AnthropicModelGateway {
  const client = new Anthropic({ baseURL: BASE_URL, apiKey: API_KEY });
  return new AnthropicModelGateway(client, MODEL);
}

async function partA_anAdmittedSpecRuns(): Promise<void> {
  console.log("\n=== A. An admitted spec runs the job ===");

  const raw = await readSpecFile("audit-atlas.json");
  const keys = topLevelKeys(raw);
  const admission = admitTaskSpec(raw);

  if (!admission.admitted) {
    console.log("refused:", admission.rejections);
    return;
  }

  // The measurement: exercise 04 counted keys the parse STRIPPED. Count
  // what this parse ADDED. Both numbers come from the same idea — the
  // parsed value is the contract, not the file.
  console.log(`file keys   (${keys.length}):`, keys.join(", "));
  console.log(
    `spec keys   (${Object.keys(admission.spec).length}):`,
    Object.keys(admission.spec).join(", "),
  );
  console.log("filled by the schema →", {
    maxTokens: admission.spec.maxTokens,
    allowedTools: admission.spec.allowedTools,
  });

  const report = await runTask(liveGateway(), admission.spec);
  console.log(report);

  // The two static types, side by side. A spec FILE may omit maxTokens,
  // so TaskSpecInput accepts the object below. TaskSpec does not, and
  // that is the difference `.default()` created. Uncomment the annotated
  // line underneath to watch the compiler say so.
  const fromFile: TaskSpecInput = {
    title: "Audit the atlas graph",
    owner: "themis",
    instruction: "…",
    costCeilingTokens: 2000,
    outputPath: "vault/audits/atlas.md",
  };
  // const admitted: TaskSpec = fromFile;   // ← uncomment: Property 'maxTokens' is missing
  console.log("TaskSpecInput permits a file with no maxTokens:", fromFile.maxTokens === undefined);
}

async function partB_badSpecsSpendNothing(): Promise<void> {
  console.log("\n=== B. Bad specs are refused — before a token is spent ===");
  console.log("(watch the mock's terminal: it stays silent for all of these)");

  // A fake with a script that would succeed if anything ever called it.
  // Nothing does, and `fake.calls` is how we prove it.
  const fake = new FakeModelGateway([
    {
      ok: true,
      reply: {
        text: "This reply is never produced.",
        stop: "completed",
        usage: { inputTokens: 11, outputTokens: 42 },
        requestId: null,
      },
    },
  ]);

  for (const name of ["no-owner.json", "not-a-spec.json"]) {
    const admission = admitTaskSpec(await readSpecFile(name));

    if (admission.admitted) {
      console.log(`${name} → admitted`, await runTask(fake, admission.spec));
      continue;
    }

    console.log(`\n${name} → REFUSED, ${admission.rejections.length} reason(s):`);
    for (const rejection of admission.rejections) {
      console.log("  ·", rejection);
    }
  }

  console.log("\nmodel calls made:", fake.calls.length, "— tokens spent: 0");
}

async function partC_theRuleNoSingleFieldCanCarry(): Promise<void> {
  console.log("\n=== C. The cross-field rule — every field valid, the pair is not ===");

  const admission = admitTaskSpec(await readSpecFile("over-ceiling.json"));

  if (admission.admitted) {
    console.log("admitted — the refinement is not implemented yet:", admission.spec);
    return;
  }

  console.log("over-ceiling.json → REFUSED:");
  for (const rejection of admission.rejections) {
    console.log("  ·", rejection);
  }
  console.log("\nEvery field in that file has the right type. Read the path in the rejection.");
}

async function main(): Promise<void> {
  const part = (process.argv[2] ?? "ab").toLowerCase();
  if (part.includes("a")) await partA_anAdmittedSpecRuns();
  if (part.includes("b")) await partB_badSpecsSpendNothing();
  if (part.includes("c")) await partC_theRuleNoSingleFieldCanCarry();
}

main().catch((err: unknown) => {
  console.error("\njob crashed (unclassified):", err);
  process.exitCode = 1;
});
