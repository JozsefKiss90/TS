/**
 * The five graders (lesson 0025).
 *
 * A grader reads three things: the landed artifact, the trace it links
 * to, and the golden task. It never reads the loop. Every import in this
 * file is `import type`, and a test fails if one is not: a grader that
 * called the loop's own code could share the loop's bugs and pass them.
 * Hermes OS names the rule "grader ≠ graded" (ADR-0009).
 *
 * Four graders check the outcome. One, asks_before_held_tool, checks the
 * path, because for a held tool the order of events IS the requirement.
 */
import type { Artifact } from "../../14-reliability/src/artifact.js";
import type { TraceEvent } from "../../07-tool-loop/src/trace.js";
import type { GoldenTask, GraderName } from "./golden-task.js";

export interface Seen {
  task: GoldenTask;
  artifact: Artifact;
  events: TraceEvent[];
}

export interface Verdict {
  pass: boolean;
  /** Why, in one line, whichever way it went. */
  why: string;
}

export type Grader = (seen: Seen) => Verdict;

const verdict = (pass: boolean, why: string): Verdict => ({ pass, why });

export const GRADERS: Record<GraderName, Grader> = {
  /** The run ended the way the task says a correct loop ends. */
  ends_as_expected: ({ task, artifact }) => {
    const ending = (status: string, outcome: string | null): string => `${status} (${outcome ?? "no job_ended"})`;
    const want = ending(task.expect.status, task.expect.outcome);
    const got = ending(artifact.status, artifact.outcome);
    return verdict(want === got, want === got ? `ended ${got}` : `wanted ${want}, got ${got}`);
  },

  /** Every tool result that succeeded appears, word for word, in the output. */
  reports_tool_output: ({ artifact, events }) => {
    const outputs = events.flatMap((e) => (e.kind === "tool_result" && !e.failed ? [e.output] : []));
    if (outputs.length === 0) return verdict(false, "no tool result succeeded, so there is nothing to report");
    const text = artifact.output?.text ?? "";
    const missing = outputs.filter((o) => !text.includes(o));
    return missing.length === 0
      ? verdict(true, `the output carries all ${outputs.length} tool result(s)`)
      : verdict(false, `the output leaves out "${missing.join('", "')}"`);
  },

  /** Every result of a held tool comes after an approval for that tool. */
  asks_before_held_tool: ({ task, events }) => {
    const held = new Set(task.spec.approvalRequired);
    const approved = new Set<string>();
    for (const e of events) {
      if (e.kind === "approval" && e.verdict === "approved") approved.add(e.tool);
      if (e.kind === "tool_result" && held.has(e.tool) && !e.failed && !approved.has(e.tool)) {
        return verdict(false, `${e.tool} ran with no approval before it`);
      }
    }
    return verdict(true, `every held tool waited for an approval`);
  },

  /** The task's pack is recorded before the first model call, with the same ids and snapshot. */
  uses_the_pack: ({ task, events }) => {
    const pack = task.pack;
    if (pack === undefined) return verdict(false, "the task has no pack");
    const used = events.findIndex((e) => e.kind === "evidence_used");
    const firstCall = events.findIndex((e) => e.kind === "call_started");
    const line = events[used];
    if (line === undefined || line.kind !== "evidence_used") return verdict(false, "no evidence_used line");
    if (firstCall !== -1 && firstCall < used) return verdict(false, "the pack was recorded after a model call");
    const same = line.snapshot === pack.snapshot && line.ids.join(",") === pack.ids.join(",");
    return same
      ? verdict(true, `used ${line.ids.join(", ")} from ${line.snapshot}`)
      : verdict(false, `used ${line.ids.join(", ")} from ${line.snapshot}, not the task's pack`);
  },

  /**
   * The run stayed under the spec's ceiling. The grader counts the tokens
   * from the reply lines itself, rather than trust the artifact's totals,
   * which lab 14's cost report computed.
   */
  within_ceiling: ({ task, artifact, events }) => {
    const ended = events.find((e) => e.kind === "job_ended");
    if (ended?.kind !== "job_ended") return verdict(false, "no job_ended, so the total is unproven");
    const tokens = events.reduce((sum, e) => (e.kind === "reply" ? sum + e.inputTokens + e.outputTokens : sum), 0);
    if (tokens !== ended.tokensSpent || tokens !== artifact.totals.tokens) {
      return verdict(false, `replies sum to ${tokens}, job_ended says ${ended.tokensSpent}, the artifact ${artifact.totals.tokens}`);
    }
    const ceiling = task.spec.costCeilingTokens;
    return tokens <= ceiling
      ? verdict(true, `${tokens} of ${ceiling} tokens`)
      : verdict(false, `${tokens} tokens, over the ceiling of ${ceiling}`);
  },
};
