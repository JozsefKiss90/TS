/**
 * The trace, told back as a story. Presentation only: everything printed
 * here comes from parseTrace, so a tampered or truncated line shows up as a
 * refusal, not as a crash and not as silently trusted data.
 *
 * Times print as +N ms from the first readable event, because "the job
 * ended at 1755600000000" answers nobody's question and "the job ended at
 * +2018 ms" answers the one that matters.
 */
import { parseTrace, type TraceEvent } from "./trace.js";

function describe(event: TraceEvent): string {
  switch (event.kind) {
    case "job_started": {
      const carried =
        event.carriedCalls !== undefined
          ? ` — resumed, carrying ${event.carriedCalls} calls and ${event.carriedTokens ?? 0} tokens`
          : "";
      return `job "${event.title}" for ${event.owner}, ceiling ${event.costCeilingTokens} tokens${carried}`;
    }
    case "call_started":
      return `model call ${event.call} started`;
    case "reply": {
      const asks =
        event.calls.length > 0
          ? `, asks for ${event.calls.map((call) => call.name).join(", ")}`
          : "";
      return (
        `call ${event.call} replied: stop=${event.stop}, ` +
        `${event.inputTokens}+${event.outputTokens} tokens, ` +
        `request ${event.requestId ?? "(none)"}${asks}`
      );
    }
    case "gate":
      return `gate: ${event.tool} → ${event.decision}`;
    case "approval":
      return `approval: ${event.tool} → ${event.verdict}`;
    case "tool_result":
      return `tool ${event.tool} → ${event.failed ? "failed" : "ok"}: ${event.output}`;
    case "job_ended": {
      const partial =
        event.partialText !== undefined
          ? `, partial artifact kept (${event.partialText.length} chars)`
          : "";
      return (
        `job ended: ${event.outcome}, ${event.modelCalls} calls, ` +
        `${event.tokensSpent} tokens${partial}` +
        (event.notes.length > 0 ? `\n           ${event.notes.join("\n           ")}` : "")
      );
    }
  }
}

export function printTraceStory(text: string): void {
  const entries = parseTrace(text);
  if (entries.length === 0) {
    console.log("  (empty trace)");
    return;
  }

  let startAt: number | null = null;
  for (const entry of entries) {
    if (!entry.ok) {
      console.log(`  line ${entry.line} REFUSED: ${entry.reason}`);
      continue;
    }
    startAt ??= entry.event.at;
    const delta = `+${String(entry.event.at - startAt).padStart(5)} ms`;
    console.log(`  ${delta}  ${describe(entry.event)}`);
  }

  const last = entries[entries.length - 1];
  if (last === undefined || !last.ok || last.event.kind !== "job_ended") {
    console.log("  NOTE: no job_ended — the run crashed, or the record was cut short.");
  }
}
