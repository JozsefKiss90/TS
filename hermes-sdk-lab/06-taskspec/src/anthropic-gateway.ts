/**
 * The ADAPTER — mechanics below the port.
 *
 * Carried forward from exercise 05, complete. Nothing in this file
 * changed for exercise 06: the TaskSpec sits ABOVE the port, so the
 * adapter never learns that one exists.
 *
 * Exactly two files in this exercise import "@anthropic-ai/sdk": this one
 * (translation) and main.ts (wiring — it constructs the client and hands
 * it in). The SDK is not hidden — it is openly used, right here — but its
 * types, its exceptions, and its vocabulary stop below the port: the
 * domain files (gateway.ts, supervisor.ts, fake-gateway.ts) import none
 * of it. Three translations happen on the way up to the port:
 *
 *   1. call     — Hermes's ModelCall  → the SDK's request params
 *   2. reply    — the SDK's Message   → boundary-parsed → Hermes's ModelReply
 *   3. failure  — the SDK's typed exceptions → GatewayFailure DATA
 *
 * Verified against @anthropic-ai/sdk 0.113.0 and zod 4.4.3 (both pinned
 * by measurement — see README).
 */
import Anthropic, {
  APIConnectionError,
  APIError,
  APIUserAbortError,
  RateLimitError,
} from "@anthropic-ai/sdk";
import { z } from "zod";
import type {
  GatewayFailure,
  GatewayResult,
  ModelCall,
  ModelGateway,
  ModelReply,
  StopCause,
} from "./gateway.js";

/**
 * The boundary parse, permanently installed (lesson 0005's move, no
 * longer optional). The SDK's declared `Message` type is an assertion —
 * it performs no runtime check of the bytes. This schema covers exactly
 * what the port's ModelReply consumes: the text, the stop word, and the
 * ledger's numbers. `stop_reason` is NOT nullable here: null belongs to
 * the streaming skeleton (lesson 0004); a finished reply must commit.
 */
const WireReplySchema = z.object({
  content: z
    .array(
      z.object({
        type: z.literal("text"),
        text: z.string(),
      }),
    )
    .min(1),
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

export class AnthropicModelGateway implements ModelGateway {
  /**
   * The client arrives from OUTSIDE, already configured. Endpoint, auth,
   * retries, timeouts — the six responsibilities' knobs — are wiring
   * decisions made where the adapter is constructed, not translation
   * work. The model id is policy too (routing lives above the port), so
   * it also enters as configuration rather than being hardcoded here.
   */
  constructor(
    private readonly client: Anthropic,
    private readonly model: string,
  ) {}

  async complete(
    call: ModelCall,
    options?: { signal?: AbortSignal },
  ): Promise<GatewayResult> {
    let message;
    try {
      // Translation 1: ModelCall → request params. The wire underneath
      // is byte-for-byte lesson 0002's POST /v1/messages — the port
      // adds nothing to the exchange.
      message = await this.client.messages.create(
        {
          model: this.model,
          max_tokens: call.maxTokens,
          messages: [{ role: "user", content: call.prompt }],
        },
        options?.signal ? { signal: options.signal } : {},
      );
    } catch (err) {
      // Translation 3: exceptions → data. See classifyFailure below.
      return { ok: false, failure: classifyFailure(err) };
    }

    // Translation 2: the reply crosses Hermes's boundary — parse, don't
    // trust. `message` is TYPED as Message; it is not yet PROVEN.
    const parsed = WireReplySchema.safeParse(message);
    if (!parsed.success) {
      return {
        ok: false,
        failure: {
          kind: "malformed_reply",
          issues: parsed.error.issues.map(
            (issue) => `${issue.path.join(".") || "(root)"}: [${issue.code}] ${issue.message}`,
          ),
        },
      };
    }

    const wire = parsed.data;
    const reply: ModelReply = {
      text: wire.content.map((block) => block.text).join(""),
      stop: STOP_MAP[wire.stop_reason],
      usage: {
        inputTokens: wire.usage.input_tokens,
        outputTokens: wire.usage.output_tokens,
      },
      requestId: message._request_id ?? null,
    };
    return { ok: true, reply };
  }
}

/**
 * Translation 3: the SDK's typed error CLASSES (runtime values that
 * survive compilation — unlike the port's interfaces) become the port's
 * failure DATA. Branch from most specific to most general, exactly as
 * exercise 02's catch chain did — but the chain now lives below the
 * port, once, instead of in every caller.
 */
function classifyFailure(err: unknown): GatewayFailure {
  if (err instanceof APIUserAbortError) {
    return { kind: "aborted" };
  }

  if (err instanceof RateLimitError) {
    const retryAfter = err.headers?.get("retry-after");

    return {
      kind: "throttled",
      retryAfterMs:
        retryAfter == null
          ? null
          : Number(retryAfter) * 1000,
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
