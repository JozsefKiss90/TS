/**
 * The PORT — Hermes's side of the model boundary.
 *
 * Everything in this file is owned by Hermes and written in Hermes's
 * vocabulary. Nothing here imports the SDK; nothing here even knows a
 * provider exists. That is the whole point: domain code depends on THIS
 * file, and adapters depend on it too — the dependency arrow points at
 * the port from both sides (dependency inversion).
 *
 * Note what survives compilation: NOTHING. Interfaces and type aliases
 * are erased (lesson 0001). The port is not a runtime guard — it is a
 * compile-time contract, enforced by the type-checker at every
 * `implements` and every import. The runtime guard lives in the
 * adapter's boundary parse (lesson 0005).
 */

/** One model call, as the loop understands it. Grows in lessons 0008+ (tools). */
export interface ModelCall {
  prompt: string;
  maxTokens: number;
}

/**
 * Why a FINISHED reply stopped — Hermes's words for the wire's
 * stop_reason vocabulary. The adapter translates; the domain never
 * sees the wire's spelling.
 */
export type StopCause =
  | "completed" // wire: end_turn
  | "hit_length_cap" // wire: max_tokens
  | "hit_stop_sequence" // wire: stop_sequence
  | "wants_tool"; // wire: tool_use — the loop's heartbeat, from lesson 0008 on

export interface ModelReply {
  text: string;
  stop: StopCause;
  /** The ledger's numbers — validated at the boundary before they get here. */
  usage: { inputTokens: number; outputTokens: number };
  /** Provider request id, kept for the trace (S7). Null if the transport had none. */
  requestId: string | null;
}

/**
 * Every way a call can fail, as DATA the supervisor can classify —
 * the same design safeParse taught in lesson 0005: failure is an
 * expected outcome, not an unwound stack.
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
 * The port itself. `AbortSignal` may cross it because it is a web
 * platform standard, not an SDK type — the supervisor owns the
 * controller (S6), any adapter can honor the signal.
 */
export interface ModelGateway {
  complete(call: ModelCall, options?: { signal?: AbortSignal }): Promise<GatewayResult>;
}
