/**
 * The JOB LIFECYCLE, one handler per node (lesson 0018).
 *
 * Every line of work in lab 07's supervisor.ts is here, moved and not
 * rewritten: the same gateway call, the same bounds, the same gate, the
 * same wait, the same trace events with the same fields. One exception
 * is marked on `raceBounds` below. What is gone is the control flow. The
 * `for` loop, the `continue`s and the early `return`s decided what came
 * next. Now each handler ends by naming the node it wants, and the graph
 * decides whether the move is allowed.
 *
 * Seven handlers, for the seven nodes a run passes through. The six
 * terminal nodes have none: reaching one ends the run, and `startJob`
 * writes the job_ended event there, with the outcome being the node's
 * name. That is `nodeFor` from the walker, read backwards.
 *
 * Measured against the supervisor in tests/graph-run.test.ts: nine
 * scenarios return the same report and write the same events.
 */
import { type ApprovalPort, gateToolCall } from "../../07-tool-loop/src/approval.js";
import type { CallProgress, ModelGateway, ToolOutcome, ToolSpec } from "../../07-tool-loop/src/gateway.js";
import type { AdmittedPack, JobReport } from "../../07-tool-loop/src/supervisor.js";
import type { TaskSpec } from "../../07-tool-loop/src/task-spec.js";
import { offerTools, runTool } from "../../07-tool-loop/src/tools.js";
import type { TraceEvent, TracePort } from "../../07-tool-loop/src/trace.js";
import { jobLifecycleGuards } from "./guards.js";
import {
  runGraph,
  type Checkpoint,
  type CheckpointPort,
  type HandlerTable,
  type Position,
  type Refusal,
  type Step,
} from "./interpreter.js";
import { initialState, type JobState } from "./job-state.js";
import type { GuardTable } from "./walker.js";
import type { WorkflowGraph } from "./workflow-graph.js";

/**
 * The bounds, armed once per process. The deadline arms the controller
 * now, the budget check can fire it mid-call, and AbortSignal.any merges
 * it with the operator's own signal. None of this is state: a checkpoint
 * cannot hold a timer, so a resumed run arms a fresh one.
 */
interface Bounds {
  signal: AbortSignal;
  hit: () => "budget" | "deadline" | null;
  tripBudget: () => void;
  disarm: () => void;
}

function armBounds(spec: TaskSpec, operator?: AbortSignal): Bounds {
  let boundHit: "budget" | "deadline" | null = null;
  const bounds = new AbortController();
  const deadline = setTimeout(() => {
    boundHit = "deadline";
    bounds.abort();
  }, spec.deadlineMs);
  return {
    signal: operator ? AbortSignal.any([operator, bounds.signal]) : bounds.signal,
    hit: () => boundHit,
    tripBudget: () => {
      if (boundHit === null) {
        boundHit = "budget";
        bounds.abort();
      }
    },
    disarm: () => clearTimeout(deadline),
  };
}

/** Everything a handler may touch that is not state: the ports, the spec, the bounds. */
export interface JobContext {
  spec: TaskSpec;
  gateway: ModelGateway;
  tools: ToolSpec[];
  bounds: Bounds;
  record: (event: TraceEvent) => void;
  approver?: ApprovalPort;
  pack?: AdmittedPack;
}

const estimateTokens = (chars: number): number => Math.ceil(chars / 3);

/**
 * Wait for the operator, unless the job ends first. One change from lab
 * 07: the supervisor's version has no rejection arm, so an approver that
 * throws leaves the wait hanging. Here it rejects, which is how part f
 * kills a run during the wait. The one line of this file that is not a
 * move, and the lesson's footer says so.
 */
function raceBounds(
  decision: Promise<"approved" | "denied">,
  signal: AbortSignal,
): Promise<"approved" | "denied" | "job_ended"> {
  if (signal.aborted) return Promise.resolve("job_ended");
  return new Promise((resolve, reject) => {
    const onAbort = (): void => resolve("job_ended");
    signal.addEventListener("abort", onAbort, { once: true });
    decision.then(
      (verdict) => {
        signal.removeEventListener("abort", onAbort);
        resolve(verdict);
      },
      (error: unknown) => {
        signal.removeEventListener("abort", onAbort);
        reject(error instanceof Error ? error : new Error(String(error)));
      },
    );
  });
}

