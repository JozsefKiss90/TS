/**
 * Turns a CostReport into lines for a terminal (lesson 0022).
 *
 * Kept apart from cost-report.ts so the function the tests check returns
 * numbers, and only this file decides how they look.
 */
import type { CostReport, Span } from "./cost-report.js";
import { PRICES_AS_OF } from "./prices.js";

/** Micro-dollars as dollars, six places: 2765 becomes $0.002765. */
export function dollars(microUsd: number): string {
  return `$${(microUsd / 1_000_000).toFixed(6)}`;
}

function spanLine(span: Span): string {
  if (span.kind === "tool") {
    const held = span.heldMs === null ? "" : `, ${span.heldMs} ms of it waiting for a verdict`;
    return `  tool  ${span.tool.padEnd(13)} ${String(span.ms).padStart(6)} ms  ${span.decision}${span.failed ? ", failed" : ""}${held}`;
  }
  const split =
    span.source === "reply"
      ? `${span.inputTokens} in + ${span.outputTokens} out`
      : "cut off: remainder of job_ended, estimated";
  const price = span.source === "reply" ? dollars(span.microUsd) : `${dollars(span.microUsd)} at most`;
  const pack =
    span.pack === null
      ? ""
      : `\n        pack ${span.pack.ids.join(", ")}: ~${span.pack.tokens} of the input (estimated from ${span.pack.chars} chars)`;
  return `  call ${String(span.call).padEnd(14)} ${String(span.ms).padStart(6)} ms  ${String(span.tokens).padStart(4)} tokens (${split})  ${price}${pack}`;
}

export function formatReport(report: CostReport): string[] {
  const lines = [`${report.title}  (priced as ${report.model}, prices as of ${PRICES_AS_OF})`];
  if (report.carried !== null) {
    lines.push(`  carried from the earlier run: ${report.carried.calls} calls, ${report.carried.tokens} tokens`);
  }
  lines.push(...report.spans.map(spanLine));
  lines.push(
    `  total: ${report.totals.calls} calls, ${report.totals.tokens} tokens, ${dollars(report.totals.microUsd)} this run` +
      (report.wallMs === null ? "" : `, ${report.wallMs} ms wall`),
  );
  lines.push(
    report.recorded === null
      ? "  job_ended: missing, the record was cut short"
      : `  job_ended: ${report.recorded.calls} calls, ${report.recorded.tokens} tokens, ${report.recorded.outcome}  ->  ${report.agrees ? "agrees" : "DISAGREES"}`,
  );
  lines.push(
    report.alert === null
      ? `  80% alert: not reached (${report.alertThreshold} of ${report.ceilingTokens})`
      : `  80% alert: at call ${report.alert.call}, ${report.alert.tokensAfter} tokens >= ${report.alertThreshold}` +
          (report.alert.estimated ? ", placed on an estimate" : "") +
          (report.alertNoted ? "  (job_ended noted it, without the call)" : "  (job_ended did NOT note it)"),
  );
  return lines;
}
