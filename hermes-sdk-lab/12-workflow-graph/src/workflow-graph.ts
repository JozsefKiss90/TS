/**
 * The WORKFLOW GRAPH — what a job may do, held as data (lesson 0017).
 *
 * Scenario step S3. Lab 11's supervisor already has thirteen moments a run
 * can be in and six ways it can end, but the rules that join them are `if`
 * statements spread over three hundred lines. This file writes those rules
 * down as a value: a list of node names, a list of edges between them, and
 * a list of guard NAMES an edge may carry.
 *
 * Three decisions shape the schema:
 *
 *   strictObject — a graph may hold names and nothing else. An unknown key
 *                  such as `claims` or `events` is refused, which is the
 *                  course's three-records rule as a parse: the knowledge
 *                  graph holds claims, the trace holds events, this holds
 *                  neither.
 *   names only   — a guard is a NAME here and a FUNCTION in guards.ts. The
 *                  graph says which rule an edge needs; the code says what
 *                  the rule checks. Same split as a signature and its
 *                  implementation (lesson 0003).
 *   four rules   — cross-field refinements, because no single field is
 *                  wrong on its own: the start node exists, every edge
 *                  joins declared nodes, every guard is declared, and no
 *                  edge leaves a terminal node.
 *
 * `admitWorkflowGraph` returns the same discriminated union as
 * `admitTaskSpec` (lesson 0007) and `admitContextPack` (lesson 0016):
 * proof on one arm, reasons on the other, nothing thrown.
 *
 * Verified against zod 4.4.3 (pinned exact — see README).
 */
import { z } from "zod";
import { formatIssues } from "../../07-tool-loop/src/issues.js";

/** A node or guard name: one lowercase identifier, as it appears in a trace. */
const Name = z.string().regex(/^[a-z][a-z0-9_]*$/, "a name is a lowercase identifier");

const EdgeSchema = z.strictObject({
  from: Name,
  to: Name,
  /** The rule this edge needs, by name. Absent means the edge is always open. */
  guard: Name.optional(),
});

const Shape = z.strictObject({
  name: z.string().min(1),
  /** Every state a run can be in. Order is presentation only. */
  nodes: z.array(Name).min(1),
  /** Where every run begins. */
  start: Name,
  /** Where a run may end. A terminal node has no outgoing edge. */
  terminal: z.array(Name).min(1),
  /** The guard names edges may cite. Each one is implemented in code. */
  guards: z.array(Name),
  edges: z.array(EdgeSchema).min(1),
});

/**
 * The strict shape is exported on its own so a test can read its keys:
 * six fields, every one a name or a list of names. The schema below adds
 * the cross-field rules.
 */
export const WorkflowGraphSchema = Shape;

type Shape = z.infer<typeof Shape>;
type EdgeOf = Shape["edges"][number];

/**
 * One rule over edges, as a refinement plus a message that names the first
 * edge breaking it. The three edge rules differ only in predicate and wording.
 */
function edgeRule(bad: (g: Shape, e: EdgeOf) => boolean, describe: (e: EdgeOf, g: Shape) => string) {
  return {
    check: (g: Shape) => !g.edges.some((e) => bad(g, e)),
    error: (issue: { input: unknown }) => {
      const g = issue.input as Shape;
      const stray = g.edges.find((e) => bad(g, e));
      return stray === undefined
        ? "an edge breaks a rule"
        : `edge ${stray.from} > ${stray.to} ${describe(stray, g)}`;
    },
    path: ["edges"],
  };
}

const joinsDeclaredNodes = edgeRule(
  (g, e) => !g.nodes.includes(e.from) || !g.nodes.includes(e.to),
  (e, g) => `names a node the graph does not declare: ${g.nodes.includes(e.from) ? e.to : e.from}`,
);
const citesDeclaredGuard = edgeRule(
  (g, e) => e.guard !== undefined && !g.guards.includes(e.guard),
  (e) => `cites a guard the graph does not declare: ${e.guard}`,
);
const leavesNoTerminal = edgeRule(
  (g, e) => g.terminal.includes(e.from),
  () => "leaves a terminal node",
);

export const AdmittedWorkflowGraphSchema = Shape.refine((g) => g.nodes.includes(g.start), {
  error: "the start node must be one of the declared nodes",
  path: ["start"],
})
  .refine(joinsDeclaredNodes.check, joinsDeclaredNodes)
  .refine(citesDeclaredGuard.check, citesDeclaredGuard)
  .refine(leavesNoTerminal.check, leavesNoTerminal);

export type WorkflowGraph = z.infer<typeof AdmittedWorkflowGraphSchema>;
export type Edge = z.infer<typeof EdgeSchema>;

export type GraphAdmission =
  | { admitted: true; graph: WorkflowGraph }
  | { admitted: false; rejections: string[] };

/** The boundary. A graph file is bytes on disk, and bytes are parsed, never cast. */
export function admitWorkflowGraph(raw: unknown): GraphAdmission {
  const parsed = AdmittedWorkflowGraphSchema.safeParse(raw);
  if (!parsed.success) return { admitted: false, rejections: formatIssues(parsed.error) };
  return { admitted: true, graph: parsed.data };
}
