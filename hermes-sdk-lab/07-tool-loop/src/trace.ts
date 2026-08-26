/**
 * The TRACE — the durable record of what one job actually did (lesson 0011).
 *
 * Domain code: it imports zod, the port's types and the issue formatter,
 * and nothing else. No provider, no SDK, no file system — WHERE events land
 * is the wiring's decision, through the TracePort below.
 *
 * Three things live here:
 *
 *   TraceEventSchema — the event vocabulary, one Zod schema. The writer's
 *                      types come from z.infer, and the reader parses with
 *                      safeParse. Same single source of truth as the tool
 *                      catalogue (lesson 0008) and the spec (lesson 0007).
 *   parseTrace       — the reader. A trace file is bytes on disk, and bytes
 *                      are untrusted even when you wrote them yourself: any
 *                      editor, any other program, any crash can have touched
 *                      the file since. The fourth JSON boundary this lab
 *                      defends, after replies, specs and tool arguments.
 *   rebuildResumePoint — replay. The events carry enough to reconstruct the
 *                      transcript and the ledger, so an interrupted job can
 *                      continue instead of starting over.
 *
 * The trace answers ONE question: what happened. It grants nothing and
 * permits nothing — deleting it changes no future decision, and editing it
 * cannot approve a tool. Policy lives in the spec; the trace only records
 * which policy fired.
 */
import { z } from "zod";
import type { ToolOutcome, Turn } from "./gateway.js";
import { formatIssues } from "./issues.js";

/**
 * Every event carries `at`, epoch milliseconds at the moment it happened.
 * There is no sequence field on purpose: a trace file is append-only, so
 * the line number IS the sequence number.
 */
const at = z.number().int().nonnegative();

const JobStarted = z.object({
  kind: z.literal("job_started"),
  at,
  title: z.string().min(1),
  owner: z.string().min(1),
  /** Recorded so a resume can rebuild the transcript's first turn. */
  instruction: z.string().min(1),
  costCeilingTokens: z.number().int().positive(),
  /** Present only on a resumed run: what the earlier run already used. */
  carriedCalls: z.number().int().nonnegative().optional(),
  carriedTokens: z.number().int().nonnegative().optional(),
});

const CallStarted = z.object({
  kind: z.literal("call_started"),
  at,
  call: z.number().int().positive(),
});

/**
 * One finished model reply, with everything the transcript needs to be
 * rebuilt and the one key that joins Hermes's record to the provider's:
 * `requestId`. Nothing else about the trace ever crosses the wire.
 */
const Reply = z.object({
  kind: z.literal("reply"),
  at,
  call: z.number().int().positive(),
  stop: z.enum(["completed", "hit_length_cap", "hit_stop_sequence", "wants_tool"]),
  text: z.string(),
  calls: z.array(
    z.object({ id: z.string().min(1), name: z.string().min(1), input: z.unknown() }),
  ),
  inputTokens: z.number().int().nonnegative(),
  outputTokens: z.number().int().nonnegative(),
  requestId: z.string().nullable(),
});

const Gate = z.object({
  kind: z.literal("gate"),
  at,
  call: z.number().int().positive(),
  tool: z.string().min(1),
  decision: z.enum(["not_permitted", "auto", "hold"]),
});

const Approval = z.object({
  kind: z.literal("approval"),
  at,
  tool: z.string().min(1),
  /** `no_channel` records a default denial: nobody was wired to answer. */
  verdict: z.enum(["approved", "denied", "no_channel", "job_ended"]),
});

const ToolResult = z.object({
  kind: z.literal("tool_result"),
  at,
  id: z.string().min(1),
  tool: z.string().min(1),
  failed: z.boolean(),
  output: z.string(),
});

const JobEnded = z.object({
  kind: z.literal("job_ended"),
  at,
  outcome: z.enum(["landed", "retry_later", "gave_up", "over_budget", "out_of_time"]),
  modelCalls: z.number().int().nonnegative(),
  tokensSpent: z.number().int().nonnegative(),
  notes: z.array(z.string()),
  /** What an aborted generation kept — the partial artifact, in the record. */
  partialText: z.string().optional(),
});

/**
 * The event vocabulary, discriminated on `kind` — the same union shape as
 * Turn, GatewayResult and CallProgress, this time built from a schema so
 * the reader can check bytes against it.
 */
