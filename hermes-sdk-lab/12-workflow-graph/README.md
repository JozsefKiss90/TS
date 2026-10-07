# Exercise 12 — thinking in state graphs, and the loop that walks the graph

Lessons: [0017 — Thinking in State Graphs](../../lessons/0017-thinking-in-state-graphs.html) ·
[0018 — The Loop Walks the Graph](../../lessons/0018-the-loop-walks-the-graph.html)

Parts a to c and the first three test files are lesson 0017. Parts d to f, `src/interpreter.ts`,
`src/handlers.ts`, `src/job-state.ts`, `src/checkpoint.ts` and the other three test files are
lesson 0018, below.

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
| `src/main.ts` | six runnable parts |
| `tests/` | 57 tests: the graph's rules, the walker, the recorded runs (0017); the checkpoint, the interpreter, the graph-driven run (0018) |

The supervisor is not changed by either lesson. Lesson 0017's graph describes it after the fact.
Lesson 0018 moves its bodies into handlers and lets the graph drive them, and the supervisor keeps
running labs 08 and 11 as the regression proof.

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

## One thing lesson 0017 does not do

Nothing in parts a to c reads the graph to decide what the supervisor does next. The `if`
statements still run the loop, and the graph describes them after the fact. A graph that drifts
from the code is caught only when a recording takes an edge the graph lacks. Lesson 0018 turns the
graph into the thing that advances the loop, and then the code cannot drift from it.

---

# Lesson 0018 — the loop walks the graph

Scenario step **S3 (dispatch under the graph)**, continued, and **S7 (the run is recorded)** with a
second record. The supervisor's control flow leaves: each node's work becomes a handler that names
the node it wants next, and a small interpreter asks the graph whether that move exists before
making it. A move the graph does not hold is a typed refusal. A checkpoint (state + the node
entered next) is written after every step, and a job killed mid-run resumes from it.

## What lives here (0018)

| File | What it is |
|---|---|
| `src/interpreter.ts` | `runGraph`: run a handler, check the edge with `findOpenEdge`, write a checkpoint, move. Generic over state and context; a `Refusal` is a typed result |
| `src/handlers.ts` | the seven node handlers, each the matching stretch of `supervisor.ts` moved; `startJob` and `resumeJob`, which arm the bounds and write `job_ended` at a terminal node |
| `src/job-state.ts` | `JobStateSchema`: the supervisor's local variables as one value, so a checkpoint can be parsed back |
| `src/checkpoint.ts` | `CheckpointSchema` (strict: an `events` key is refused), `admitCheckpoint` |
| `src/walker.ts` | gains `findOpenEdge`, shared by the walker (after the run) and the interpreter (before the move) |
| `checkpoints/audit-atlas.json` | written by part f and read back in the same run, replaced on every step; ignored by git |
| `src/scripted-replies.ts` | the two fake replies (`wantsTool`, `done`) every in-process run is built from |
| `tests/checkpoint.test.ts` | the boundary: 5 tests |
| `tests/interpreter.test.ts` | the loop with toy handlers on the small graph: 7 tests |
| `tests/graph-run.test.ts` | nine scenarios equal to the supervisor, two refusals, two kills resumed two ways: 13 tests |

## Commands (0018)

```bash
pnpm --filter 12-workflow-graph job d    # the same job, by the supervisor and by the graph
pnpm --filter 12-workflow-graph job e    # an edge removed from the file: a typed refusal
pnpm --filter 12-workflow-graph job f    # killed mid-run, resumed from the checkpoint file
pnpm --filter 12-workflow-graph test
```

## Measured, 2026-10-07

Versions: `zod` 4.4.3, `vitest` 3.2.7, Node 22.14.0. Every gateway is lab 07's `FakeModelGateway`,
or a test-local variant that reports progress and waits for the abort signal so the mid-call bounds
can be measured without the mock.

