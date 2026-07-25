/**
 * Exercise 03 — the same Message, delivered as a process.
 *
 * Lesson: ../../../lessons/0004-the-response-becomes-a-process.html
 * Start the mock in another terminal first (`pnpm mock`), then run this
 * with `pnpm request`.
 *
 * Three parts, in order:
 *   A. Raw events    — `stream: true` in the params; iterate every SSE event.
 *   B. The helper    — `client.messages.stream()`; text chunks + finalMessage().
 *   C. Cancellation  — abort MID-STREAM and see what ⑥ means for a process.
 *
 * Watch BOTH terminals every run: the mock logs each event as it writes it.
 */
import Anthropic, { APIUserAbortError } from "@anthropic-ai/sdk";

// ①② unchanged from exercise 02 — streaming changes delivery, not the client.
const client = new Anthropic({
  baseURL: process.env["ANTHROPIC_BASE_URL"] ?? "http://localhost:8787",
  apiKey: process.env["ANTHROPIC_API_KEY"] ?? "mock-key-any-value-passes",
});

// ④ The params are exercise 02's params. Part A adds ONE field to them.
const params = {
  model: "claude-opus-4-8",
  max_tokens: 100,
  messages: [{ role: "user" as const, content: "Hello, Claude!" }],
};

async function partA_rawEvents(): Promise<void> {
  console.log("\n=== A. Raw events — create({ ..., stream: true }) ===");

  // TODO: call client.messages.create({ ...params, stream: true }) and
  //   `for await (const event of stream)` over the result.
  //   - Log every event's `.type` — write down the exact order you see.
  //   - `event` is a discriminated union (RawMessageStreamEvent): narrow on
  //     event.type === "content_block_delta", then on
  //     event.delta.type === "text_delta", and print the text pieces.
  //   - Where do stop_reason and usage.output_tokens arrive? Not where
  //     exercise 02 found them.
}

async function partB_helper(): Promise<void> {
  console.log("\n=== B. The helper — client.messages.stream() ===");

  // TODO: call client.messages.stream(params)  (no `stream: true` needed —
  //   the method IS the streaming variant).
  //   - stream.on("text", (delta, snapshot) => ...): print each delta as it
  //     arrives (process.stdout.write, not console.log — no newlines).
  //   - const message = await stream.finalMessage();
  //   - Print exercise 02's four things from `message`: _request_id,
  //     stop_reason, first text block, usage. Diff against exercise 02's
  //     output — what did the helper reassemble for you?
  //   - One of the four is a trap. When you find it, print
  //     stream.request_id next to it and explain the difference.
}

async function partC_abortMidStream(): Promise<void> {
  console.log("\n=== C. Cancellation — abort mid-stream ===");

  // TODO: create an AbortController and pass { signal: controller.signal }
  //   as the SECOND argument (request options) to client.messages.stream().
  //   - setTimeout(() => controller.abort(), 700): the mock sends its
  //     skeleton at ~400 ms and a delta every ~120 ms, so 700 ms lands
  //     MID-STREAM — some text has already arrived.
  //   - Accumulate text chunks yourself; catch APIUserAbortError and print
  //     how much of the message you were left holding.
  //   - Check the mock's terminal: how many deltas did it log before
  //     "client aborted the request mid-flight"? Where did the REST of the
  //     message go?
}

async function main(): Promise<void> {
  await partA_rawEvents();
  await partB_helper();
  await partC_abortMidStream();
}

main().catch((err: unknown) => {
  // Part C's abort should be CAUGHT in partC, not land here — if you see an
  // APIUserAbortError below, your catch is in the wrong place.
  if (err instanceof APIUserAbortError) {
    console.error("Unhandled abort:", err.message);
  } else {
    console.error("Request failed:", err);
  }
  process.exitCode = 1;
});