/** Why a pack may not be used for this job, or null when it may. Unchanged from lab 07. */
function packFault(spec: TaskSpec, pack: AdmittedPack | undefined): string | null {
  const asked = spec.evidenceQueries;
  if (pack === undefined) {
    if (asked.length === 0) return null;
    return `spec asks for evidence on ${asked.join(", ")} and no admitted pack arrived`;
  }
  const answered = pack.queries;
  const same = asked.length === answered.length && asked.every((q, i) => q === answered[i]);
  if (same) return null;
  return (
    `the pack answers [${answered.join(", ")}] and the spec asks for ` +
    `[${asked.join(", ") || "nothing"}]`
  );
}

/** The move a handler makes: a node name, the state after its work, the event it recorded. */
const move = (to: string, state: JobState, event: TraceEvent): Step<JobState> => ({ to, state, event });

/** Heading for a terminal node, with the notes job_ended will carry. */
function exit(
  state: JobState,
  to: JobReport["outcome"],
  notes: string[],
  event: TraceEvent,
  partialText?: string,
): Step<JobState> {
  const exitNote = partialText !== undefined ? { notes, partialText } : { notes };
  return move(to, { ...state, exit: exitNote }, event);
}

/**
 * The check the supervisor ran at the top of its loop, before every call:
 * the call cap first, then the ceiling. Three nodes lead into `calling`,
 * so three handlers ask this one question. The graph draws the answer as
 * three edges out of each of them.
 */
function nextCall(state: JobState, spec: TaskSpec, event: TraceEvent): Step<JobState> {
  const call = state.modelCalls + 1;
  if (call > spec.maxModelCalls) {
    return exit(state, "gave_up", [
      `the model still wanted a tool after ${spec.maxModelCalls} model calls`,
    ], event);
  }
  if (state.tokensSpent >= spec.costCeilingTokens) {
    return exit(state, "over_budget", [
      `spent ${state.tokensSpent} of ${spec.costCeilingTokens} tokens before call ${call}`,
    ], event);
  }
  return move("calling", state, event);
}

