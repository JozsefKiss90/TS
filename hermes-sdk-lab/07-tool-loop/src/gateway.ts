/**
 * The PORT — Hermes's side of the model boundary.
 *
 * Exercise 06 carried this file forward from 05 without a change. This
 * exercise changes it, and the change is the lesson: one call becomes a
 * conversation, so the port has to carry a transcript instead of a single
 * prompt.
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
 */
export type GatewayFailure =
  | { kind: "throttled"; retryAfterMs: number | null }
  | { kind: "aborted" }
  | { kind: "transport"; detail: string }
  | { kind: "rejected"; status: number; detail: string }
  | { kind: "malformed_reply"; issues: string[] };

/** A discriminated union you narrow on `ok` — proof or refusal, never both. */
export type GatewayResult =
  | { ok: true; reply: ModelReply }
  | { ok: false; failure: GatewayFailure };

/**
 * The port itself, unchanged in shape. `AbortSignal` may cross it because
 * it is a web platform standard, not an SDK type.
 */
export interface ModelGateway {
  complete(call: ModelCall, options?: { signal?: AbortSignal }): Promise<GatewayResult>;
}
