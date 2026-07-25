/**
 * Exercise 01 — the raw request, every responsibility by hand.
 *
 * Lesson: ../../../lessons/0002-raw-http-against-a-mock.html
 * Start the mock in another terminal first (`pnpm mock`), then run this
 * with `pnpm request`.
 *
 * Your checklist is lesson 0001's six responsibilities:
 *   ① endpoint · ② authentication · ③ API version · ④ request contract
 *   ⑤ error boundary · ⑥ cancellation
 *
 * Write the fetch call from memory first — peek at lesson 0001 §1 only if
 * you get stuck. The mock's error responses are your feedback loop.
 */

// ① The base URL is a seam: the endpoint path (/v1/messages) is fixed by the
//   contract, but WHERE it points is configuration. The official SDK exposes
//   the same seam as its `baseURL` option / ANTHROPIC_BASE_URL env var —
//   which is exactly how exercise 02 will aim the real SDK at this mock.
const BASE_URL = process.env["ANTHROPIC_BASE_URL"] ?? "http://localhost:8787";

// ② The mock only checks that the header EXISTS — any value passes.
//   Authenticity is the real API's job. Never put a real key in source code.
const API_KEY = process.env["ANTHROPIC_API_KEY"] ?? "mock-key-any-value-passes";

// ④→ A compile-time claim about runtime bytes (lesson 0001 §3): this is YOUR
//   hand-written claim about what the server sends back. Nothing checks it.
interface MessageResponse {
  id: string;
  type: "message";
  role: "assistant";
  model: string;
  content: Array<{ type: "text"; text: string }>;
  stop_reason: string;
  stop_sequence: string | null;
  usage: { input_tokens: number; output_tokens: number };
}

interface ErrorResponse {
  type: "error";
  error: {
    type: string;
    message: string;
  };
  request_id: string;
}

async function main(): Promise<void> {
  // ⑥ TODO: create an AbortController and pass its .signal to fetch.
  //    Later, break it on purpose — the mock takes ~400 ms to answer, so:
  //      setTimeout(() => controller.abort(), 100);
  //    aborts mid-flight.

  // ①–④ TODO: write the request.
  //    POST `${BASE_URL}/v1/messages` with headers
  //      content-type: application/json
  //      x-api-key: <API_KEY>            (②)
  //      anthropic-version: 2023-06-01   (③)
  //    and a JSON body with model, max_tokens, and messages (④).

  // ⑤ TODO: if (!res.ok) — read the error body, print the status and the
  //    error.type the mock sent, and throw. You will trigger this branch on
  //    purpose several times; make its output worth reading.

  // TODO: on success, res.json() hands you untyped data. Attach your
  //    MessageResponse type the way the SDK does — an assertion — and print:
  //      - the `request-id` response header
  //      - stop_reason
  //      - the first content block's text  (careful: with
  //        noUncheckedIndexedAccess, content[0] might be undefined)
  //      - usage.input_tokens / usage.output_tokens
  const controller = new AbortController();
  // Uncomment this while testing responsibility ⑥:
  // setTimeout(() => controller.abort(), 100);

  const res = await fetch(`${BASE_URL}/v1/messages`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-opus-4-8",
      max_tokens: 100,
      messages: [
        { role: "user", content: [{ type: "text", text: "Hello, Claude!" }] },
      ],
    }),
    signal: controller.signal,
  });

  if (!res.ok) {
    const errorBody = (await res.json()) as ErrorResponse;
    const retryAfter = res.headers.get("retry-after");

    console.error(
      `HTTP ${res.status} ${errorBody.error.type}: ${errorBody.error.message}`,
    );
    console.error("Request ID:", errorBody.request_id);
    if (retryAfter !== null) {
      console.error(`Retry after: ${retryAfter} seconds`);
    }

    throw new Error(`Request failed with status ${res.status}`);
  }

  const data = (await res.json()) as MessageResponse;
  console.log("Request ID:", res.headers.get("request-id"));
  console.log("Stop Reason:", data.stop_reason);
  console.log("First Content Block:", data.content[0]?.text ?? "(no content)");
  console.log(
    "Usage:",
    data.usage.input_tokens,
    "input tokens /",
    data.usage.output_tokens,
    "output tokens",
  );
}

main().catch((err: unknown) => {
  console.error("request failed:", err);
  process.exitCode = 1;
});