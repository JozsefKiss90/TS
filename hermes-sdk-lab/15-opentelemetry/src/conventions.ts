/**
 * Attribute names (lesson 0023).
 *
 * The gen_ai.* names come from the OpenTelemetry GenAI semantic
 * conventions, read 2026-10-30 at github.com/open-telemetry/semantic-conventions-genai
 * (docs/gen-ai/client-inference.md, gen-ai-spans.md, gen-ai-agent-spans.md).
 * Every one of them, and every document that defines them, is marked
 * "Development": they may be renamed without a major version. So they are
 * written here as strings, in one file, rather than imported from the
 * `@opentelemetry/semantic-conventions/incubating` entry point. A rename is
 * one edit here, and the tests name the strings they expect.
 *
 * The hermes.* names are this course's own. No convention exists for
 * dollars, for a token count the provider never sent, for the Context
 * Pack, or for the gate's decision, so Hermes names them.
 */
export const GEN_AI = {
  operation: "gen_ai.operation.name",
  provider: "gen_ai.provider.name",
  requestModel: "gen_ai.request.model",
  inputTokens: "gen_ai.usage.input_tokens",
  outputTokens: "gen_ai.usage.output_tokens",
  toolName: "gen_ai.tool.name",
  toolCallId: "gen_ai.tool.call.id",
  workflowName: "gen_ai.workflow.name",
} as const;

export const HERMES = {
  title: "hermes.job.title",
  ceilingTokens: "hermes.ceiling_tokens",
  outcome: "hermes.outcome",
  agrees: "hermes.agrees",
  totalCalls: "hermes.totals.calls",
  totalTokens: "hermes.totals.tokens",
  totalMicroUsd: "hermes.totals.micro_usd",
  carriedCalls: "hermes.carried.calls",
  carriedTokens: "hermes.carried.tokens",
  call: "hermes.call",
  tokens: "hermes.tokens",
  tokensSource: "hermes.tokens.source",
  microUsd: "hermes.cost.micro_usd",
  requestId: "hermes.request_id",
  packIds: "hermes.pack.ids",
  packChars: "hermes.pack.chars",
  packTokens: "hermes.pack.tokens",
  decision: "hermes.gate.decision",
  heldMs: "hermes.held_ms",
  alert: "hermes.budget_alert",
  tokensAfter: "hermes.tokens_after",
  estimated: "hermes.estimated",
} as const;

/**
 * A Hermes job runs a workflow graph, so the job's span uses the
 * convention's `invoke_workflow` operation. The convention asks for a
 * static workflow name, not a per-job one, so the title goes in its own
 * attribute.
 */
export const WORKFLOW_NAME = "hermes_job";

/** The convention's provider value for Anthropic. The recordings ran against a mock that imitates it. */
export const PROVIDER = "anthropic";
