/**
 * Exercise 05 — the SDK goes behind a port.
 *
 * Lesson: ../../../lessons/0006-the-model-gateway.html
 *
 * Three parts. Run them separately:
 *   pnpm job a   — one job through the port (mock running)
 *   pnpm job b   — failures arrive as data   (mock running)
 *   pnpm job c   — the fake: same supervisor, NO wire (stop the mock first!)
 * `pnpm job` with no argument runs a then b.
 */
import Anthropic from "@anthropic-ai/sdk";
import { AnthropicModelGateway } from "./anthropic-gateway.js";
import { FakeModelGateway } from "./fake-gateway.js";
import { superviseOneCall } from "./supervisor.js";

const BASE_URL = process.env["ANTHROPIC_BASE_URL"] ?? "http://localhost:8787";
const API_KEY = process.env["ANTHROPIC_API_KEY"] ?? "mock-key-any-value-passes";
const MODEL = "claude-opus-4-8";

/**
 * Wiring, not translation: everything provider-shaped — endpoint, auth,
 * retry count, scenario headers for the mock — is decided HERE, where
 * the adapter is constructed. The supervisor never sees any of it.
 */
function liveGateway(tweaks?: {
  headers?: Record<string, string>;
  maxRetries?: number;
}): AnthropicModelGateway {
  const client = new Anthropic({
    baseURL: BASE_URL,
    apiKey: API_KEY,
    ...(tweaks?.maxRetries !== undefined ? { maxRetries: tweaks.maxRetries } : {}),
    ...(tweaks?.headers ? { defaultHeaders: tweaks.headers } : {}),
  });
  return new AnthropicModelGateway(client, MODEL);
}

async function partA_oneJobThroughThePort(): Promise<void> {
  console.log("\n=== A. One job through the port — Anthropic adapter, mock wire ===");
  const report = await superviseOneCall(liveGateway(), "Hello, Claude!");
  console.log(report);
  // Before moving on: which file decided `tokensSpent`? Which file
  // decided the wire's stop_reason spelling never reaches it?
}

async function partB_failuresArriveAsData(): Promise<void> {
  console.log("\n=== B. Failures arrive as data — classified, not crashed ===");

  // B1 — throttled. maxRetries: 0 so the 429 surfaces immediately
  // (with the default 2 retries the SDK would spend ~10 s honoring
  // retry-after twice first — measured in exercise 02).
  const throttled = await superviseOneCall(
    liveGateway({ headers: { "x-mock-scenario": "rate-limit" }, maxRetries: 0 }),
    "Hello, Claude!",
  );
  console.log("B1 throttled →", throttled);

  // B2 — aborted mid-flight. The mock "thinks" for ~400 ms; the
  // supervisor's controller fires at 100 ms (S6's kill switch, in miniature).
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 100);
  const aborted = await superviseOneCall(liveGateway(), "Hello, Claude!", {
    signal: controller.signal,
  });
  clearTimeout(timer);
  console.log("B2 aborted   →", aborted);

  // B3 — the drifted 200 from lesson 0005, sent through the ADAPTER this
  // time. In exercise 04 Part A the same bytes corrupted the ledger to
  // "1142". Watch what the supervisor receives instead.
  const malformed = await superviseOneCall(
    liveGateway({ headers: { "x-mock-scenario": "drift" } }),
    "Hello, Claude!",
  );
  console.log("B3 malformed →", malformed);
}

async function partC_theFakeNeedsNoWire(): Promise<void> {
  console.log("\n=== C. The fake — same supervisor, no wire at all ===");
  console.log("(run this with the mock STOPPED — that is the point)");

  const started = performance.now();

  // The script is written in the PORT's vocabulary — GatewayResult
  // values, typed by the compiler as you write them.
  const fake = new FakeModelGateway([
    {
      ok: true,
      reply: {
        text: "Scripted reply — no server, no model, no tokens billed.",
        stop: "completed",
        usage: { inputTokens: 11, outputTokens: 42 },
        requestId: null,
      },
    },
    { ok: false, failure: { kind: "throttled", retryAfterMs: 5000 } },
  ]);

  const landed = await superviseOneCall(fake, "Hello, Claude!");
  const backedOff = await superviseOneCall(fake, "Hello again");
  const elapsedMs = performance.now() - started;

  console.log("C1 landed      →", landed);
  console.log("C2 retry_later →", backedOff, "(throttle POLICY, tested offline)");
  console.log("calls the domain actually made:", fake.calls);
  console.log(`elapsed: ${elapsedMs.toFixed(1)} ms — no port 8787, no process, no network`);
}

async function main(): Promise<void> {
  const part = (process.argv[2] ?? "ab").toLowerCase();
  if (part.includes("a")) await partA_oneJobThroughThePort();
  if (part.includes("b")) await partB_failuresArriveAsData();
  if (part.includes("c")) await partC_theFakeNeedsNoWire();
}

main().catch((err: unknown) => {
  // Anything that lands here escaped classification. If it is an SDK
  // error class, the TODO in anthropic-gateway.ts is not finished yet —
  // you are watching an exception cross the port, which is exactly what
  // the gateway exists to prevent.
  console.error("\njob crashed (unclassified):", err);
  process.exitCode = 1;
});
