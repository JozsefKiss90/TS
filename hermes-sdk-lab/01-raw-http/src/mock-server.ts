/**
 * A local stand-in for the Messages API — a test double.
 *
 * It enforces the parts of the wire contract lesson 0001 circled:
 *   ② `x-api-key` must be present          → 401 authentication_error
 *   ③ `anthropic-version` must be present  → 400 invalid_request_error
 *   ④ model · max_tokens · messages        → 400 invalid_request_error
 * and can simulate throttling on demand:
 *   `x-mock-scenario: rate-limit` header   → 429 rate_limit_error + retry-after
 * Since exercise 03 it also speaks the streaming contract:
 *   `"stream": true` in the body          → 200 text/event-stream (SSE)
 * Since exercise 04 its own contract can drift (JSON path only):
 *   `x-mock-scenario: drift` header       → 200 whose BODY shape quietly changed
 * Since exercise 07 it speaks tool use:
 *   `"tools": [...]` in the body          → 200 stop_reason=tool_use + a tool_use block
 *   a tool_result in the last message     → 200 stop_reason=end_turn, quoting it
 *   a tool_result that pairs with nothing → 400 invalid_request_error
 * Since lesson 0009 the STREAMING path speaks tool use too: the same tool
 * decision, delivered as SSE. A tool_use block streams as content_block_start
 * followed by input_json_delta events, per the real event grammar.
 * A request with no `tools` key takes exactly the path it took before, so
 * exercises 01 to 06 are unaffected.
 *
 * The response and error SHAPES are faithful to the real API (verified against
 * current docs); the error message WORDING is a handcrafted approximation.
 * Success answers arrive after a short delay so ⑥ cancellation has a window.
 *
 * Exercise 02 will point the official SDK at this same server through its
 * base-URL override (`baseURL` option / ANTHROPIC_BASE_URL env var) —
 * nothing in here is exercise-01-specific.
 */
import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const PORT = Number(process.env["PORT"] ?? 8787);
const RESPONSE_DELAY_MS = 400; // gives controller.abort() something to interrupt
const STREAM_CHUNK_DELAY_MS = 120; // pacing between SSE deltas — makes the stream watchable
const STREAM_CHUNK_COUNT = 8; // how many text_delta events the fixture text becomes

interface MessageFixture {
  id: string;
  type: "message";
  role: "assistant";
  model: string;
  content: Array<{ type: "text"; text: string }>;
  stop_reason: string;
  stop_sequence: null;
  stop_details: null;
  usage: {
    input_tokens: number;
    output_tokens: number;
    cache_creation_input_tokens: number;
    cache_read_input_tokens: number;
  };
}

// Bytes → JSON.parse → untyped value → type assertion. The exact pipeline
// lesson 0001 §3 dissected: `as MessageFixture` is a claim, not a check.
const here = dirname(fileURLToPath(import.meta.url));
const fixture = JSON.parse(
  readFileSync(join(here, "..", "fixtures", "message-response.json"), "utf8"),
) as MessageFixture;

let requestCounter = 0;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

// ─── tool use (exercise 07) ────────────────────────────────────────────────
// The real API decides WHICH tool to ask for by reading the conversation.
// The mock cannot reason, so it always asks for the first declared tool and
// invents an input from that tool's own JSON Schema. The SHAPES below are
// faithful to the API; the CHOICE is a stand-in. The lesson says so.

/** Does this message carry a tool_result block? Then the loop is on turn 2. */
function carriesToolResult(message: unknown): boolean {
  if (!isRecord(message) || !Array.isArray(message["content"])) return false;
  return message["content"].some((block) => isRecord(block) && block["type"] === "tool_result");
}

/** The ids a message OFFERS: every tool_use block the assistant wrote. */
function toolUseIds(message: unknown): Set<string> {
  const ids = new Set<string>();
  if (!isRecord(message) || !Array.isArray(message["content"])) return ids;
  for (const block of message["content"]) {
    if (isRecord(block) && block["type"] === "tool_use" && typeof block["id"] === "string") {
      ids.add(block["id"]);
    }
  }
  return ids;
}

/**
 * ④ The pairing rule. Every tool_result must answer a tool_use in the
 * message before it. The real API rejects a mismatch, and so does this
 * mock: without the check, a client could drop the assistant's turn and
 * never learn that it mattered.
 */
