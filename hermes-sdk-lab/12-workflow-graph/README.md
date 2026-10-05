# Exercise 12 — thinking in state graphs

Lesson: [0017 — Thinking in State Graphs](../../lessons/0017-thinking-in-state-graphs.html)

Scenario step **S3 (dispatch under the graph)**, opening Phase 3. Lab 11's supervisor has
thirteen moments a run can be in and six ways it can end, and the rules that join them are `if`
statements. This exercise writes those rules down as data: a graph file of node names, edges and
guard names, admitted by a parse. A walker then replays the recorded traces of exercises 07 and
11 against it and shows that every recorded run is a path the graph allows. No model, no mock, no
network.

Nothing is copied. This package imports the trace vocabulary, the supervisor and the fake
gateway from `../07-tool-loop/src`, so the walker reads the same `TraceEvent` the supervisor
writes.

## What lives here

| File | What it is |
|---|---|
| `graphs/job-lifecycle.json` | the graph: 13 nodes, 26 edges, 6 guard names, drawn from `supervisor.ts` |
| `src/workflow-graph.ts` | `WorkflowGraphSchema` (strict, six fields), four cross-field rules, `admitWorkflowGraph` |
| `src/walker.ts` | `nodeFor`, the one place events meet node names, and `walk`, which replays a trace |
| `src/guards.ts` | the six guards, implemented: each reads the event being left |
| `src/load-graph.ts` | wiring: read the file, admit it, or throw with every reason |
| `src/recordings.ts` | the six recordings of labs 07 and 11, and the parse that reads one back |
| `src/main.ts` | three runnable parts |
| `tests/` | 32 tests: the graph's rules, the walker, the recorded runs |

The supervisor is not changed by this lesson. The graph describes it; nothing yet reads the
graph to drive it. Lesson 0018 does that.

## Commands

```bash
pnpm install                 # once, from hermes-sdk-lab/
pnpm --filter 12-workflow-graph job a    # the graph, parsed from disk
pnpm --filter 12-workflow-graph job b    # six recorded runs replayed
pnpm --filter 12-workflow-graph job c    # the rules, each broken
pnpm --filter 12-workflow-graph test
```

## Measured, 2026-10-06

Versions: `zod` 4.4.3, `vitest` 3.2.7, Node 22.14.0.

**Part a.** 13 nodes, start at `started`, six terminal nodes, six guards, 26 edges.

```
started            > grounded, calling, no_evidence, over_budget, gave_up
grounded           > calling, over_budget, gave_up
calling            > replied, retry_later, gave_up, over_budget, out_of_time
replied            > landed [reply_finished], gating [reply_wants_tool], gave_up [reply_wants_tool]
gating             > tool_ran [gate_decided], awaiting_approval [gate_held]
awaiting_approval  > tool_ran [verdict_answered], gave_up [verdict_job_ended], over_budget [verdict_job_ended], out_of_time [verdict_job_ended]
tool_ran           > gating, calling, over_budget, gave_up
```

**Part b.** Six recordings, all legal and complete, 0 model calls:

| Recording | Events | Path |
|---|---|---|
| `audit-atlas.jsonl` | 8 | started > calling > replied > gating > tool_ran > calling > replied > landed |
| `tight-budget.jsonl` | 7 | started > calling > replied > gating > tool_ran > calling > over_budget |
| `tight-deadline.jsonl` | 7 | started > calling > replied > gating > tool_ran > calling > out_of_time |
| `tight-deadline-resume.jsonl` | 4 | started > calling > replied > landed |
| `audit-atlas-grounded.jsonl` | 9 | started > grounded > calling > replied > gating > tool_ran > calling > replied > landed |
| `audit-atlas-bare.jsonl` | 8 | started > calling > replied > gating > tool_ran > calling > replied > landed |

The six take **10 of the 26 edges**. The other 16 were read from `supervisor.ts` and no
recording happened to take them. The tests walk four of those through the real supervisor
against a fake gateway: a held tool that is approved, a held tool with nobody to ask, a spec
that asks for evidence and gets none, and a throttled provider.

**Part c.** Each rule refuses with its own path and message:

```
start not declared         > start: [custom] the start node must be one of the declared nodes
edge to an unknown node    > edges: [custom] edge calling > published names a node the graph does not declare: published
edge with an unknown guard > edges: [custom] edge calling > replied cites a guard the graph does not declare: moon_is_full
edge out of a terminal     > edges: [custom] edge landed > calling leaves a terminal node
a claim in the graph       > (root): [unrecognized_keys] Unrecognized key: "claims"
an event in the graph      > (root): [unrecognized_keys] Unrecognized key: "events"
```

And one legal graph with an illegal run. The grounded recording's `evidence_used` line, moved
after the first `call_started`:

```
evidence line moved after call 1 > REFUSED at line 3: no edge calling > grounded
```

**Tests.** 32 in three files. Two rules were proved necessary by breaking them: with guards
ignored, 2 tests fail; with the terminal rule removed, 1 fails. Exercise 08's 29 tests and
exercise 11's 21 were re-run green, and `pnpm -r typecheck` passes across all twelve packages.

## Break experiments

1. Delete the edge `tool_ran > calling` from the graph file. Predict how many of the six
   recordings part b refuses, and at which line each one stops.
2. Rename the guard `reply_finished` to `reply_done` in the graph file only. Predict which part
   refuses, and whether it is the parse or the walker.
3. Add the edge `{ "from": "calling", "to": "grounded" }`. Part b still passes. Say what the graph
   now allows that the supervisor cannot do, and which test would catch it.
4. Add `"terminal": []` by removing every terminal name. Predict the refusal before you run part a.

## One thing this lesson does not do

Nothing reads the graph to decide what the supervisor does next. The `if` statements still run
the loop, and the graph describes them after the fact. A graph that drifts from the code is
caught only when a recording takes an edge the graph lacks. Lesson 0018 turns the graph into the
thing that advances the loop, and then the code cannot drift from it.
