/**
 * The TOOL CATALOGUE — what Hermes can actually run.
 *
 * Domain code: it imports zod and the port's types, and nothing else. No
 * provider appears here, and no wire vocabulary appears in its code.
 *
 * Each entry declares its input ONCE, as a zod schema, and three readers
 * are derived from it:
 *
 *   - the MODEL reads JSON Schema, produced by z.toJSONSchema()
 *   - HERMES checks the arguments that come back, with safeParse
 *   - TYPESCRIPT types the tool's own body, through z.infer
 *
 * That is lesson 0005's single source of truth, aimed at a third boundary.
 * The arguments in a tool call are model output, so they are untrusted in
 * the way a reply body and a spec file are untrusted.
 *
 * Both tools answer from canned data. No dev_graph exists yet — Phase 2
 * builds the real evidence surface, over MCP.
 */
import { z } from "zod";
import type { ToolCall, ToolOutcome, ToolSpec } from "./gateway.js";
import { formatIssues } from "./issues.js";

/** What a tool answers: its output, or the reasons its arguments failed. */
type ToolAnswer = { ok: true; output: string } | { ok: false; issues: string[] };

interface ToolImplementation {
  description: string;
  inputSchema: z.ZodObject;
  /** Parses with this tool's own schema, then runs. Never trusts its input. */
  answer(input: unknown): ToolAnswer;
}

/**
 * Build one catalogue entry. The parse lives inside, which is what lets
 * `body` take a typed value: `parsed.data` is `z.infer<S>`, so the tool's
 * own code needs no assertion and no string coercion.
 */
function defineTool<S extends z.ZodObject>(
  description: string,
  inputSchema: S,
  body: (input: z.infer<S>) => string,
): ToolImplementation {
  return {
    description,
    inputSchema,
    answer: (input) => {
      const parsed = inputSchema.safeParse(input);
      if (!parsed.success) return { ok: false, issues: formatIssues(parsed.error) };
      return { ok: true, output: body(parsed.data) };
    },
  };
}

const CATALOGUE: Record<string, ToolImplementation> = {
  graph_health: defineTool(
    "Report health counters for one graph: nodes, orphans and stale edges.",
    z.object({
      graph: z.string().min(1).describe("The graph to inspect, for example 'atlas'."),
    }),
    (input) => `graph=${input.graph} nodes=1284 orphans=3 stale_edges=2`,
  ),

  // Present in the catalogue, absent from the audit job's allowedTools. The
  // operator ran the audit with --no-writeback, so this tool is never
  // offered and the model never learns that it exists.
  graph_writeback: defineTool(
    "Write corrections back into a graph. Mutates the knowledge graph.",
    z.object({
      graph: z.string().min(1),
      patch: z.string().min(1),
    }),
    (input) => `wrote patch to ${input.graph}`,
  ),
};

/**
 * The tool list this job may see. `allowedTools` from the TaskSpec finally
 * has a reader: a name the spec does not list is never declared, so the
 * model cannot ask for it.
 *
 * A permitted name that no implementation backs is simply not offered.
 * Promising a tool Hermes cannot run would be worse than offering less,
 * and `main.ts` prints both lists so the gap is visible.
 */
export function offerTools(allowedTools: string[]): ToolSpec[] {
  const offered: ToolSpec[] = [];
  for (const name of allowedTools) {
    const tool = CATALOGUE[name];
    if (tool === undefined) continue;

    const schema = z.toJSONSchema(tool.inputSchema);
    offered.push({
      name,
      description: tool.description,
      // z.toJSONSchema also emits $schema and additionalProperties. The
      // port's ToolSpec keeps the three fields the model needs.
      inputSchema: {
        type: "object",
        properties: (schema["properties"] ?? {}) as Record<string, unknown>,
        required: (schema["required"] ?? []) as string[],
      },
    });
  }
  return offered;
}

/**
 * Run one tool the model asked for, and answer as data.
 *
 * Two checks run before any implementation does. The name must be
 * permitted for THIS job, and the arguments must parse. Offering a short
 * tool list is not enforcing one: the reply that comes back is model
 * output, so it can name a tool that was never declared. Lesson 0010 adds
 * the operator's approval gate on top of both checks.
 *
 * A refusal is still an answer. It returns as a failed ToolOutcome, which
 * the adapter sends with is_error set, and the model can try something else.
 */
export function runTool(call: ToolCall, allowedTools: string[]): ToolOutcome {
  const refuse = (output: string): ToolOutcome => ({ id: call.id, output, failed: true });

  if (!allowedTools.includes(call.name)) {
    return refuse(`Tool "${call.name}" is not permitted by this job's allowedTools.`);
  }

  const tool = CATALOGUE[call.name];
  if (tool === undefined) {
    return refuse(`Tool "${call.name}" does not exist.`);
  }

  const answer = tool.answer(call.input);
  if (!answer.ok) {
    return refuse(`Arguments rejected — ${answer.issues.join("; ")}`);
  }

  return { id: call.id, output: answer.output, failed: false };
}