function unpairedToolResultId(messages: unknown[]): string | null {
  const last = messages[messages.length - 1];
  if (!carriesToolResult(last)) return null;
  const offered = toolUseIds(messages[messages.length - 2]);
  const content = isRecord(last) && Array.isArray(last["content"]) ? last["content"] : [];
  for (const block of content) {
    if (!isRecord(block) || block["type"] !== "tool_result") continue;
    const id = block["tool_use_id"];
    if (typeof id !== "string" || !offered.has(id)) return typeof id === "string" ? id : "(missing)";
  }
  return null;
}

/** Every tool_result's content, joined — the mock quotes it back in its answer. */
function toolResultText(message: unknown): string {
  if (!isRecord(message) || !Array.isArray(message["content"])) return "";
  return message["content"]
    .filter((block) => isRecord(block) && block["type"] === "tool_result")
    .map((block) => String((block as Record<string, unknown>)["content"] ?? ""))
    .join(" ");
}

/** Invent an input that satisfies the tool's declared required properties. */
function inventToolInput(schema: unknown): Record<string, unknown> {
  const properties = isRecord(schema) && isRecord(schema["properties"]) ? schema["properties"] : {};
  const required = isRecord(schema) && Array.isArray(schema["required"])
    ? schema["required"]
    : Object.keys(properties);
  const input: Record<string, unknown> = {};
  for (const key of required) {
    if (typeof key !== "string") continue;
    const property = properties[key];
    const type = isRecord(property) ? property["type"] : "string";
    input[key] = type === "number" || type === "integer" ? 1 : type === "boolean" ? true : "atlas";
  }
  return input;
}

function sendJson(
  res: ServerResponse,
  status: number,
  requestId: string,
  body: unknown,
  extraHeaders: Record<string, string> = {},
): void {
  res.writeHead(status, {
    "content-type": "application/json",
    "request-id": requestId, // the real API returns this header too
    ...extraHeaders,
  });
  res.end(JSON.stringify(body, null, 2));
}

/** Real error envelope: {"type":"error","error":{"type":…,"message":…},"request_id":…} */
function sendError(
  res: ServerResponse,
  status: number,
  requestId: string,
  errorType: string,
  message: string,
  extraHeaders: Record<string, string> = {},
): void {
  sendJson(
    res,
    status,
    requestId,
    { type: "error", error: { type: errorType, message }, request_id: requestId },
    extraHeaders,
  );
  console.log(`  ${requestId} → ${status} ${errorType}: ${message}`);
}

const delay = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

/** One Server-Sent Event: an `event:` line naming the type, a `data:` line of JSON. */
function sendSse(res: ServerResponse, event: string, data: unknown): void {
  res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
}

/** Split the fixture text into `parts` word-boundary chunks (spaces kept on the left). */
function chunkText(text: string, parts: number): string[] {
  const words = text.split(" ");
  const perChunk = Math.ceil(words.length / parts);
  const chunks: string[] = [];
  for (let i = 0; i < words.length; i += perChunk) {
    const chunk = words.slice(i, i + perChunk).join(" ");
    chunks.push(i === 0 ? chunk : ` ${chunk}`);
  }
  return chunks;
}

/** The content a streamed reply will carry: text, or a tool_use request. */
type StreamBlock =
  | { type: "text"; text: string }
  | { type: "tool_use"; id: string; name: string; input: Record<string, unknown> };

/**
 * The streaming answer: the SAME Message as the JSON path, delivered as
 * Server-Sent Events. The event grammar is the real API's (shapes verified
 * against current docs):
 *
 *   message_start → ping → content_block_start → content_block_delta ×N
 *   → content_block_stop (per block) → message_delta → message_stop
 *
 * message_start carries a Message SKELETON (empty content, null stop_reason);
 * the deltas are patches against it; message_delta retrofits stop_reason and
 * final usage. A client that accumulates all of it ends up holding exactly
 * the Message the non-streaming path would have returned in one piece.
 *
 * A text block streams as text_delta chunks. A tool_use block (lesson 0009)
 * streams as a content_block_start carrying id+name with an EMPTY input,
 * then input_json_delta chunks that spell the arguments out as partial JSON.
 *
 * The socket stays open the whole time — ⑥ cancellation now has a target
 * MID-RESPONSE, not just mid-wait.
 */
