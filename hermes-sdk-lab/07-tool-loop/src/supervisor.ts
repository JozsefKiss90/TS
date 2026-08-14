/**
 * Domain code — the Phase 1 job supervisor, now bounded.
 *
 * Lesson 0008 left one bound: a literal cap on model calls, hard-coded so
 * the loop could terminate at all. Lesson 0009 replaces it with the spec's
 * three bounds, and enforcement runs at three moments:
 *
 *   BEFORE a call — a job at its ceiling never starts another call, and a
 *                   job past its call cap stops.
 *   DURING a call — progress from the gateway feeds an estimate; when the
 *                   estimate reaches the ceiling, or the deadline passes,
 *                   one AbortController stops the generation mid-flight.
 *   AFTER a call  — the true usage arrives and the ledger books it.
 *
 * The true output count arrives only when a reply finishes, so the in-flight
 * check acts on an ESTIMATE, and the estimate errs toward stopping early.
 * Nothing here names a provider, and nothing here runs a tool.
 */
import type { CallProgress, ModelGateway, ToolOutcome, Turn } from "./gateway.js";
import type { TaskSpec } from "./task-spec.js";
import { offerTools, runTool } from "./tools.js";

export interface JobReport {
  task: string;
  outcome: "landed" | "retry_later" | "gave_up" | "over_budget" | "out_of_time";
  /**
   * How many times the job called the model. One tool call answered costs
   * two: the ask, then the answer.
   */
  modelCalls: number;
  toolRuns: string[];
  tokensSpent: number;
  notes: string[];
}

/**
 * Text averages about four characters per token. Dividing by three
 * overestimates on purpose: an estimate that errs high stops a generation
 * early, and an estimate that errs low lets it breach the ceiling.
 */
const estimateTokens = (chars: number): number => Math.ceil(chars / 3);

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
  const alerts: string[] = [];
  let tokensSpent = 0;

  // One controller serves every bound. The deadline arms it now, the budget
  // check can fire it mid-call, and AbortSignal.any merges it with the
  // operator's own signal — any of the three stops the same generation.
  let boundHit: "budget" | "deadline" | null = null;
  const bounds = new AbortController();
  const deadline = setTimeout(() => {
    boundHit = "deadline";
    bounds.abort();
  }, spec.deadlineMs);
  const signal = options?.signal
    ? AbortSignal.any([options.signal, bounds.signal])
    : bounds.signal;

  const report = (
    outcome: JobReport["outcome"],
    modelCalls: number,
    notes: string[],
  ): JobReport => ({
    task: spec.title,
    outcome,
    modelCalls,
    toolRuns,
    tokensSpent,
    notes: [...alerts, ...notes],
  });

  try {
    for (let modelCall = 1; modelCall <= spec.maxModelCalls; modelCall++) {
      // BEFORE: a job that has reached its ceiling makes no further calls.
      if (tokensSpent >= spec.costCeilingTokens) {
        return report("over_budget", modelCall - 1, [
          `spent ${tokensSpent} of ${spec.costCeilingTokens} tokens before call ${modelCall}`,
        ]);
      }

      // DURING: the estimate is booked spend, plus this call's input (true,
      // from the start of the reply), plus estimated output so far.
      let callInputTokens = 0;
      let callChars = 0;
      const onProgress = (progress: CallProgress): void => {
        if (progress.kind === "call_started") callInputTokens = progress.inputTokens;
        else callChars += progress.chars;

        const estimate = tokensSpent + callInputTokens + estimateTokens(callChars);
        if (alerts.length === 0 && estimate >= 0.8 * spec.costCeilingTokens) {
          alerts.push(`budget alert: estimated spend passed 80% of ${spec.costCeilingTokens}`);
        }
        if (estimate >= spec.costCeilingTokens && boundHit === null) {
          boundHit = "budget";
          bounds.abort();
        }
      };

      const result = await gateway.complete(
        { transcript, maxTokens: spec.maxTokens, tools },
        { signal, onProgress },
      );

      if (!result.ok) {
        const failure = result.failure;
        switch (failure.kind) {
          case "throttled":
            return report("retry_later", modelCall, [
              `provider asked for ${failure.retryAfterMs ?? "an unspecified"} ms of backoff`,
            ]);
          case "aborted": {
            // The abort itself does not say why. The supervisor fired the
            // controller, so the supervisor knows.
            tokensSpent += callInputTokens + estimateTokens(callChars);
            const partial =
              failure.partialText.length > 0
                ? [`partial artifact kept (${failure.partialText.length} chars): ${failure.partialText}`]
                : [];
            if (boundHit === "budget") {
              return report("over_budget", modelCall, [
                `ceiling ${spec.costCeilingTokens} reached mid-generation; spend is estimated — the true count never arrived`,
                ...partial,
              ]);
            }
            if (boundHit === "deadline") {
              return report("out_of_time", modelCall, [
                `deadline of ${spec.deadlineMs} ms passed`,
                ...partial,
              ]);
            }
            return report("gave_up", modelCall, ["aborted by the operator", ...partial]);
          }
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
      // AFTER: the reply finished, so the true counts exist. The ledger adds
      // up rather than overwriting, and the input half grows per call.
      tokensSpent += reply.usage.inputTokens + reply.usage.outputTokens;

      // The model's turn goes into the transcript BEFORE the tools run. Drop
      // it and the next request asks a question the provider has no record of.
      transcript.push({ from: "model", text: reply.text, calls: reply.calls });

      if (reply.stop !== "wants_tool") {
        return report("landed", modelCall, [
          `stop: ${reply.stop}`,
          `request: ${reply.requestId ?? "(none)"}`,
          `answer: ${reply.text}`,
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

    return report("gave_up", spec.maxModelCalls, [
      `the model still wanted a tool after ${spec.maxModelCalls} model calls`,
    ]);
  } finally {
    // A bound that outlives its job is a leak: clear the timer on every exit.
    clearTimeout(deadline);
  }
}
