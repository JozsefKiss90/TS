/**
 * The six guards the job lifecycle graph names, implemented (lesson 0017).
 *
 * The graph file says WHICH rule an edge needs. This file says WHAT each
 * rule checks. Every guard reads the event being left, because that event
 * is what decided the move in supervisor.ts: a reply's stop reason sends
 * the loop to the gate or to landing, a gate's decision sends a call to
 * the tool or to the operator, and the operator's verdict sends it on.
 *
 * Nothing here reads the spec, the ledger or the clock. A guard that needed
 * those would need state the walker does not hold, and lesson 0018's
 * interpreter is where that state goes.
 */
import type { GuardTable } from "./walker.js";

export const jobLifecycleGuards: GuardTable = {
  /** The model asked for a tool, so the next event is a gate decision. */
  reply_wants_tool: (leaving) => leaving.kind === "reply" && leaving.stop === "wants_tool",

  /** The model stopped on its own, so the job lands. */
  reply_finished: (leaving) => leaving.kind === "reply" && leaving.stop !== "wants_tool",

  /** The gate held the call for the operator. */
  gate_held: (leaving) => leaving.kind === "gate" && leaving.decision === "hold",

  /** The gate decided on its own: auto, or not permitted. Either way the tool step runs. */
  gate_decided: (leaving) => leaving.kind === "gate" && leaving.decision !== "hold",

  /** Someone answered: approved, denied, or nobody was wired. The call is answered. */
  verdict_answered: (leaving) => leaving.kind === "approval" && leaving.verdict !== "job_ended",

  /** The job ended while the call waited, so a bound decides the outcome. */
  verdict_job_ended: (leaving) => leaving.kind === "approval" && leaving.verdict === "job_ended",
};
