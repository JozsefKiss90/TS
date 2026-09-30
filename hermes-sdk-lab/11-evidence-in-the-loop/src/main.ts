/**
 * Exercise 11 — evidence enters the loop (lesson 0016).
 *
 * Lesson: ../../../lessons/0016-evidence-enters-the-loop.html
 *
 * Four parts. Run them separately:
 *   pnpm job a   — assemble a Context Pack over stdio, from the real export
 *   pnpm job b   — the same job grounded and ungrounded, against the mock
 *   pnpm job c   — no pack, no dispatch: the refusal costs zero calls
 *   pnpm job d   — the pack's four rules, each broken on purpose
 * `pnpm job` with no argument runs a.
 *
 * Parts a and b start exercise 10's MCP server as a child process. Part b
 * also needs the mock Messages API: `pnpm mock` in another terminal.
 * Parts c and d need neither.
 */
import { mkdirSync, writeFileSync, appendFileSync, readFileSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import Anthropic from "@anthropic-ai/sdk";
import { AnthropicModelGateway } from "../../07-tool-loop/src/anthropic-gateway.js";
import { FakeModelGateway } from "../../07-tool-loop/src/fake-gateway.js";
import type { GatewayResult } from "../../07-tool-loop/src/gateway.js";
import { runTask, type AdmittedPack } from "../../07-tool-loop/src/supervisor.js";
import { admitTaskSpec, type TaskSpec } from "../../07-tool-loop/src/task-spec.js";
import { parseTrace, type TracePort } from "../../07-tool-loop/src/trace.js";
import { printTraceStory } from "../../07-tool-loop/src/trace-story.js";
import {
  admitContextPack,
  assembleContextPack,
  packForDispatch,
  renderPack,
} from "./context-pack.js";
import { McpEvidenceAdapter } from "./mcp-evidence.js";

const BASE_URL = process.env["ANTHROPIC_BASE_URL"] ?? "http://localhost:8787";
const API_KEY = process.env["ANTHROPIC_API_KEY"] ?? "mock-key-any-value-passes";
const MODEL = "claude-opus-4-8";

const SPEC_DIR = new URL("../specs/", import.meta.url);
const TRACE_DIR = new URL("../traces/", import.meta.url);

async function readSpec(name: string): Promise<TaskSpec> {
  const text = await readFile(new URL(name, SPEC_DIR), "utf8");
  const raw: unknown = JSON.parse(text);
  const admission = admitTaskSpec(raw);
  if (!admission.admitted) throw new Error(`spec refused: ${admission.rejections.join("; ")}`);
  return admission.spec;
}

function liveGateway(): AnthropicModelGateway {
  const client = new Anthropic({ baseURL: BASE_URL, apiKey: API_KEY });
  return new AnthropicModelGateway(client, MODEL);
}

/** A trace sink that writes each event the moment it happens. */
function fileTrace(name: string): { port: TracePort; path: string } {
  mkdirSync(fileURLToPath(TRACE_DIR), { recursive: true });
  const path = fileURLToPath(new URL(name, TRACE_DIR));
  writeFileSync(path, "");
  return {
    path,
    port: { append: (event) => appendFileSync(path, `${JSON.stringify(event)}\n`) },
  };
}

/** S2, over the wire: spawn the server, assemble, admit, close. */
async function assembleOverStdio(spec: TaskSpec): Promise<AdmittedPack | null> {
  const evidence = await McpEvidenceAdapter.overStdio();
  try {
    const admission = await assembleContextPack(evidence, spec);
    if (!admission.admitted) {
      console.log("pack REFUSED:");
      for (const reason of admission.rejections) console.log(`  ${reason}`);
      return null;
    }
    for (const row of admission.pack.assembledFrom) {
      console.log(`  query "${row.query}" → ${row.matched} item(s) from ${row.snapshot}`);
    }
    return packForDispatch(admission.pack);
  } finally {
    await evidence.close();
  }
}

async function partA_assembleThePack(): Promise<void> {
  console.log("\n=== A. The pack, assembled over stdio ===");

  const spec = await readSpec("audit-atlas-grounded.json");
  console.log("evidenceQueries:", spec.evidenceQueries.join(", "));
  console.log("evidenceLimit  :", spec.evidenceLimit);

  const pack = await assembleOverStdio(spec);
  if (pack === null) return;

  console.log(`\n${pack.text}\n`);
  console.log(`ids      : ${pack.ids.join(", ")}`);
  console.log(`snapshot : ${pack.snapshot}`);
  console.log(`chars    : ${pack.text.length}`);
  console.log(
    "\nThe supervisor gets those five fields. It never sees an item, a " +
      "source kind or a confidence label.",
  );
}

async function partB_theGroundedJob(): Promise<void> {
  console.log("\n=== B. The same job, grounded and ungrounded (mock running) ===");

  const grounded = await readSpec("audit-atlas-grounded.json");
  const pack = await assembleOverStdio(grounded);
  if (pack === null) return;

  const trace = fileTrace("audit-atlas-grounded.jsonl");
  const withEvidence = await runTask(liveGateway(), grounded, { pack, trace: trace.port });
  console.log("\ngrounded  :", {
    outcome: withEvidence.outcome,
    modelCalls: withEvidence.modelCalls,
    tokensSpent: withEvidence.tokensSpent,
    evidenceIds: withEvidence.evidenceIds,
  });

  const bare = await readSpec("audit-atlas-bare.json");
  const bareTrace = fileTrace("audit-atlas-bare.jsonl");
  const withoutEvidence = await runTask(liveGateway(), bare, { trace: bareTrace.port });
  console.log("ungrounded:", {
    outcome: withoutEvidence.outcome,
    modelCalls: withoutEvidence.modelCalls,
    tokensSpent: withoutEvidence.tokensSpent,
    evidenceIds: withoutEvidence.evidenceIds,
  });

  const extra = withEvidence.tokensSpent - withoutEvidence.tokensSpent;
  console.log(
    `\nThe pack added ${pack.text.length} characters and ${extra} tokens to the same job. ` +
      "Evidence is charged as input, on every call.",
  );

  console.log("\ninput tokens per call, from the two traces:");
  for (const [label, path] of [
    ["grounded  ", trace.path],
    ["ungrounded", bareTrace.path],
  ] as const) {
    // Read back through parseTrace, the boundary lesson 0011 built. A string
    // match on the raw lines would be the skipped parse this course spends
    // its whole length refusing.
    const inputs = parseTrace(readFileSync(path, "utf8"))
      .flatMap((line) => (line.ok && line.event.kind === "reply" ? [line.event] : []))
      .map((event) => String(event.inputTokens));
    console.log(`  ${label}: ${inputs.join(" then ")}`);
  }

  console.log(`\nthe trace, told back (${trace.path}):`);
  printTraceStory(readFileSync(trace.path, "utf8"));
  console.log(
    "\nThe evidence line names ids and a snapshot. The claims are not in " +
      "the trace: read them back from the graph.",
  );
}

async function partC_noPackNoDispatch(): Promise<void> {
  console.log("\n=== C. No pack, no dispatch (no mock, no server) ===");

  const spec = await readSpec("audit-atlas-grounded.json");
  const gateway = new FakeModelGateway([
    {
      ok: true,
      reply: {
        text: "this reply is never reached",
        calls: [],
        stop: "completed",
        usage: { inputTokens: 1, outputTokens: 1 },
        requestId: null,
      },
    } satisfies GatewayResult,
  ]);

  const report = await runTask(gateway, spec);
  console.log("no pack at all        :", report.outcome, "-", report.notes[0] ?? "");

  // The second fault the same rule catches: a pack that answers OTHER
  // questions. Well formed, admitted somewhere else, and not this job's.
  const wrongPack: AdmittedPack = {
    text: "EVIDENCE from dev-graph-2026-09-09, 1 item(s) for: kubernetes (1)",
    queries: ["kubernetes"],
    snapshot: "dev-graph-2026-09-09",
    assembledAt: "2026-09-30T09:00:00.000Z",
    ids: ["MOD-999"],
  };
  const mismatched = await runTask(gateway, spec, { pack: wrongPack });
  console.log("a pack for other qs   :", mismatched.outcome, "-", mismatched.notes[0] ?? "");

  const bare = await readSpec("audit-atlas-bare.json");
  const unasked = await runTask(gateway, bare, { pack: wrongPack });
  console.log("a spec that asked none:", unasked.outcome, "-", unasked.notes[0] ?? "");

  console.log(`\nthe fake recorded ${gateway.calls.length} model calls across all three.`);
  console.log(
    "The spec decides which questions a job may be grounded in. Absent " +
      "means denied, and so does mismatched.",
  );
}

function partD_theFourRules(): void {
  console.log("\n=== D. The pack's rules, each broken on purpose ===");

  // Hand-written on purpose, and not through the test helpers next door:
  // each candidate below is what an assembler would have produced, typed
  // `unknown`, so the parse is the only thing that judges it. A builder
  // returning a typed value could not express three of these four.

  const good = {
    id: "MOD-004",
    claim: "Job supervisor loop is implemented (module).",
    provenance: {
      sources: [{ kind: "code", ref: "07-tool-loop/src/supervisor.ts" }],
      generatedBy: { activity: "graph-export", at: "2026-09-09T18:00:00Z" },
      derivedFrom: ["dev-graph-2026-09-09#MOD-004"],
      confidence: "single-source",
    },
  };
  const row = (query: string, snapshot: string, matched: number) => ({
    query,
    adapter: "JsonExportAdapter",
    snapshot,
    assembledAt: "2026-09-30T09:00:00.000Z",
    matched,
  });

  const cases: Array<[string, unknown]> = [
    ["nothing matched", { job: "j", assembledFrom: [row("kubernetes", "s1", 0)], items: [] }],
    [
      "two snapshots",
      {
        job: "j",
        assembledFrom: [row("supervisor", "s1", 1), row("trace", "s2", 1)],
        items: [good],
      },
    ],
    [
      "one id twice",
      { job: "j", assembledFrom: [row("supervisor", "s1", 2)], items: [good, good] },
    ],
    [
      "confirmed on one source",
      {
        job: "j",
        assembledFrom: [row("supervisor", "s1", 1)],
        items: [{ ...good, provenance: { ...good.provenance, confidence: "confirmed" } }],
      },
    ],
  ];

  for (const [name, candidate] of cases) {
    const admission = admitContextPack(candidate);
    const verdict = admission.admitted ? "ADMITTED" : admission.rejections.join(" | ");
    console.log(`  ${name.padEnd(24)} → ${verdict}`);
  }

  const admission = admitContextPack({
    job: "j",
    assembledFrom: [row("supervisor", "s1", 1)],
    items: [good],
  });
  if (admission.admitted) {
    console.log(`\none good pack renders as ${renderPack(admission.pack).length} characters.`);
  }
}

const part = (process.argv[2] ?? "a").toLowerCase();
if (part === "a") await partA_assembleThePack();
else if (part === "b") await partB_theGroundedJob();
else if (part === "c") await partC_noPackNoDispatch();
else if (part === "d") partD_theFourRules();
else console.log(`unknown part "${part}" — try a, b, c or d`);