export const jobLifecycleHandlers: HandlerTable<JobState, JobContext> = {
  /** The run begins. The pack is authorized here, and used in `grounded`. */
  started: (state, ctx) => {
    const { spec } = ctx;
    const event: TraceEvent = {
      kind: "job_started",
      at: Date.now(),
      title: spec.title,
      owner: spec.owner,
      instruction: spec.instruction,
      costCeilingTokens: spec.costCeilingTokens,
    };
    ctx.record(event);

    // S2's gate, on the loop's side: no pack, no dispatch. Zero model calls.
    const fault = packFault(spec, ctx.pack);
    if (fault !== null) return Promise.resolve(exit(state, "no_evidence", [fault], event));
    if (ctx.pack !== undefined) return Promise.resolve(move("grounded", state, event));
    return Promise.resolve(nextCall(state, spec, event));
  },

  /** The pack goes in front of the operator's words, in the first turn. */
  grounded: (state, ctx) => {
    const pack = ctx.pack;
    if (pack === undefined) throw new Error("grounded entered with no pack");
    const event: TraceEvent = {
      kind: "evidence_used",
      at: Date.now(),
      queries: pack.queries,
      snapshot: pack.snapshot,
      assembledAt: pack.assembledAt,
      ids: pack.ids,
      chars: pack.text.length,
    };
    ctx.record(event);

    const transcript = [...state.transcript];
    const opening = transcript[0];
    if (opening !== undefined && opening.from === "operator") {
      transcript[0] = { from: "operator", text: `${pack.text}\n\n${opening.text}` };
    }
    return Promise.resolve(nextCall({ ...state, transcript, evidenceIds: pack.ids }, ctx.spec, event));
  },

  /** One model call, watched while it runs. Every failure is classified here. */
  calling: async (state, ctx) => {
    const { spec, bounds } = ctx;
    const call = state.modelCalls + 1;
    const alerts = [...state.alerts];

    // DURING: the estimate is booked spend, plus this call's input (true,
    // from the start of the reply), plus estimated output so far.
    let callInputTokens = 0;
    let callChars = 0;
    const onProgress = (progress: CallProgress): void => {
      if (progress.kind === "call_started") callInputTokens = progress.inputTokens;
      else callChars += progress.chars;

      const estimate = state.tokensSpent + callInputTokens + estimateTokens(callChars);
      if (alerts.length === 0 && estimate >= 0.8 * spec.costCeilingTokens) {
        alerts.push(`budget alert: estimated spend passed 80% of ${spec.costCeilingTokens}`);
      }
      if (estimate >= spec.costCeilingTokens) bounds.tripBudget();
    };

    const event: TraceEvent = { kind: "call_started", at: Date.now(), call };
    ctx.record(event);

    const result = await ctx.gateway.complete(
      { transcript: state.transcript, maxTokens: spec.maxTokens, tools: ctx.tools },
      { signal: bounds.signal, onProgress },
    );
    const after = { ...state, modelCalls: call, alerts };

    if (result.ok) return move("replied", { ...after, reply: result.reply }, event);

    const failure = result.failure;
    switch (failure.kind) {
      case "throttled":
        return exit(after, "retry_later", [
          `provider asked for ${failure.retryAfterMs ?? "an unspecified"} ms of backoff`,
        ], event);
      case "aborted": {
        // The abort itself does not say why. The bounds know.
        const spent = after.tokensSpent + callInputTokens + estimateTokens(callChars);
        const booked = { ...after, tokensSpent: spent };
        const partial =
          failure.partialText.length > 0
            ? [`partial artifact kept (${failure.partialText.length} chars): ${failure.partialText}`]
            : [];
        const hit = bounds.hit();
        if (hit === "budget") {
          return exit(booked, "over_budget", [
            `ceiling ${spec.costCeilingTokens} reached mid-generation; spend is estimated — the true count never arrived`,
            ...partial,
          ], event, failure.partialText);
        }
        if (hit === "deadline") {
          return exit(booked, "out_of_time", [`deadline of ${spec.deadlineMs} ms passed`, ...partial], event, failure.partialText);
        }
        return exit(booked, "gave_up", ["aborted by the operator", ...partial], event, failure.partialText);
      }
      case "malformed_reply":
        return exit(after, "gave_up", ["reply refused at the boundary", ...failure.issues], event);
      case "transport":
        return exit(after, "gave_up", [`transport failure: ${failure.detail}`], event);
      case "rejected":
        return exit(after, "gave_up", [`request rejected (${failure.status}): ${failure.detail}`], event);
    }
  },

  /** The reply is booked: ledger, trace, transcript. Its stop reason picks the next node. */
  replied: (state, ctx) => {
    const reply = state.reply;
    if (reply === null) throw new Error("replied entered with no reply to book");

    // AFTER: the reply finished, so the true counts exist.
    const tokensSpent = state.tokensSpent + reply.usage.inputTokens + reply.usage.outputTokens;
    const event: TraceEvent = {
      kind: "reply",
      at: Date.now(),
      call: state.modelCalls,
      stop: reply.stop,
      text: reply.text,
      calls: reply.calls,
      inputTokens: reply.usage.inputTokens,
      outputTokens: reply.usage.outputTokens,
      requestId: reply.requestId,
    };
    ctx.record(event);

    // The model's turn goes into the transcript BEFORE the tools run.
    const booked: JobState = {
      ...state,
      tokensSpent,
      reply: null,
      transcript: [...state.transcript, { from: "model", text: reply.text, calls: reply.calls }],
    };

    if (reply.stop !== "wants_tool") {
      return Promise.resolve(exit(booked, "landed", [
        `stop: ${reply.stop}`,
        `request: ${reply.requestId ?? "(none)"}`,
        `answer: ${reply.text}`,
      ], event));
    }
    if (reply.calls.length === 0) {
      return Promise.resolve(exit(booked, "gave_up", ["the reply asked for a tool and named none"], event));
    }
    return Promise.resolve(move("gating", { ...booked, pending: reply.calls, results: [] }, event));
  },

  /** The gate decides on the first unanswered call. Only "hold" waits. */
  gating: (state, ctx) => {
    const call = state.pending[0];
    if (call === undefined) throw new Error("gating entered with nothing pending");
    const gate = gateToolCall(call.name, ctx.spec);
    const event: TraceEvent = {
      kind: "gate",
      at: Date.now(),
      call: state.modelCalls,
      tool: call.name,
      decision: gate,
    };
    ctx.record(event);
    const decided = { ...state, gate };
    return Promise.resolve(move(gate === "hold" ? "awaiting_approval" : "tool_ran", decided, event));
  },

  /** A held call waits for the operator, and the wait races the bounds. */
  awaiting_approval: async (state, ctx) => {
    const call = state.pending[0];
    if (call === undefined) throw new Error("awaiting_approval entered with nothing pending");
    const { spec, bounds } = ctx;

    if (ctx.approver === undefined) {
      // Default deny: no approval channel means no approval.
      const event: TraceEvent = { kind: "approval", at: Date.now(), tool: call.name, verdict: "no_channel" };
      ctx.record(event);
      return move("tool_ran", { ...state, verdict: "no_channel" }, event);
    }

    const verdict = await raceBounds(ctx.approver.decide(call), bounds.signal);
    const event: TraceEvent = { kind: "approval", at: Date.now(), tool: call.name, verdict };
    ctx.record(event);

    if (verdict === "job_ended") {
      const held = { ...state, toolRuns: [...state.toolRuns, `${call.name} → held when the job ended`] };
      const hit = bounds.hit();
      if (hit === "deadline") {
        return exit(held, "out_of_time", [
          `deadline of ${spec.deadlineMs} ms passed while "${call.name}" waited for approval`,
        ], event);
      }
      if (hit === "budget") {
        return exit(held, "over_budget", [
          `ceiling ${spec.costCeilingTokens} reached while "${call.name}" waited for approval`,
        ], event);
      }
      return exit(held, "gave_up", ["aborted by the operator"], event);
    }
    return move("tool_ran", { ...state, verdict }, event);
  },

  /** The call is answered: run, refused, or declined. The answer joins the turn. */
  tool_ran: (state, ctx) => {
    const call = state.pending[0];
    if (call === undefined) throw new Error("tool_ran entered with nothing pending");

    let outcome: ToolOutcome;
    let ran: string;
    if (state.verdict === "no_channel") {
      outcome = { id: call.id, output: `Tool "${call.name}" needs approval and no approval channel exists.`, failed: true };
      ran = `${call.name} → denied by default`;
    } else if (state.verdict === "denied") {
      outcome = { id: call.id, output: `The operator declined "${call.name}" for this job.`, failed: true };
      ran = `${call.name} → denied by the operator`;
    } else if (state.verdict === "approved") {
      outcome = runTool(call, ctx.spec.allowedTools);
      ran = `${call.name} → ${outcome.failed ? "refused" : "ran (approved)"}`;
    } else {
      // "auto" and "not_permitted" both reach runTool, whose own check
      // produces the refusal. Unchanged since lesson 0008.
      outcome = runTool(call, ctx.spec.allowedTools);
      ran = `${call.name} → ${outcome.failed ? "refused" : "ran"}`;
    }

    const event: TraceEvent = {
      kind: "tool_result",
      at: Date.now(),
      id: outcome.id,
      tool: call.name,
      failed: outcome.failed,
      output: outcome.output,
    };
    ctx.record(event);

    const answered: JobState = {
      ...state,
      toolRuns: [...state.toolRuns, ran],
      results: [...state.results, outcome],
      pending: state.pending.slice(1),
      gate: null,
      verdict: null,
    };
    if (answered.pending.length > 0) return Promise.resolve(move("gating", answered, event));

    // One turn carries every result, in the order the model asked.
    const turned: JobState = {
      ...answered,
      transcript: [...answered.transcript, { from: "tools", results: answered.results }],
      results: [],
    };
    return Promise.resolve(nextCall(turned, ctx.spec, event));
  },
};

