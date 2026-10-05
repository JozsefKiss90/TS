/**
 * Exercise 12 — thinking in state graphs (lesson 0017).
 *
 * Lesson: ../../../lessons/0017-thinking-in-state-graphs.html
 *
 * Three parts. Run them separately:
 *   pnpm job a   — the graph, parsed from disk: nodes, edges, guards
 *   pnpm job b   — six recorded runs replayed against it, zero model calls
 *   pnpm job c   — the graph's rules, each broken on purpose
 * `pnpm job` with no argument runs a.
 *
 * Nothing here needs the mock, a key, or a network. The recordings are
 * exercise 07's and exercise 11's trace files, read back through the
 * parse lesson 0011 built.
 */
import { readFileSync } from "node:fs";
import { jobLifecycleGuards } from "./guards.js";
import { loadGraph } from "./load-graph.js";
import { GROUNDED_RECORDING, RECORDINGS, readRecording, recordingName } from "./recordings.js";
import { walk } from "./walker.js";
import { admitWorkflowGraph } from "./workflow-graph.js";

const GRAPH_PATH = new URL("../graphs/job-lifecycle.json", import.meta.url);

function partA_theGraph(): void {
  console.log("\n=== A. The graph, parsed from disk ===");
  const graph = loadGraph(GRAPH_PATH);

  console.log(`name     : ${graph.name}`);
  console.log(`nodes    : ${graph.nodes.length}, start at "${graph.start}"`);
  console.log(`terminal : ${graph.terminal.join(", ")}`);
  console.log(`guards   : ${graph.guards.join(", ")}`);
  console.log(`edges    : ${graph.edges.length}`);

  console.log("\nedges by node:");
  for (const node of graph.nodes) {
    const out = graph.edges.filter((e) => e.from === node);
    if (out.length === 0) continue;
    const list = out.map((e) => (e.guard ? `${e.to} [${e.guard}]` : e.to)).join(", ");
    console.log(`  ${node.padEnd(18)} > ${list}`);
  }

  console.log(
    "\nSix fields, every one a name or a list of names. No claim, no event, " +
      "no timestamp, no token count can live in this file.",
  );
}

function partB_replayTheRecordings(): void {
  console.log("\n=== B. Six recorded runs, replayed (no model, no mock) ===");
  const graph = loadGraph(GRAPH_PATH);
  const taken = new Set<string>();

  for (const path of RECORDINGS) {
    const name = recordingName(path);
    const events = readRecording(path);
    const result = walk(graph, jobLifecycleGuards, events);
    if (!result.ok) {
      console.log(`  ${name.padEnd(30)} REFUSED at line ${result.line}: ${result.reason}`);
      continue;
    }
    for (const edge of result.edgesTaken) taken.add(edge);
    const status = result.complete ? "legal, complete" : "legal, cut short";
    console.log(`  ${name.padEnd(30)} ${status}, ${events.length} events`);
    console.log(`  ${"".padEnd(30)} ${result.path.join(" > ")}`);
  }

  console.log(`\n${taken.size} of ${graph.edges.length} edges taken by the recordings:`);
  console.log(`  ${[...taken].sort().join(", ")}`);
  const untaken = graph.edges
    .map((e) => `${e.from}>${e.to}`)
    .filter((edge) => !taken.has(edge));
  console.log(`\n${untaken.length} edges drawn from supervisor.ts that no recording took:`);
  console.log(`  ${untaken.join(", ")}`);
  console.log("\nmodel calls made by this part: 0");
}

function partC_theRulesBroken(): void {
  console.log("\n=== C. The graph's rules, each broken on purpose ===");
  const raw = JSON.parse(readFileSync(GRAPH_PATH, "utf8")) as Record<string, unknown>;
  const edges = raw["edges"] as Array<Record<string, string>>;

  const cases: Array<[string, unknown]> = [
    ["start not declared", { ...raw, start: "requested" }],
    [
      "edge to an unknown node",
      { ...raw, edges: [...edges, { from: "calling", to: "published" }] },
    ],
    [
      "edge with an unknown guard",
      { ...raw, edges: [...edges, { from: "calling", to: "replied", guard: "moon_is_full" }] },
    ],
    [
      "edge out of a terminal",
      { ...raw, edges: [...edges, { from: "landed", to: "calling" }] },
    ],
    ["a claim in the graph", { ...raw, claims: [{ id: "MOD-004", claim: "..." }] }],
    ["an event in the graph", { ...raw, events: [{ kind: "job_started" }] }],
  ];

  for (const [name, candidate] of cases) {
    const admission = admitWorkflowGraph(candidate);
    const verdict = admission.admitted ? "ADMITTED" : admission.rejections.join(" | ");
    console.log(`  ${name.padEnd(26)} > ${verdict}`);
  }

  console.log("\nAnd one legal graph with an illegal run:");
  const graph = loadGraph(GRAPH_PATH);
  const events = readRecording(GROUNDED_RECORDING);
  const [started, evidence, call, ...rest] = events;
  if (started && evidence && call) {
    const result = walk(graph, jobLifecycleGuards, [started, call, evidence, ...rest]);
    if (!result.ok) {
      console.log(`  evidence line moved after call 1 > REFUSED at line ${result.line}: ${result.reason}`);
    }
  }
}

const part = (process.argv[2] ?? "a").toLowerCase();
if (part === "a") partA_theGraph();
else if (part === "b") partB_replayTheRecordings();
else if (part === "c") partC_theRulesBroken();
else console.log(`unknown part "${part}" — try a, b or c`);