export const TraceEventSchema = z.discriminatedUnion("kind", [
  JobStarted,
  CallStarted,
  Reply,
  Gate,
  Approval,
  ToolResult,
  JobEnded,
]);

export type TraceEvent = z.infer<typeof TraceEventSchema>;

/**
 * The job's third port. The model port answers calls, the approval port
 * answers holds, and this one accepts history. The supervisor appends and
 * never reads; the wiring decides whether events land in a file, in memory,
 * or nowhere.
 *
 * `append` returns void, not a promise: the supervisor must not wait on its
 * own record, and a sink that buffers risks losing the tail — the wiring's
 * file sink writes synchronously for that reason.
 */
export interface TracePort {
  append(event: TraceEvent): void;
}

/** One line of a trace file: a proven event, or the reason it was refused. */
export type TraceLine =
  | { ok: true; event: TraceEvent }
  | { ok: false; line: number; reason: string };

/**
 * The reader. Splits on newlines, parses each line, and REFUSES rather than
 * trusts: a line that is not JSON, or is JSON of the wrong shape, comes back
 * as a refusal with its line number, and the rest of the file still reads.
 * One bad line must not cost the whole record.
 */
export function parseTrace(text: string): TraceLine[] {
  const lines = text.split(/\r?\n/).filter((line) => line.trim().length > 0);
  return lines.map((line, index) => {
    let raw: unknown;
    try {
      raw = JSON.parse(line);
    } catch {
      return { ok: false as const, line: index + 1, reason: "not JSON" };
    }
    const parsed = TraceEventSchema.safeParse(raw);
    if (!parsed.success) {
      return {
        ok: false as const,
        line: index + 1,
        reason: formatIssues(parsed.error).join("; "),
      };
    }
    return { ok: true as const, event: parsed.data };
  });
}

/** Everything a later run needs to continue where an earlier one stopped. */
export interface ResumePoint {
  transcript: Turn[];
  tokensSpent: number;
  modelCalls: number;
}

/**
 * Replay: fold a run's events back into the state the supervisor had when
 * the run ended. The transcript comes from reply and tool_result events,
 * the ledger from job_ended (which includes an aborted call's estimated
 * spend), and the call count from call_started (an aborted call still
 * counts, because it was still billed).
 *
 * Returns null when the events hold no job_started — a record that cannot
 * say how the job began cannot say how to continue it.
 */
export function rebuildResumePoint(events: TraceEvent[]): ResumePoint | null {
  const started = events.find((event) => event.kind === "job_started");
  if (started === undefined || started.kind !== "job_started") return null;

  const transcript: Turn[] = [{ from: "operator", text: started.instruction }];
  let pending: ToolOutcome[] = [];
  let modelCalls = started.carriedCalls ?? 0;
  let tokensFromReplies = started.carriedTokens ?? 0;
  let endedTokens: number | null = null;

  // tool_result events follow the reply they answer, so results collect
  // until the next reply (or the end) closes their turn.
  const flush = (): void => {
    if (pending.length > 0) {
      transcript.push({ from: "tools", results: pending });
      pending = [];
    }
  };

  for (const event of events) {
    switch (event.kind) {
      case "call_started":
        modelCalls += 1;
        break;
      case "reply":
        flush();
        transcript.push({
          from: "model",
          text: event.text,
          calls: event.calls.map((call) => ({ id: call.id, name: call.name, input: call.input })),
        });
        tokensFromReplies += event.inputTokens + event.outputTokens;
        break;
      case "tool_result":
        pending.push({ id: event.id, output: event.output, failed: event.failed });
        break;
      case "job_ended":
        endedTokens = event.tokensSpent;
        break;
      default:
        break;
    }
  }
  flush();

  // A trailing model turn whose tool calls were never answered cannot be
  // resent as-is: the resumed loop expects to ask the model next, so the
  // unanswered ask is dropped and will simply be asked again.
  const last = transcript[transcript.length - 1];
  if (last !== undefined && last.from === "model" && last.calls.length > 0) {
    transcript.pop();
  }

  return {
    transcript,
    // job_ended's figure includes an aborted call's estimated spend, which
    // reply events alone cannot see. The sum is the fallback for a record
    // that was cut short.
    tokensSpent: endedTokens ?? tokensFromReplies,
    modelCalls,
  };
}