const OUTCOMES: ReadonlySet<string> = new Set<JobReport["outcome"]>([
  "landed",
  "retry_later",
  "gave_up",
  "over_budget",
  "out_of_time",
  "no_evidence",
]);

function asOutcome(node: string): JobReport["outcome"] {
  if (!OUTCOMES.has(node)) throw new Error(`terminal node "${node}" is not a job outcome`);
  return node as JobReport["outcome"];
}

export interface JobOptions {
  signal?: AbortSignal;
  approver?: ApprovalPort;
  trace?: TracePort;
  pack?: AdmittedPack;
  checkpoints?: CheckpointPort<JobState>;
  /** The guard implementations. Defaults to the six the job lifecycle names. */
  guards?: GuardTable;
}

export type JobResult = { ok: true; report: JobReport } | Refusal;

/** A fresh run: the start node, a fresh state, step zero. */
export function startJob(
  graph: WorkflowGraph,
  spec: TaskSpec,
  gateway: ModelGateway,
  options?: JobOptions,
): Promise<JobResult> {
  return drive(graph, { node: graph.start, step: 0, state: initialState(spec) }, spec, gateway, options);
}

/** A resumed run: the checkpoint's node and state, and the same trace, continued. */
export function resumeJob(
  graph: WorkflowGraph,
  checkpoint: Checkpoint<JobState>,
  spec: TaskSpec,
  gateway: ModelGateway,
  options?: JobOptions,
): Promise<JobResult> {
  return drive(graph, checkpoint, spec, gateway, options);
}