async function streamMessage(
  res: ServerResponse,
  requestId: string,
  model: string,
  messages: unknown[],
  blocks: StreamBlock[],
  stopReason: string,
): Promise<void> {
  // SSE is not JSON: the content-type announces a held-open event stream,
  // and there is no content-length — the total size is unknown at this point.
  res.writeHead(200, {
    "content-type": "text/event-stream; charset=utf-8",
    "cache-control": "no-cache",
    "request-id": requestId,
  });
  console.log(`  ${requestId} → 200 text/event-stream — the response is now a process`);

  // Same "thinking" pause as the JSON path, then the skeleton.
  await delay(RESPONSE_DELAY_MS);
  if (res.destroyed) return; // aborted while "thinking" — close handler logs it

  const skeleton = {
    ...fixture,
    id: `msg_mock_${requestId.slice(-4)}`,
    model, // echoed, like the JSON path
    content: [], // empty — content arrives as deltas
    stop_reason: null, // unknown until message_delta
    usage: {
      ...fixture.usage,
      input_tokens: Math.max(1, Math.ceil(JSON.stringify(messages).length / 4)),
      output_tokens: 1, // a placeholder — the real count arrives in message_delta
    },
  };
  sendSse(res, "message_start", { type: "message_start", message: skeleton });
  console.log(`  ${requestId} ⋯ message_start (skeleton: content=[], stop_reason=null)`);

  // The real API intersperses pings to keep the connection alive. Watch for
  // this one on the client side — it never arrives (the SDK swallows it).
  sendSse(res, "ping", { type: "ping" });
  console.log(`  ${requestId} ⋯ ping (on the wire — but will your client ever see it?)`);

  let deltasSent = 0;
  for (const [index, block] of blocks.entries()) {
    if (block.type === "text") {
      sendSse(res, "content_block_start", {
        type: "content_block_start",
        index,
        content_block: { type: "text", text: "" },
      });
      const chunks = chunkText(block.text, STREAM_CHUNK_COUNT);
      for (const chunk of chunks) {
        await delay(STREAM_CHUNK_DELAY_MS);
        if (res.destroyed) return; // aborted MID-STREAM — the rest is never generated
        sendSse(res, "content_block_delta", {
          type: "content_block_delta",
          index,
          delta: { type: "text_delta", text: chunk },
        });
        deltasSent += 1;
        console.log(`  ${requestId} ⋯ content_block_delta ${JSON.stringify(chunk)}`);
      }
    } else {
      // A tool_use block: the start event names the tool; the arguments
      // arrive afterwards, as partial JSON. Mid-stream, a client knows WHAT
      // was asked for before it knows the full arguments.
      sendSse(res, "content_block_start", {
        type: "content_block_start",
        index,
        content_block: { type: "tool_use", id: block.id, name: block.name, input: {} },
      });
      const json = JSON.stringify(block.input);
      const pieceLength = Math.ceil(json.length / 3);
      for (let at = 0; at < json.length; at += pieceLength) {
        await delay(STREAM_CHUNK_DELAY_MS);
        if (res.destroyed) return;
        sendSse(res, "content_block_delta", {
          type: "content_block_delta",
          index,
          delta: { type: "input_json_delta", partial_json: json.slice(at, at + pieceLength) },
        });
        deltasSent += 1;
        console.log(`  ${requestId} ⋯ input_json_delta ${JSON.stringify(json.slice(at, at + pieceLength))}`);
      }
    }
    sendSse(res, "content_block_stop", { type: "content_block_stop", index });
  }

  // message_delta retrofits what the skeleton could not know yet.
  sendSse(res, "message_delta", {
    type: "message_delta",
    delta: { stop_reason: stopReason, stop_sequence: null },
    usage: { output_tokens: fixture.usage.output_tokens },
  });
  sendSse(res, "message_stop", { type: "message_stop" });
  res.end();
  console.log(
    `  ${requestId} ⋯ message_delta (stop_reason=${stopReason}) → message_stop — ` +
      `${deltasSent} deltas over ~${RESPONSE_DELAY_MS + deltasSent * STREAM_CHUNK_DELAY_MS} ms`,
  );
}

async function readBody(req: IncomingMessage): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(chunk as Buffer);
  }
  return Buffer.concat(chunks).toString("utf8");
}

const server = createServer((req, res) => {
  void handle(req, res).catch((err: unknown) => {
    console.error("  mock-server internal error:", err);
    if (!res.headersSent) {
      sendError(res, 500, "req_mock_internal", "api_error", "Internal server error");
    }
  });
});

