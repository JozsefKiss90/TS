/**
 * The cost report (lesson 0022): what one run cost, step by step.
 *
 * A pure function over the events of one trace file. No clock, no file
 * system, no telemetry package. Everything it reports is either read from
 * a trace line or computed from trace lines, and it says which.
 *
 * The trace stays the one record of what happened. A report is a view of
 * it: delete every report and nothing is lost, because each can be
 * computed again from the same lines. The report checks itself against
 * the record, too: `agrees` is false whenever the per-step sums and
 * job_ended's totals disagree.
 */
import type { TraceEvent } from "../../07-tool-loop/src/trace.js";
import type { ModelPrice } from "./prices.js";

/**
 * One model call: from its call_started line to its reply line, or to
 * job_ended when the call was cut off and no reply was written.
 */
export interface ModelSpan {
  kind: "model";
  call: number;
  startedAt: number;
  endedAt: number;
  ms: number;
  /** Null when the call was cut off: the provider's split never arrived. */
  inputTokens: number | null;
  outputTokens: number | null;
  tokens: number;
  /**
   * "reply": the provider's own counts, from the reply line.
   * "remainder": the call was cut off, so its tokens are job_ended's total
   * minus everything else. The supervisor wrote that total from its own
   * estimate (lab 07, supervisor.ts), so this number is estimated too.
   */
  source: "reply" | "remainder";
  /** A remainder has no input/output split, so it is priced at the output rate: an upper bound. */
  microUsd: number;
  requestId: string | null;
  /**
   * The Context Pack's share of this call's input. The pack sits in the
   * first turn, and every call resends the transcript, so every call pays
   * for it again. The trace records the pack's characters, not its tokens,
   * so `tokens` is an estimate.
   */
  pack: { ids: string[]; chars: number; tokens: number } | null;
}

/** One tool run: from the gate's decision to the tool's result. */
export interface ToolSpan {
  kind: "tool";
  tool: string;
  id: string;
  call: number;
  decision: "not_permitted" | "auto" | "hold";
  startedAt: number;
  endedAt: number;
  ms: number;
  /** Time spent waiting for a human's verdict, inside `ms`. Null when nothing was held. */
  heldMs: number | null;
  failed: boolean;
}

export type Span = ModelSpan | ToolSpan;

export interface CostReport {
  title: string;
  model: string;
  ceilingTokens: number;
  /** What an earlier run already spent, when this run resumed it. */
  carried: { calls: number; tokens: number } | null;
  spans: Span[];
  /** Carried plus every model span. Computed here, never copied from job_ended. */
  totals: { calls: number; tokens: number; microUsd: number };
  /** job_ended's own figures. Null when the record was cut short. */
  recorded: { calls: number; tokens: number; outcome: string } | null;
  /** True only when the computed totals match job_ended's. A remainder below zero is booked as zero, so it fails here. */
  agrees: boolean;
  /** ALERT_SHARE of the ceiling, in tokens. */
  alertThreshold: number;
  /**
   * The call after which spend first reached the threshold. `estimated` is
   * true when that call is a remainder, because then the placement rests
   * on an estimate too.
   */
  alert: { call: number; tokensAfter: number; estimated: boolean } | null;
  /** Whether job_ended's notes carry the supervisor's budget alert. */
  alertNoted: boolean;
  /** job_started to job_ended. Spans do not cover it all: the gaps are the loop's own bookkeeping. */
  wallMs: number | null;
}

export type CostReportResult = { ok: true; report: CostReport } | { ok: false; reason: string };

/**
 * The mock counts one input token per four characters of the JSON it is
 * sent (lab 01, mock-server.ts). A real tokenizer differs, so the pack's
 * share is an estimate on any provider, and the tests compare it with the
 * paired measurement of lesson 0016.
 */
export const CHARS_PER_TOKEN = 4;

/** The supervisor's alert fires at this share of the ceiling (lab 07 supervisor.ts, lab 12 handlers.ts). */
export const ALERT_SHARE = 0.8;

/**
 * The supervisor's alert note starts with this text. Lab 07 writes it as a
 * string literal and exports no constant, so the report repeats it here.
 */
const ALERT_NOTE = "budget alert:";

type Of<K extends TraceEvent["kind"]> = Extract<TraceEvent, { kind: K }>;

/** A gate still waiting for its tool's result, and when its verdict came, if it was held. */
interface OpenGate {
  gate: Of<"gate">;
  approvedAt: number | null;
}

type Counted = { inputTokens: number; outputTokens: number; requestId: string | null } | { remainder: number };

