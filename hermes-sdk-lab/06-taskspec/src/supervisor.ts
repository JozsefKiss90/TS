/**
 * Domain code — the Phase 1 job supervisor, now driven by a spec.
 *
 * Compare exercise 05's superviseOneCall(gateway, prompt): the prompt
 * arrived loose, and maxTokens was the literal 100 written into this
 * file. Both were decisions this file had no business making. They now
 * arrive in the TaskSpec, and this file only decides what an outcome
 * MEANS — which is the whole job of a supervisor.
 *
 * The imports still name no provider. They now name the spec too, and
 * the spec names no provider either.
 */
import type { ModelGateway } from "./gateway.js";
import type { TaskSpec } from "./task-spec.js";

export interface JobReport {
  task: string;
  outcome: "landed" | "retry_later" | "gave_up";
  tokensSpent: number;
  notes: string[];
}

/**
 * Run one admitted task. The parameter type is the enforcement: this
 * function cannot be handed a raw object read off disk, because a
 * TaskSpec is only obtainable from a successful parse. "No envelope, no
 * dispatch" is a compile error here, and a runtime rejection in
 * admitTaskSpec.
 */
export async function runTask(
  gateway: ModelGateway,
  spec: TaskSpec,
  options?: { signal?: AbortSignal },
): Promise<JobReport> {
  // The spec drives the call. Nothing about this request is decided in
  // this file any more.
  const result = await gateway.complete(
    { prompt: spec.instruction, maxTokens: spec.maxTokens },
    options,
  );

  if (result.ok) {
    const { usage, stop, requestId } = result.reply;
    return {
      task: spec.title,
      outcome: "landed",
      tokensSpent: usage.inputTokens + usage.outputTokens,
      notes: [
        `stop: ${stop}`,
        `request: ${requestId ?? "(none)"}`,
        // Recorded, not enforced. Lesson 0009 turns this number into an
        // abort; today the spec only has to carry it honestly.
        `ceiling declared: ${spec.costCeilingTokens} tokens`,
        `tools permitted: ${spec.allowedTools.length === 0 ? "(none)" : spec.allowedTools.join(", ")}`,
      ],
    };
  }

  // Four of the five failure kinds end the job the same way, so the
  // shape lives in one place. What differs is the REASON, and the
  // switch below is still where each kind's meaning is decided.
  const gaveUp = (...notes: string[]): JobReport => ({
    task: spec.title,
    outcome: "gave_up",
    tokensSpent: 0, // nothing landed, so nothing is booked
    notes,
  });

  const failure = result.failure;
  switch (failure.kind) {
    case "throttled":
      return {
        task: spec.title,
        outcome: "retry_later", // the one kind worth trying again
        tokensSpent: 0,
        notes: [`provider asked for ${failure.retryAfterMs ?? "an unspecified"} ms of backoff`],
      };
    case "aborted":
      return gaveUp("aborted by the operator");
    case "malformed_reply":
      return gaveUp("reply refused at the boundary", ...failure.issues);
    case "transport":
      return gaveUp(`transport failure: ${failure.detail}`);
    case "rejected":
      return gaveUp(`request rejected (${failure.status}): ${failure.detail}`);
  }
}
