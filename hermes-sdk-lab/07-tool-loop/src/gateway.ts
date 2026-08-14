/**
 * The PORT — Hermes's side of the model boundary.
 *
 * Exercise 06 carried this file forward from 05 without a change. Lesson
 * 0008 rewrote it: one call became a conversation, so the port carries a
 * transcript instead of a single prompt. Lesson 0009 added two things: a
 * CallProgress channel, so the supervisor can watch a call while it runs,
 * and partial text on the aborted arm, so a stopped generation still lands
 * as a partial artifact.
 *
 * Everything here is still Hermes's vocabulary. No SDK import, no wire
 * spelling: the adapter translates `Turn` into the API's `messages` and
 * `ToolSpec` into its `tools`, and the domain never learns either word.
 *
 * Interfaces and type aliases are still erased at compile time (lesson
 * 0001). The port is a compile-time contract; the runtime guard is the
 * adapter's boundary parse (lesson 0005).
 */

/**
 * One tool Hermes offers the model. `inputSchema` is a JSON Schema object,
 * which is what the model reads to build its arguments. Hermes owns the
 * shape, and the adapter hands it to the SDK's `input_schema` field.
 *
 * Note the two words. A tool's SCHEMA describes what may be asked for. A
 * ToolCall's `input` below is what was actually asked for.
 */
export interface ToolSpec {
  name: string;
  description: string;
  inputSchema: {
    type: "object";
    properties: Record<string, unknown>;
    required: string[];
  };
}

/**
 * The model's request to run one tool. `id` is the pairing key: the answer
 * Hermes sends back must carry it, or the provider cannot match the two.
 */
export interface ToolCall {
  id: string;
  name: string;
  input: unknown;
}

/** Hermes's answer to one ToolCall. `failed` becomes the wire's is_error. */
export interface ToolOutcome {
  id: string;
  output: string;
  failed: boolean;
}

/**
 * One turn of the transcript. A discriminated union you narrow on `from` —
 * the same shape as GatewayResult (0006) and Admission (0007).
 *
 * Note the third arm. The wire has no "tool" role: tool results travel
 * inside a user message. That translation belongs to the adapter, so the
 * domain gets a word for what the turn IS.
 */
export type Turn =
  | { from: "operator"; text: string }
  | { from: "model"; text: string; calls: ToolCall[] }
  | { from: "tools"; results: ToolOutcome[] };

/** One model call. `transcript` replaces exercise 06's single `prompt`. */
export interface ModelCall {
  transcript: Turn[];
  maxTokens: number;
  tools: ToolSpec[];
}

/**
 * Why a FINISHED reply stopped — Hermes's words for the wire's stop_reason
 * vocabulary. `wants_tool` was declared in exercise 05 and unused until now.
 */
export type StopCause =
  | "completed" // wire: end_turn
  | "hit_length_cap" // wire: max_tokens
  | "hit_stop_sequence" // wire: stop_sequence
  | "wants_tool"; // wire: tool_use — the loop's heartbeat

export interface ModelReply {
  text: string;
  /** Empty unless `stop` is "wants_tool". One entry per tool_use block. */
  calls: ToolCall[];
  stop: StopCause;
  /** The ledger's numbers — validated at the boundary before they get here. */
  usage: { inputTokens: number; outputTokens: number };
  /** Provider request id, kept for the trace (S7). Null if the transport had none. */
  requestId: string | null;
}

/**
 * Every way a call can fail, as DATA the supervisor can classify — the same
 * design safeParse taught in lesson 0005.
 *
 * The aborted arm changed in lesson 0009: an aborted generation is not empty.
 * Whatever text arrived before the abort comes back as `partialText`, so the
 * supervisor can keep it as a partial artifact (S8).
 */
export type GatewayFailure =
  | { kind: "throttled"; retryAfterMs: number | null }
  | { kind: "aborted"; partialText: string }
  | { kind: "transport"; detail: string }
  | { kind: "rejected"; status: number; detail: string }
  | { kind: "malformed_reply"; issues: string[] };

/** A discriminated union you narrow on `ok` — proof or refusal, never both. */
export type GatewayResult =
  | { ok: true; reply: ModelReply }
  | { ok: false; failure: GatewayFailure };

/**
 * What the gateway can report WHILE a call runs (lesson 0009). Another
 * discriminated union, narrowed on `kind`, like Turn and GatewayResult.
 *
 *   call_started — the reply began. Carries the call's input_tokens, which
 *                  the wire reports up front, in message_start.
 *   text         — one chunk of reply text arrived. Carries its length.
 *
 * Note what is MISSING: output tokens. The wire reports the true count only
 * at the end, in message_delta. A supervisor that wants to stop a call
 * mid-generation has to act on an estimate.
 */
export type CallProgress =
  | { kind: "call_started"; inputTokens: number }
  | { kind: "text"; chars: number };

/**
 * The port itself. `AbortSignal` may cross it because it is a web platform
 * standard, not an SDK type. `onProgress` is how enforcement sees inside a
 * call: without it, every bound could only act between calls.
 */
export interface ModelGateway {
  complete(
    call: ModelCall,
    options?: { signal?: AbortSignal; onProgress?: (progress: CallProgress) => void },
  ): Promise<GatewayResult>;
}