async function drive(
  graph: WorkflowGraph,
  from: Position<JobState>,
  spec: TaskSpec,
  gateway: ModelGateway,
  options?: JobOptions,
): Promise<JobResult> {
  const bounds = armBounds(spec, options?.signal);
  const ctx: JobContext = {
    spec,
    gateway,
    tools: offerTools(spec.allowedTools),
    bounds,
    record: (event) => options?.trace?.append(event),
    ...(options?.approver ? { approver: options.approver } : {}),
    ...(options?.pack ? { pack: options.pack } : {}),
  };

  try {
    const outcome = await runGraph(graph, options?.guards ?? jobLifecycleGuards, jobLifecycleHandlers, from, ctx, {
      job: spec.title,
      ...(options?.checkpoints ? { checkpoints: options.checkpoints } : {}),
    });
    if (!outcome.ok) return outcome;

    // The terminal node's name is the outcome. Every classified exit writes
    // exactly one job_ended, and a crash writes none. A graph whose
    // terminal names are not outcomes is a wiring fault, found here.
    const { state } = outcome;
    const outcomeName = asOutcome(outcome.node);
    const notes = [...state.alerts, ...(state.exit?.notes ?? [])];
    const partialText = state.exit?.partialText;
    ctx.record({
      kind: "job_ended",
      at: Date.now(),
      outcome: outcomeName,
      modelCalls: state.modelCalls,
      tokensSpent: state.tokensSpent,
      notes,
      ...(partialText !== undefined && partialText.length > 0 ? { partialText } : {}),
    });
    return {
      ok: true,
      report: {
        task: spec.title,
        outcome: outcomeName,
        modelCalls: state.modelCalls,
        toolRuns: state.toolRuns,
        tokensSpent: state.tokensSpent,
        evidenceIds: state.evidenceIds,
        notes,
      },
    };
  } finally {
    bounds.disarm();
  }
}
