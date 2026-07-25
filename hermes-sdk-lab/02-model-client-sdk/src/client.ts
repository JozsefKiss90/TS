import Anthropic, {
  APIConnectionTimeoutError,
  APIError,
  APIUserAbortError,
  RateLimitError,
} from "@anthropic-ai/sdk";

// ① Endpoint and ② authentication are durable client configuration.
// The SDK also supplies ③ `anthropic-version` automatically.
const client = new Anthropic({
  baseURL: process.env["ANTHROPIC_BASE_URL"] ?? "http://localhost:8787",
  apiKey:
    process.env["ANTHROPIC_API_KEY"] ?? "mock-key-any-value-passes",
});

async function main(): Promise<void> {
  // ⑥ Cancellation belongs in the per-request options, not the JSON body.
  const controller = new AbortController();

  // Uncomment to test cancellation against the mock's ~400 ms delay:
  setTimeout(() => controller.abort(), 100);
  client.baseURL 
  try {
    // ④ The SDK types, serializes, sends, parses, and types the message.
    const message = await client.messages.create(
      {
        model: "claude-opus-4-8",
        max_tokens: 100,
        messages: [{ role: "user", content: "Hello, Claude!" }],
      },
      {
        signal: controller.signal,

        // Uncomment both lines to test an immediate 429:
        // headers: { "x-mock-scenario": "rate-limit" },
        // maxRetries: 0,

        // Or uncomment this to test a timeout:
        timeout: 200,
      },
    );

    console.log("Request ID:", message._request_id);
    console.log("Stop Reason:", message.stop_reason);

    // content[0] may be undefined, and ContentBlock is a discriminated union.
    const firstBlock = message.content[0];
    if (firstBlock?.type === "text") {
      console.log("First Content Block:", firstBlock.text);
    } else {
      console.log("First Content Block: (no text content)");
    }

    console.log(
      "Usage:",
      message.usage.input_tokens,
      "input tokens /",
      message.usage.output_tokens,
      "output tokens",
    );
  } catch (err: unknown) {
    // ⑤ Branch from the most specific SDK error to the most general.
    if (err instanceof RateLimitError) {
      console.error(
        "Rate limit error:",
        err.status,
        err.type,
        err.requestID,
        `retry-after=${err.headers?.get("retry-after") ?? "not supplied"}`,
      );
    } else if (err instanceof APIUserAbortError) {
      console.error("Request aborted by user:", err.message);
    } else if (err instanceof APIConnectionTimeoutError) {
      console.error("Request timed out:", err.message);
    } else if (err instanceof APIError) {
      console.error(
        "API error:",
        err.status,
        err.type,
        err.requestID,
        err.message,
      );
    } else {
      // Non-SDK failures remain unexpected and should not be hidden.
      throw err;
    }
  }
}

main().catch((err: unknown) => {
  console.error("Request failed:", err);
  process.exitCode = 1;
});