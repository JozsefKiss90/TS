/**
 * Domain code — a first sliver of the Phase 1 job supervisor.
 *
 * Read the imports before the code: this file imports ONLY the port.
 * The SDK's package name appears nowhere in it — grep for the name
 * (the README's dependency-direction check) and this file is not a hit. The
 * supervisor cannot tell an AnthropicModelGateway from a
 * FakeModelGateway, and that ignorance is what Parts A and C exploit:
 * the same function runs against the mock wire and against no wire.
 */
import type { ModelGateway } from "./gateway.js";

export interface JobReport {
  outcome: "landed" | "retry_later" | "gave_up";
  tokensSpent: number;
  notes: string[];
}

/**
 * Run one model call and turn whatever happened into a report — the
 * loop's smallest unit of POLICY. Note the shape of this function:
 * no try/catch, because failure arrives as data; a switch on
 * `failure.kind`, because classifying is the supervisor's job
 * (S4: "typed errors the supervisor can classify").
 */
export async function superviseOneCall(
  gateway: ModelGateway,
  prompt: string,
  options?: { signal?: AbortSignal },
): Promise<JobReport> {
  const result = await gateway.complete({ prompt, maxTokens: 100 }, options);

  if (result.ok) {
    // Narrowed: `result.reply` exists on this arm only — safeParse's
    // union shape (lesson 0005 §3), now the port's native idiom.
    const { usage, stop, requestId } = result.reply;
    return {
      outcome: "landed",
      // The ledger. These numbers were checked at the adapter's
      // boundary parse — no "1142" can reach this line.
      tokensSpent: usage.inputTokens + usage.outputTokens,
      notes: [`stop: ${stop}`, `request: ${requestId ?? "(none)"}`],
    };
  }

  // POLICY decisions, one per failure kind. The exhaustive switch is
  // compiler-checked: add a kind to the port and this fails to build
  // until the supervisor decides what it means.
  const failure = result.failure;
  switch (failure.kind) {
    case "throttled":
      return {
        outcome: "retry_later",
        tokensSpent: 0,
        notes: [`provider asked for ${failure.retryAfterMs ?? "an unspecified"} ms of backoff`],
      };
    case "aborted":
      return { outcome: "gave_up", tokensSpent: 0, notes: ["aborted by the operator"] };
    case "malformed_reply":
      return {
        outcome: "gave_up",
        tokensSpent: 0, // a lying ledger is worse than an empty one — nothing is counted
        notes: ["reply refused at the boundary", ...failure.issues],
      };
    case "transport":
      return { outcome: "gave_up", tokensSpent: 0, notes: [`transport failure: ${failure.detail}`] };
    case "rejected":
      return {
        outcome: "gave_up",
        tokensSpent: 0,
        notes: [`request rejected (${failure.status}): ${failure.detail}`],
      };
  }
}
