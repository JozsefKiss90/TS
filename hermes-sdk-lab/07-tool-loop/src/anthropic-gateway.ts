/**
 * The ADAPTER — mechanics below the port.
 *
 * Exercise 06 carried this file forward with no code change. This exercise
 * rewrites two of its three translations, because the call now carries a
 * transcript and the reply can now carry a question:
 *
 *   1. call    — Hermes's Turn[] → the SDK's messages[], ToolSpec[] → tools[]
 *   2. reply   — the SDK's Message → boundary-parsed → text + ToolCall[]
 *   3. failure — the SDK's typed exceptions → GatewayFailure DATA
 *
 * Lesson 0009 changed the DELIVERY, not the translations: every call now
 * streams, so the supervisor can watch progress and abort mid-generation.
 * The helper assembles the same Message the JSON path would have returned,
 * and the boundary parse runs on that assembled Message as before.
 *
 * Two files import "@anthropic-ai/sdk": this one and main.ts. The domain
 * files (gateway.ts, supervisor.ts, tools.ts, fake-gateway.ts) import none
 * of it, and no line of their CODE says "user", "assistant", "tool_use" or
 * "tool_result". Their comments do say those words, to map Hermes's
 * vocabulary onto the wire's. Comments are for you, not for the compiler.
 *
 * Verified against @anthropic-ai/sdk 0.113.0 and zod 4.4.3.
 */
import Anthropic, {
  APIConnectionError,
  APIError,
  APIUserAbortError,
  RateLimitError,
} from "@anthropic-ai/sdk";
import { z } from "zod";
import { formatIssues } from "./issues.js";
import type {
  CallProgress,
  GatewayFailure,
  GatewayResult,
  ModelCall,
  ModelGateway,
  ModelReply,
  StopCause,
  ToolCall,
  Turn,
} from "./gateway.js";

/**
 * The boundary parse, widened for tool use. A reply's content array may now
 * hold two kinds of block, so the schema is a discriminated union on `type`
 * — the same construct the domain uses for Turn and GatewayResult, applied
 * to bytes instead of to Hermes's own values.
 */
const TextBlock = z.object({
  type: z.literal("text"),
  text: z.string(),
});

const ToolUseBlock = z.object({
  type: z.literal("tool_use"),
  id: z.string().min(1),
  name: z.string().min(1),
  input: z.record(z.string(), z.unknown()),
});

const WireReplySchema = z.object({
  content: z.array(z.discriminatedUnion("type", [TextBlock, ToolUseBlock])).min(1),
  stop_reason: z.enum(["end_turn", "max_tokens", "stop_sequence", "tool_use"]),
  usage: z.object({
    input_tokens: z.number().int().nonnegative(),
    output_tokens: z.number().int().nonnegative(),
  }),
});

/** Translation table: the wire's stop vocabulary → Hermes's. */
const STOP_MAP: Record<z.infer<typeof WireReplySchema>["stop_reason"], StopCause> = {
  end_turn: "completed",
  max_tokens: "hit_length_cap",
  stop_sequence: "hit_stop_sequence",
  tool_use: "wants_tool",
};

/**
 * Translation 1a: Hermes's transcript → the wire's messages array.
 *
 * Read the third case. A tool result is NOT a role of its own: it rides in
 * a user message, as blocks keyed by tool_use_id. The domain says
 * `from: "tools"`; this function is the only place that knows the wire
 * calls that turn "user".
 */
function toMessages(transcript: Turn[]): Anthropic.MessageParam[] {
  return transcript.map((turn): Anthropic.MessageParam => {
    if (turn.from === "operator") {
      return { role: "user", content: turn.text };
    }

    if (turn.from === "model") {
      const blocks: Anthropic.ContentBlockParam[] = [];
      if (turn.text.length > 0) {
        blocks.push({ type: "text", text: turn.text });
      }
      for (const call of turn.calls) {
        blocks.push({ type: "tool_use", id: call.id, name: call.name, input: call.input });
      }
      return { role: "assistant", content: blocks };
    }

    return {
      role: "user",
      content: turn.results.map((result) => ({
        type: "tool_result",
        tool_use_id: result.id,
        content: result.output,
        is_error: result.failed,
      })),
    };
  });
}