async function handle(req: IncomingMessage, res: ServerResponse): Promise<void> {
  requestCounter += 1;
  const requestId = `req_mock_${String(requestCounter).padStart(4, "0")}`;
  console.log(`\n${req.method} ${req.url}  (${requestId})`);

  // ⑥ If the client aborts mid-flight, the socket closes before we finish.
  res.on("close", () => {
    if (!res.writableFinished) {
      console.log(`  ${requestId} → client aborted the request mid-flight (⑥)`);
    }
  });

  // ① There is exactly one endpoint.
  if (req.method !== "POST" || req.url !== "/v1/messages") {
    sendError(res, 404, requestId, "not_found_error", "Not Found");
    return;
  }

  // ② Authentication. The mock can only check PRESENCE — any value passes.
  //    Whether a key is genuine is something only the real API can decide.
  if (!req.headers["x-api-key"]) {
    sendError(res, 401, requestId, "authentication_error", "x-api-key header is required");
    return;
  }

  // ③ The API version header pins which revision of the contract you speak.
  if (!req.headers["anthropic-version"]) {
    sendError(res, 400, requestId, "invalid_request_error", "anthropic-version header is required");
    return;
  }

  // The body must declare itself as JSON.
  const contentType = req.headers["content-type"] ?? "";
  if (!contentType.includes("application/json")) {
    sendError(res, 400, requestId, "invalid_request_error", "content-type: application/json is required");
    return;
  }

  // Simulated throttling: the real API decides this by load; the mock lets
  // you trigger it deliberately. ⑤ Note the retry-after header — it tells a
  // well-behaved client how long to back off (the SDK reads it in ex. 02).
  if (req.headers["x-mock-scenario"] === "rate-limit") {
    sendError(
      res,
      429,
      requestId,
      "rate_limit_error",
      "Number of requests has exceeded your rate limit (simulated by x-mock-scenario)",
      { "retry-after": "5" },
    );
    return;
  }

  // ④ The request contract. Bytes → JSON.parse → `unknown` — and because the
  //    bytes are untrusted, the mock NARROWS instead of asserting.
  let parsed: unknown;
  try {
    parsed = JSON.parse(await readBody(req));
  } catch {
    sendError(res, 400, requestId, "invalid_request_error", "body: could not parse JSON");
    return;
  }
  if (!isRecord(parsed)) {
    sendError(res, 400, requestId, "invalid_request_error", "body: expected a JSON object");
    return;
  }

  if (typeof parsed["model"] !== "string" || parsed["model"].length === 0) {
    sendError(res, 400, requestId, "invalid_request_error", "model: Field required");
    return;
  }
  if (!Number.isInteger(parsed["max_tokens"]) || (parsed["max_tokens"] as number) < 1) {
    sendError(res, 400, requestId, "invalid_request_error", "max_tokens: Field required");
    return;
  }
  const messages = parsed["messages"];
  if (!Array.isArray(messages) || messages.length === 0) {
    sendError(res, 400, requestId, "invalid_request_error", "messages: at least one message is required");
    return;
  }
  const first: unknown = messages[0];
  if (!isRecord(first) || first["role"] !== "user") {
    sendError(res, 400, requestId, "invalid_request_error", 'messages: first message must use the "user" role');
    return;
  }

  // ④ `tools` is part of the request contract too (exercise 07). Each entry
  //    declares a name and an input_schema, and declaring them changes what
  //    the ANSWER may contain — a reply can now ask instead of finishing.
  const tools = parsed["tools"];
  if (tools !== undefined) {
    if (!Array.isArray(tools)) {
      sendError(res, 400, requestId, "invalid_request_error", "tools: expected an array");
      return;
    }
    for (const tool of tools) {
      if (!isRecord(tool) || typeof tool["name"] !== "string" || tool["name"].length === 0) {
        sendError(res, 400, requestId, "invalid_request_error", "tools: each tool needs a name");
        return;
      }
      if (!isRecord(tool["input_schema"])) {
        sendError(res, 400, requestId, "invalid_request_error", `tools.${tool["name"]}: input_schema is required`);
        return;
      }
    }
  }

  const unpaired = unpairedToolResultId(messages);
  if (unpaired !== null) {
    sendError(
      res,
      400,
      requestId,
      "invalid_request_error",
      `messages: tool_result "${unpaired}" answers no tool_use in the preceding message`,
    );
    return;
  }

  // ④ still holds: `stream: true` is part of the request contract, and it
  // changes the response's DELIVERY, not the gates above or the Message itself.
  // The tool decision is the SAME one the JSON path makes below; only the
  // delivery differs. A request with no tools streams the fixture, as before.
  if (parsed["stream"] === true) {
    const last: unknown = messages[messages.length - 1];
    let blocks: StreamBlock[];
    let stopReason = fixture.stop_reason;
    if (Array.isArray(tools) && tools.length > 0 && !carriesToolResult(last)) {
      const first = tools[0] as Record<string, unknown>;
      blocks = [
        { type: "text", text: "I need the graph health report first." },
        {
          type: "tool_use",
          id: `toolu_mock_${String(requestCounter).padStart(4, "0")}`,
          name: first["name"] as string,
          input: inventToolInput(first["input_schema"]),
        },
      ];
      stopReason = "tool_use";
    } else if (carriesToolResult(last)) {
      blocks = [{ type: "text", text: `Audit complete. The tool reported: ${toolResultText(last)}` }];
      stopReason = "end_turn";
    } else {
      blocks = fixture.content;
    }
    await streamMessage(res, requestId, parsed["model"], messages, blocks, stopReason);
    return;
  }

  // Contract satisfied. Simulate latency, then return the canned Message.
  await new Promise((resolve) => setTimeout(resolve, RESPONSE_DELAY_MS));
  if (res.destroyed) {
    return; // the client aborted while we were "thinking"
  }

  const body: MessageFixture = {
    ...fixture,
    id: `msg_mock_${String(requestCounter).padStart(4, "0")}`,
    model: parsed["model"], // the real API echoes the model that served you
    usage: {
      ...fixture.usage,
      // A rough estimate, so usage varies with your input like the real thing.
      input_tokens: Math.max(1, Math.ceil(JSON.stringify(messages).length / 4)),
    },
  };

  // The tool branch. Turn 1 asks for a tool; turn 2 answers, because the
  // last message now carries the result. Note the id: the client must send
  // it back as tool_use_id, or the API cannot pair answer to question.
  const lastMessage: unknown = messages[messages.length - 1];
  if (Array.isArray(tools) && tools.length > 0 && !carriesToolResult(lastMessage)) {
    const first = tools[0] as Record<string, unknown>;
    const toolUse = {
      type: "tool_use" as const,
      id: `toolu_mock_${String(requestCounter).padStart(4, "0")}`,
      name: first["name"] as string,
      input: inventToolInput(first["input_schema"]),
    };
    // A tool_use reply is still one Message. The content array simply holds
    // a second block, and stop_reason commits to "tool_use".
    const asking = {
      ...body,
      content: [{ type: "text", text: "I need the graph health report first." }, toolUse],
      stop_reason: "tool_use",
    };
    sendJson(res, 200, requestId, asking);
    console.log(
      `  ${requestId} → 200 stop_reason=tool_use — asked for ${toolUse.name}(${JSON.stringify(toolUse.input)}) ` +
        `id=${toolUse.id}`,
    );
    return;
  }

  if (carriesToolResult(lastMessage)) {
    // The mock quotes the tool's output so you can see it crossed the wire.
    const answered = {
      ...body,
      content: [{ type: "text", text: `Audit complete. The tool reported: ${toolResultText(lastMessage)}` }],
    };
    sendJson(res, 200, requestId, answered);
    console.log(`  ${requestId} → 200 stop_reason=end_turn — answered from the tool_result`);
    return;
  }

  // Simulated contract drift (exercise 04): same 200, same headers, same
  // request-id — but the body no longer matches the shape your types claim.
  // Note the type below is NOT MessageFixture anymore; the mock has to drop
  // the annotation to tell this lie, exactly like the real world would.
  if (req.headers["x-mock-scenario"] === "drift") {
    const drifted = {
      ...body,
      // value drift: still a string, but not one of the contract's strings
      stop_reason: "end-turn",
      // type drift: the count is right, the TYPE is wrong
      usage: { ...body.usage, output_tokens: String(body.usage.output_tokens) },
    };
    sendJson(res, 200, requestId, drifted);
    console.log(
      `  ${requestId} → 200 DRIFTED — output_tokens: "${drifted.usage.output_tokens}" (a string), ` +
        `stop_reason: ${drifted.stop_reason} — will any layer notice?`,
    );
    return;
  }

  sendJson(res, 200, requestId, body);
  console.log(`  ${requestId} → 200 stop_reason=${body.stop_reason} input_tokens=${body.usage.input_tokens}`);
}

server.on("error", (err: NodeJS.ErrnoException) => {
  if (err.code === "EADDRINUSE") {
    console.error(`Port ${PORT} is already in use — is another mock still running?`);
    process.exit(1);
  }
  throw err;
});

server.listen(PORT, () => {
  console.log(`mock Messages API listening on http://localhost:${PORT}`);
  console.log(`POST /v1/messages — Ctrl+C to stop`);
});