**Control flow, counted with grep.** `supervisor.ts`: 2 `for` loops, 3 `continue`, 15
`return report(`. `handlers.ts`: 0, 0, and 23 handler returns that name a node through three
helpers (`move`, `exit`, `nextCall`; 27 call sites counting the helpers' own). The `if` statements
that classify a reply or a failure are still there; what they can do now is name a node, not make
the move.

One moved line changed. The supervisor's `raceBounds` has no rejection arm, so an approver that
throws would leave the wait hanging; the handlers' version rejects, which is how part f and the
tests kill a run during the wait. Every other handler line is the supervisor's.

**Part d.** The audit job (one tool call answered) through both:

```
same report   : true
events, code  : job_started > call_started > reply > gate > tool_result > call_started > reply > job_ended
events, graph : job_started > call_started > reply > gate > tool_result > call_started > reply > job_ended
checkpoints   : 1:calling  2:replied  3:gating  4:tool_ran  5:calling  6:replied  7:landed
walked        : legal, complete
```

The tests do the same for nine scenarios: one tool call answered, a held tool approved, a held
tool with nobody to ask, a grounded job, evidence asked for and none arrived, a throttled provider,
the call cap, the ceiling reached mid-generation, the deadline passed mid-generation. Same report
(`toEqual`), same events with `at` stripped, and every trace walks legal and complete.

**Part e.** The edge `tool_ran > calling` removed from the file:

```
result          : { ok: false, kind: 'no_edge', step: 5, from: 'tool_ran', to: 'calling' }
model calls made: 1 of the 2 the script held
events          : job_started > call_started > reply > gate > tool_result
last checkpoint : step 4, node tool_ran
```

A guard that says no is the other arm: with `reply_finished` replaced by `() => false`, the run
is refused at step 3, `guard_refused`, `replied > landed`, `guards: ["reply_finished"]`.

**Part f.** Killed while a held call waits for the operator (the approver throws). The kill is a
thrown error inside one process: the checkpoint is read back from disk through `admitCheckpoint`,
and the trace continues in memory. Resuming in a genuinely separate process is lesson 0019.

```
trace so far    : job_started > call_started > reply > gate
read back       : step 4, node awaiting_approval, 1 pending call, gate hold, 1 call, 30 tokens

resume 1, lesson 0011's way: rebuild from the trace, run the supervisor
  rebuilt       : turns operator, 1 call, 30 tokens
  result        : landed, 3 model calls, 110 tokens

resume 2, lesson 0018's way: continue from the checkpoint, same trace
  result        : landed, 2 model calls, 80 tokens
  whole trace   : job_started > call_started > reply > gate > approval > tool_result > call_started > reply > job_ended
  walked        : legal, complete
```

**The other kill, in tests.** Killed inside call 2 (the fake's script runs out), after
`call_started` was written:

| | resume from the trace (0011) | resume from the checkpoint (0018) |
|---|---|---|
| what it starts from | 6 events: `modelCalls` 2, 30 tokens, 3 turns | step 5, node `calling`: `modelCalls` 1, 30 tokens, 3 turns |
| the dead call | counted, because it may have been billed | never seen |
| next call made | call 3 | call 2 again |
| result | landed, 3 calls, 80 tokens | landed, 2 calls, 80 tokens |
| the combined trace, walked | n/a, two files | refused at line 7: `no edge calling > calling` |

Neither knows what the dead call cost. The walker's refusal of the combined trace is the
diagnosis: a call went out and never came back, and the graph will not read that as a move.

**Tests.** 57 in six files, all green. Two things were proved load-bearing by mutation: with the
edge check in `runGraph` skipped, 4 tests fail; with the checkpoint save removed, 7 fail; restored,
57 pass. Exercise 08's 29 tests and exercise 11's 21 were re-run green, and `pnpm -r typecheck`
passes across all twelve packages.

## Break experiments (0018)

1. Remove the edge `gating > tool_ran` from the graph file and run part d. Predict the step number
   and the two node names in the refusal before you run it.
2. In `handlers.ts`, make the `replied` handler return `"gating"` for every reply. Predict which
   guard refuses, at which step, and whether a checkpoint was written for that step.
3. Run part f, then delete `checkpoints/audit-atlas.json` and run only resume 2 by hand. Say what
   `admitCheckpoint` returns for a missing file versus a file with an `events` key added.
4. Resume the part e run from its last checkpoint (step 4, `tool_ran`) after putting the edge
   back. The tool runs a second time and a second `tool_result` lands in the trace. Say why, and
   what a tool with side effects would need before this is safe.

## What lesson 0018 does not do

`awaiting_approval` is still answered in-process. A resumed run asks the operator again, and
nothing parks the job for a second process to answer; that is lesson 0019. The trace vocabulary is
unchanged, so a resumed run has no event of its own and continues the same file. A handler that
crashes after recording its event, as `calling` does when the gateway throws, leaves an event the
checkpoint does not know about; the resumed trace shows it, and the walker refuses it.
