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
    const message = await client.messages.stream(
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