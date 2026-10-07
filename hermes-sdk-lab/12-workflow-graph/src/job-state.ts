/**
 * The JOB STATE — what the interpreter carries from one node to the next
 * (lesson 0018).
 *
 * Lab 07's supervisor keeps this in local variables inside one function:
 * the transcript, the ledger, the tool runs, the reply it is about to
 * book, the tool calls it has not answered yet. A loop that lives in one
 * function can keep its state on the stack. A loop that advances one node
 * per step, and can be stopped between any two, has to carry its state as
 * a value. This is that value.
 *
 * It is a schema, not an interface, because a checkpoint writes it to disk
 * and reads it back (checkpoint.ts). Same single source of truth as the
 * trace vocabulary: the writer's type is z.infer, the reader parses.
 *
 * What is NOT here: the clock, the AbortController, the signal, the
 * in-flight call. Those are runtime. A checkpoint cannot hold a timer, and
 * a resumed run starts a fresh one. Lesson 0011 made the same decision
 * for its resume: time lost is gone either way.
 */
import { z } from "zod";
import type { TaskSpec } from "../../07-tool-loop/src/task-spec.js";

const ToolCallSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  input: z.unknown(),
});

const ToolOutcomeSchema = z.object({
  id: z.string().min(1),
  output: z.string(),
  failed: z.boolean(),
});

/** The port's Turn (lesson 0008), as a schema so a checkpoint can be read back. */
const TurnSchema = z.discriminatedUnion("from", [
  z.object({ from: z.literal("operator"), text: z.string() }),
  z.object({ from: z.literal("model"), text: z.string(), calls: z.array(ToolCallSchema) }),
  z.object({ from: z.literal("tools"), results: z.array(ToolOutcomeSchema) }),
]);

/** The port's ModelReply, received and not yet booked. */
const ReplySchema = z.object({
  text: z.string(),
  calls: z.array(ToolCallSchema),
  stop: z.enum(["completed", "hit_length_cap", "hit_stop_sequence", "wants_tool"]),
  usage: z.object({
    inputTokens: z.number().int().nonnegative(),
    outputTokens: z.number().int().nonnegative(),
  }),
  requestId: z.string().nullable(),
});

export const JobStateSchema = z.strictObject({
  transcript: z.array(TurnSchema),
  /** Calls made so far. The ledger, as in lab 07. */
  modelCalls: z.number().int().nonnegative(),
  tokensSpent: z.number().int().nonnegative(),
  toolRuns: z.array(z.string()),
  alerts: z.array(z.string()),
  /** The canonical ids this job was grounded in (lesson 0016). */
  evidenceIds: z.array(z.string()),

  /** A reply the calling node received and the replied node has not booked. */
  reply: ReplySchema.nullable(),
  /** Tool calls the model asked for, in order, not yet answered. */
  pending: z.array(ToolCallSchema),
  /** Answers collected for the turn under construction. */
  results: z.array(ToolOutcomeSchema),
  /** The gate's decision on pending[0], once the gating node has made it. */
  gate: z.enum(["not_permitted", "auto", "hold"]).nullable(),
  /** The operator's verdict on pending[0], once a held call has one. */
  verdict: z.enum(["approved", "denied", "no_channel"]).nullable(),

  /** Why the run is heading for a terminal node, set by the node that chose it. */
  exit: z.object({ notes: z.array(z.string()), partialText: z.string().optional() }).nullable(),
});

export type JobState = z.infer<typeof JobStateSchema>;

/** The state a fresh run starts in: the operator's instruction, and nothing spent. */
export function initialState(spec: TaskSpec): JobState {
  return {
    transcript: [{ from: "operator", text: spec.instruction }],
    modelCalls: 0,
    tokensSpent: 0,
    toolRuns: [],
    alerts: [],
    evidenceIds: [],
    reply: null,
    pending: [],
    results: [],
    gate: null,
    verdict: null,
    exit: null,
  };
}