export class AnthropicModelGateway implements ModelGateway {
  /**
   * The client arrives from OUTSIDE, already configured. Endpoint, auth,
   * retries, timeouts and the model id are wiring decisions, not
   * translation work.
   */
  constructor(
    private readonly client: Anthropic,
    private readonly model: string,
  ) {}

  async complete(
    call: ModelCall,
    options?: { signal?: AbortSignal; onProgress?: (progress: CallProgress) => void },
  ): Promise<GatewayResult> {
    // Since lesson 0009 every call STREAMS. The reason is enforcement: a
    // bound that is only checked after the reply lands cannot stop the
    // reply. The helper assembles the same Message the JSON path returns
    // (measured in lesson 0004), so translation 2 below did not change.
    let message;
    let partialText = "";
    let requestId: string | null = null;
    try {
      // Translation 1: ModelCall → request params. `tools` is omitted
      // entirely when the job permits none, so a job with an empty
      // allowedTools cannot receive a tool_use reply at all.
      const stream = this.client.messages.stream(
        {
          model: this.model,
          max_tokens: call.maxTokens,
          messages: toMessages(call.transcript),
          ...(call.tools.length > 0
            ? {
                tools: call.tools.map((tool) => ({
                  name: tool.name,
                  description: tool.description,
                  input_schema: tool.inputSchema,
                })), 
              }
            : {}),
        },
        options?.signal ? { signal: options.signal } : {},
      );

      // Progress, translated to the port's words. message_start carries the
      // call's input_tokens; each text delta carries a few characters. The
      // true output_tokens arrive only in message_delta, at the very end —
      // which is why CallProgress cannot offer them.
      stream.on("streamEvent", (event) => {
        if (event.type === "message_start") {
          options?.onProgress?.({
            kind: "call_started",
            inputTokens: event.message.usage.input_tokens,
          });
        }
      });
      stream.on("text", (delta) => {
        partialText += delta;
        options?.onProgress?.({ kind: "text", chars: delta.length });
      });

      message = await stream.finalMessage();
      // The assembled Message has no _request_id (lesson 0004); the id
      // lives on the stream itself.
      requestId = stream.request_id ?? null;
    } catch (err) {
      // Translation 3: exceptions → data. See classifyFailure below. An
      // abort keeps whatever text had already streamed in.
      return { ok: false, failure: classifyFailure(err, partialText) };
    }

    // Translation 2: the reply crosses Hermes's boundary — parse, don't
    // trust. `message` is TYPED as Message; it is not yet PROVEN.
    const parsed = WireReplySchema.safeParse(message);
    if (!parsed.success) {
      return { ok: false, failure: { kind: "malformed_reply", issues: formatIssues(parsed.error) } };
    }

    const wire = parsed.data;
    // One content array, two block kinds, two destinations. Narrowing on
    // `type` is what splits them.
    const text = wire.content
      .filter((block) => block.type === "text")
      .map((block) => block.text)
      .join("");
    const calls: ToolCall[] = wire.content
      .filter((block) => block.type === "tool_use")
      .map((block) => ({ id: block.id, name: block.name, input: block.input }));

    const reply: ModelReply = {
      text,
      calls,
      stop: STOP_MAP[wire.stop_reason],
      usage: {
        inputTokens: wire.usage.input_tokens,
        outputTokens: wire.usage.output_tokens,
      },
      requestId,
    };
    return { ok: true, reply };
  }
}

/**
 * Translation 3: the SDK's typed error CLASSES (runtime values that survive
 * compilation) become the port's failure DATA. One change since exercise 05:
 * an abort carries the text that had streamed in before it fired.
 */
function classifyFailure(err: unknown, partialText: string): GatewayFailure {
  if (err instanceof APIUserAbortError) {
    return { kind: "aborted", partialText };
  }

  if (err instanceof RateLimitError) {
    const retryAfter = err.headers?.get("retry-after");

    return {
      kind: "throttled",
      retryAfterMs: retryAfter == null ? null : Number(retryAfter) * 1000,
    };
  }

  if (err instanceof APIConnectionError) {
    return {
      kind: "transport",
      detail: err.message,
    };
  }

  if (err instanceof APIError) {
    return {
      kind: "rejected",
      status: err.status ?? 0,
      detail: err.message,
    };
  }

  throw err;
}
