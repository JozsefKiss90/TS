/**
 * The APPROVAL GATE — permission policy as data (lesson 0010).
 *
 * Domain code: it imports the port's ToolCall type and the spec's type, and
 * nothing else. No provider, no SDK, no wire vocabulary.
 *
 * Two things live here, and they are deliberately separate:
 *
 *   gateToolCall  — a pure function. Spec in, decision out. Reading it IS
 *                   reading the permission policy, which is the point:
 *                   "permissions as data, not vibes."
 *   ApprovalPort  — the operator's side of a held call. A port like
 *                   ModelGateway: the supervisor calls it, the wiring in
 *                   main.ts decides who answers (a terminal, a script, or
 *                   nobody at all).
 *
 * Note what is NOT here: nothing about the wire. The API has no approval
 * field. The model only ever sees outcomes — a tool_result, or a refusal
 * with is_error set. The gate is invisible from the provider's side.
 */
import type { ToolCall } from "./gateway.js";
import type { TaskSpec } from "./task-spec.js";

/**
 * The gate's three answers, one per permission level:
 *
 *   "not_permitted" — the spec never listed the name. The call is refused
 *                     (runTool's check, measured in lesson 0008 Part B).
 *   "auto"          — permitted, and no approval required. The call runs.
 *   "hold"          — permitted, but the operator must decide first.
 */
export type GateDecision = "not_permitted" | "auto" | "hold";

export function gateToolCall(name: string, spec: TaskSpec): GateDecision {
  if (!spec.allowedTools.includes(name)) return "not_permitted";
  if (spec.approvalRequired.includes(name)) return "hold";
  return "auto";
}

/**
 * The operator's decision over a held call, as data. The promise resolves
 * when a human (or a script standing in for one) decides — which can take
 * seconds, or forever. The supervisor races this promise against the job's
 * bounds, because an operator who never answers must not hang a job.
 */
export interface ApprovalPort {
  decide(call: ToolCall): Promise<"approved" | "denied">;
}
