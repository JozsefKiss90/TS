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

  const stream = await client.messages.create({ ...params, stream: true });

  for await (const event of stream) {
    console.log("event:", event.type);

    if (
      event.type === "content_block_delta" &&
      event.delta.type === "text_delta"
    ) {
      console.log("  text delta:", JSON.stringify(event.delta.text));
    }

    // These final values do not arrive in message_start's skeleton.
    if (event.type === "message_delta") {
      console.log("  stop_reason:", event.delta.stop_reason);
      console.log("  output_tokens:", event.usage.output_tokens);
    }
  }
}


async function partB_helper(): Promise<void> {
  console.log("\n=== B. The helper — client.messages.stream() ===");

  const stream = client.messages.stream(params);

  stream.on("text", (delta, _snapshot) => {
    process.stdout.write(delta);
  });

  const message = await stream.finalMessage();
  process.stdout.write("\n");

  const firstBlock = message.content[0];
  const messageRequestId =
    "_request_id" in message ? message._request_id : undefined;

  console.log("message._request_id:", messageRequestId);
  console.log("stream.request_id:", stream.request_id);
  console.log("stop_reason:", message.stop_reason);
  console.log(
    "first text block:",
    firstBlock?.type === "text" ? firstBlock.text : undefined,
  );
  console.log("usage:", message.usage);
}

async function partC_abortMidStream(): Promise<void> {
  console.log("\n=== C. Cancellation — abort mid-stream ===");

  const controller = new AbortController();
  const stream = client.messages.stream(params, {
    signal: controller.signal,
  });
  let partialText = "";

  stream.on("text", (delta, _snapshot) => {
    partialText += delta;
    process.stdout.write(delta);
  });

  const abortTimer = setTimeout(() => controller.abort(), 700);

  try {
    await stream.finalMessage();
    console.log("\nThe stream completed before the abort.");
  } catch (err: unknown) {
    if (!(err instanceof APIUserAbortError)) {
      throw err;
    }

    process.stdout.write("\n");
    console.log("Caught:", err.constructor.name);
    console.log("Partial text:", JSON.stringify(partialText));
    console.log("Characters kept:", partialText.length);
    console.log("Partial stop_reason:", stream.currentMessage?.stop_reason);
  } finally {
    clearTimeout(abortTimer);
  }
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