export function costReport(events: TraceEvent[], price: ModelPrice): CostReportResult {
  const started = events.find((e): e is Of<"job_started"> => e.kind === "job_started");
  if (started === undefined) return { ok: false, reason: "no job_started: the record cannot say what ran" };
  const ended = events.find((e): e is Of<"job_ended"> => e.kind === "job_ended");
  const evidence = events.find((e): e is Of<"evidence_used"> => e.kind === "evidence_used");

  const pack =
    evidence === undefined
      ? null
      : { ids: evidence.ids, chars: evidence.chars, tokens: Math.ceil(evidence.chars / CHARS_PER_TOKEN) };

  const carried =
    started.carriedCalls === undefined && started.carriedTokens === undefined
      ? null
      : { calls: started.carriedCalls ?? 0, tokens: started.carriedTokens ?? 0 };

  // Both kinds of model span share every field but where the tokens came from.
  const modelSpan = (opened: Of<"call_started">, endedAt: number, counted: Counted): ModelSpan => {
    const base = { kind: "model" as const, call: opened.call, startedAt: opened.at, endedAt, ms: endedAt - opened.at, pack };
    if ("remainder" in counted) {
      return {
        ...base,
        inputTokens: null,
        outputTokens: null,
        tokens: counted.remainder,
        source: "remainder",
        microUsd: counted.remainder * price.outputMicroUsd,
        requestId: null,
      };
    }
    return {
      ...base,
      inputTokens: counted.inputTokens,
      outputTokens: counted.outputTokens,
      tokens: counted.inputTokens + counted.outputTokens,
      source: "reply",
      microUsd: counted.inputTokens * price.inputMicroUsd + counted.outputTokens * price.outputMicroUsd,
      requestId: counted.requestId,
    };
  };

  const spans: Span[] = [];
  const openCalls = new Map<number, Of<"call_started">>();
  const openGates: OpenGate[] = [];

  for (const event of events) {
    switch (event.kind) {
      case "call_started":
        openCalls.set(event.call, event);
        break;
      case "reply": {
        const opened = openCalls.get(event.call);
        if (opened === undefined) break;
        openCalls.delete(event.call);
        spans.push(modelSpan(opened, event.at, event));
        break;
      }
      case "gate":
        openGates.push({ gate: event, approvedAt: null });
        break;
      case "approval": {
        // A verdict answers the oldest held gate for the same tool that has
        // no verdict yet: the same order rule as the results below.
        const waiting = openGates.find(
          (o) => o.gate.tool === event.tool && o.gate.decision === "hold" && o.approvedAt === null,
        );
        if (waiting !== undefined) waiting.approvedAt = event.at;
        break;
      }
      case "tool_result": {
        // A result answers the oldest open gate for the same tool. The gate
        // line has no tool-call id, so order is the only join there is.
        const index = openGates.findIndex((o) => o.gate.tool === event.tool);
        const open = index === -1 ? undefined : openGates.splice(index, 1)[0];
        if (open === undefined) break;
        const { gate, approvedAt } = open;
        spans.push({
          kind: "tool",
          tool: event.tool,
          id: event.id,
          call: gate.call,
          decision: gate.decision,
          startedAt: gate.at,
          endedAt: event.at,
          ms: event.at - gate.at,
          heldMs: approvedAt === null ? null : approvedAt - gate.at,
          failed: event.failed,
        });
        break;
      }
      default:
        break;
    }
  }
  // Any call still open had no reply line: the job ended inside it.
  const cutOff = [...openCalls.values()];

  const fromReplies = spans.reduce((sum, s) => (s.kind === "model" ? sum + s.tokens : sum), 0);
  const carriedTokens = carried?.tokens ?? 0;
  const remainder = ended === undefined ? 0 : ended.tokensSpent - carriedTokens - fromReplies;

  for (const [i, opened] of cutOff.entries()) {
    // Only the last open call can carry the remainder. Any other open call
    // (a throttled one, say) was never billed past zero. A negative
    // remainder is booked as zero: no span prints negative dollars, and the
    // totals then miss the record, so the report disagrees.
    const booked = i === cutOff.length - 1 ? Math.max(0, remainder) : 0;
    spans.push(modelSpan(opened, ended?.at ?? opened.at, { remainder: booked }));
  }
  spans.sort((a, b) => a.startedAt - b.startedAt);

  const modelSpans = spans.filter((s): s is ModelSpan => s.kind === "model");
  const totals = {
    calls: (carried?.calls ?? 0) + modelSpans.length,
    tokens: carriedTokens + modelSpans.reduce((sum, s) => sum + s.tokens, 0),
    microUsd: modelSpans.reduce((sum, s) => sum + s.microUsd, 0),
  };

  const recorded =
    ended === undefined ? null : { calls: ended.modelCalls, tokens: ended.tokensSpent, outcome: ended.outcome };

  // A remainder is legal only where a call was cut off, and never below
  // zero. With no cut-off call, nothing books a remainder, so any gap
  // between replies and record shows as unequal totals. With one, a
  // negative remainder is booked as zero, which leaves the totals unequal
  // too. So one comparison catches both. On a run with a legal remainder
  // the token totals match by construction: the zero floor is the only
  // token check left there.
  const agrees = recorded !== null && totals.calls === recorded.calls && totals.tokens === recorded.tokens;

  const threshold = ALERT_SHARE * started.costCeilingTokens;
  let running = carriedTokens;
  let alert: CostReport["alert"] = null;
  for (const span of modelSpans) {
    running += span.tokens;
    if (running >= threshold) {
      alert = { call: span.call, tokensAfter: running, estimated: span.source === "remainder" };
      break;
    }
  }

  return {
    ok: true,
    report: {
      title: started.title,
      model: price.model,
      ceilingTokens: started.costCeilingTokens,
      alertThreshold: threshold,
      carried,
      spans,
      totals,
      recorded,
      agrees,
      alert,
      alertNoted: ended?.notes.some((n) => n.startsWith(ALERT_NOTE)) ?? false,
      wallMs: ended === undefined ? null : ended.at - started.at,
    },
  };
}
