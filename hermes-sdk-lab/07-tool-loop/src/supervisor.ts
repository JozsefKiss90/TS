/**
 * Domain code — the Phase 1 job supervisor, now a loop.
 *
 * Exercise 06 made one call and classified one outcome. The change here is
 * small to read and large in consequence: `complete` is called inside a
 * `for`, and the transcript grows by two turns per tool call answered.
 *
 * The API keeps no memory of the exchange. Every model call resends the
 * whole transcript, which is why the input token count rises as the loop
 * runs. Nothing here names a provider, and nothing here runs a tool: the
 * catalogue does that.
 */
import type { ModelGateway, ToolOutcome, Turn } from "./gateway.js";
import type { TaskSpec } from "./task-spec.js";
import { offerTools, runTool } from "./tools.js";

export interface JobReport {
  task: string;
  outcome: "landed" | "retry_later" | "gave_up";
  /**
   * How many times the job called the model. Exercise 06 made one, by
   * construction. One tool call answered costs two: the ask, then the answer.
   */
  modelCalls: number;
  toolRuns: string[];
  tokensSpent: number;
  notes: string[];
}

/**
 * The only bound this exercise has. A loop that cannot stop is not a loop
 * you can ship, so the cap exists to make the code correct rather than to
 * teach budgeting. It is a literal, and a literal is a placeholder: lesson
 * 0009 replaces it with the spec's own budget, a deadline, and an
 * AbortController that acts on both.
 */
const MAX_MODEL_CALLS = 4;

export async function runTask(
  gateway: ModelGateway,
  spec: TaskSpec,
  options?: { signal?: AbortSignal },
): Promise<JobReport> {
  // The spec decides which tools exist for this job. A tool that is not
  // offered is a tool the model never hears about.
  const tools = offerTools(spec.allowedTools);
  const transcript: Turn[] = [{ from: "operator", text: spec.instruction }];
  const toolRuns: string[] = [];
  let tokensSpent = 0;

  const report = (
    outcome: JobReport["outcome"],
    modelCalls: number,
    notes: string[],
  ): JobReport => ({ task: spec.title, outcome, modelCalls, toolRuns, tokensSpent, notes });

  for (let modelCall = 1; modelCall <= MAX_MODEL_CALLS; modelCall++) {
    const result = await gateway.complete(
      { transcript, maxTokens: spec.maxTokens, tools },
      options,
    );

    if (!result.ok) {
      const failure = result.failure;
      switch (failure.kind) {
        case "throttled":
          return report("retry_later", modelCall, [
            `provider asked for ${failure.retryAfterMs ?? "an unspecified"} ms of backoff`,
          ]);
        case "aborted":
          return report("gave_up", modelCall, ["aborted by the operator"]);
        case "malformed_reply":
          return report("gave_up", modelCall, ["reply refused at the boundary", ...failure.issues]);
        case "transport":
          return report("gave_up", modelCall, [`transport failure: ${failure.detail}`]);
        case "rejected":
          return report("gave_up", modelCall, [
            `request rejected (${failure.status}): ${failure.detail}`,
          ]);
      }
    }

    const reply = result.reply;
    // Every model call is billed, so the ledger adds up rather than
    // overwriting. The input half grows as the transcript grows.
    tokensSpent += reply.usage.inputTokens + reply.usage.outputTokens;

    // The model's turn goes into the transcript BEFORE the tools run. Drop
    // it and the next request asks a question the provider has no record of.
    transcript.push({ from: "model", text: reply.text, calls: reply.calls });

    if (reply.stop !== "wants_tool") {
      return report("landed", modelCall, [
        `stop: ${reply.stop}`,
        `request: ${reply.requestId ?? "(none)"}`,
        `answer: ${reply.text}`,
        `ceiling declared: ${spec.costCeilingTokens} tokens`,
      ]);
    }

    if (reply.calls.length === 0) {
      return report("gave_up", modelCall, ["the reply asked for a tool and named none"]);
    }

    const results: ToolOutcome[] = reply.calls.map((call) => {
      const outcome = runTool(call, spec.allowedTools);
      toolRuns.push(`${call.name} → ${outcome.failed ? "refused" : "ran"}`);
      return outcome;
    });

    // One turn carries every result, in the order the model asked. Splitting
    // them across turns would break the pairing the provider expects.
    transcript.push({ from: "tools", results });
  }

  return report("gave_up", MAX_MODEL_CALLS, [
    `the model still wanted a tool after ${MAX_MODEL_CALLS} model calls`,
  ]);
}
