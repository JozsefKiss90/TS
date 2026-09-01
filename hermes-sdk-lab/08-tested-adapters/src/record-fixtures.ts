/**
 * The RECORDER — how the committed fixtures were made, kept in the repo so
 * they can be made again.
 *
 * It does not hand-write wire bytes. It runs the real adapter against the
 * exercise 01 mock through a recording fetch, so every fixture's request
 * is what the adapter truly sent and every response is what the mock truly
 * returned. Re-recording after a mock or adapter change refreshes the
 * fixtures; a test that then fails is a contract that then drifted.
 *
 * Run it with the mock listening on a private port:
 *
 *   PORT=8899 pnpm mock        (its own terminal; restart it first, so
 *                               request ids start at req_mock_0001)
 *   ANTHROPIC_BASE_URL=http://localhost:8899 pnpm record
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import Anthropic from "@anthropic-ai/sdk";
import { AnthropicModelGateway } from "../../07-tool-loop/src/anthropic-gateway.js";
import { runTask } from "../../07-tool-loop/src/supervisor.js";
import { admitTaskSpec } from "../../07-tool-loop/src/task-spec.js";
import { captureHeaders, captureSentRequest, type RecordedExchange } from "./replay.js";

const BASE_URL = process.env["ANTHROPIC_BASE_URL"] ?? "http://localhost:8899";
const API_KEY = "mock-key-any-value-passes";
const MODEL = "claude-opus-4-8";
const RECORDED_AT = new Date().toISOString().slice(0, 10);

const FIXTURE_DIR = new URL("../fixtures/", import.meta.url);

type Pair = Omit<RecordedExchange, "scenario" | "recordedAt">;

const KEPT_RESPONSE_HEADERS = ["content-type", "request-id", "retry-after"];

/**
 * A fetch that performs the real call, keeps a copy of both sides, and
 * hands the SDK a rebuilt response. Buffering the body first means the
 * recorded stream replays exactly as it was received — whole.
 */
function recordingFetch(captured: Pair[]): typeof fetch {
  return async (url, init) => {
    const response = await fetch(url, init);
    const body = await response.text();

    captured.push({
      // The replayer's own capture helper, so the recorded request and the
      // replayed comparison keep the same fields by construction.
      request: { method: init?.method ?? "GET", ...captureSentRequest(url, init) },
      response: {
        status: response.status,
        headers: captureHeaders(response.headers, KEPT_RESPONSE_HEADERS),
        body,
      },
    });

    return new Response(body, { status: response.status, headers: response.headers });
  };
}

function save(name: string, scenario: string, pair: Pair): void {
  const exchange: RecordedExchange = { scenario, recordedAt: RECORDED_AT, ...pair };
  const path = fileURLToPath(new URL(`${name}.json`, FIXTURE_DIR));
  writeFileSync(path, `${JSON.stringify(exchange, null, 2)}\n`);
  console.log(`  saved ${name}.json — ${pair.response.status} ${pair.response.headers["request-id"] ?? ""}`);
}

function client(captured: Pair[], defaultHeaders: Record<string, string | null> = {}): Anthropic {
  // maxRetries: 0, so one scenario records one exchange. The SDK's retry
  // policy (responsibility ⑤) would otherwise record the 429 three times.
  return new Anthropic({
    baseURL: BASE_URL,
    apiKey: API_KEY,
    maxRetries: 0,
    fetch: recordingFetch(captured),
    defaultHeaders,
  });
}

async function main(): Promise<void> {
  mkdirSync(fileURLToPath(FIXTURE_DIR), { recursive: true });
  console.log(`recording against ${BASE_URL}`);

  // Scenarios 1 + 2: exercise 07 Part A's whole job, through the real
  // adapter and supervisor. Two exchanges: the ask, then the answer.
  const loopPairs: Pair[] = [];
  const specText = readFileSync(
    fileURLToPath(new URL("../../07-tool-loop/specs/audit-atlas.json", import.meta.url)),
    "utf8",
  );
  const admission = admitTaskSpec(JSON.parse(specText));
  if (!admission.admitted) throw new Error(admission.rejections.join("; "));

  const gateway = new AnthropicModelGateway(client(loopPairs), MODEL);
  const report = await runTask(gateway, admission.spec);
  if (report.outcome !== "landed" || loopPairs.length !== 2) {
    throw new Error(`expected a landed 2-call run, got ${report.outcome} in ${loopPairs.length}`);
  }
  save("tool-ask", "call 1 of the audit job: the reply asks for graph_health", loopPairs[0]!);
  save("tool-answered", "call 2 of the audit job: the reply answers from the tool_result", loopPairs[1]!);

  // Scenario 3: the mock throttles on demand; the header is the trigger.
  const throttledPairs: Pair[] = [];
  const throttled = new AnthropicModelGateway(
    client(throttledPairs, { "x-mock-scenario": "rate-limit" }),
    MODEL,
  );
  const throttledResult = await throttled.complete({
    transcript: [{ from: "operator", text: admission.spec.instruction }],
    maxTokens: admission.spec.maxTokens,
    tools: [],
  });
  if (throttledResult.ok || throttledResult.failure.kind !== "throttled") {
    throw new Error("expected a throttled failure");
  }
  save("throttled", "x-mock-scenario: rate-limit — 429 with a retry-after header", throttledPairs[0]!);

  // Scenario 4: a null default header DELETES the header, so the request
  // goes out with no x-api-key and the mock answers 401.
  const noAuthPairs: Pair[] = [];
  const noAuth = new AnthropicModelGateway(client(noAuthPairs, { "x-api-key": null }), MODEL);
  const noAuthResult = await noAuth.complete({
    transcript: [{ from: "operator", text: admission.spec.instruction }],
    maxTokens: admission.spec.maxTokens,
    tools: [],
  });
  if (noAuthResult.ok || noAuthResult.failure.kind !== "rejected") {
    throw new Error("expected a rejected failure");
  }
  save("no-auth", "the x-api-key header removed — 401 authentication_error", noAuthPairs[0]!);

  // Scenario 5 is DERIVED, not recorded: tool-answered with its
  // stop_reason tampered to a value outside the wire contract. The mock
  // cannot be asked to drift mid-stream, so the recorder plays lesson
  // 0011's role of the hostile editor.
  const drifted: Pair = {
    request: loopPairs[1]!.request,
    response: {
      ...loopPairs[1]!.response,
      body: loopPairs[1]!.response.body.replaceAll('"stop_reason":"end_turn"', '"stop_reason":"end-turn"'),
    },
  };
  if (drifted.response.body === loopPairs[1]!.response.body) {
    throw new Error("tamper found nothing to replace");
  }
  save("drifted-stop", "derived from tool-answered: stop_reason tampered to end-turn", drifted);

  console.log(`\nrecorded. Job report for the loop run: ${report.outcome}, ${report.tokensSpent} tokens.`);
}

main().catch((err: unknown) => {
  console.error(err);
  process.exitCode = 1;
});
