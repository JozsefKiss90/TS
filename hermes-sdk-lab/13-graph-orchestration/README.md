# Exercise 13 — LangGraph.js, evaluated; the spec decides the graph

Lessons: [0020 — LangGraph.js, Evaluated](../../lessons/0020-langgraph-js-evaluated.html) ·
[0021 — The Spec Decides the Graph](../../lessons/0021-the-spec-decides-the-graph.html) (parts d
and e, [below](#lesson-0021--the-spec-decides-the-graph))

Scenario step **S3 (dispatch under the graph)**, on a framework. Lab 12 runs the job lifecycle graph
with its own interpreter: about forty lines of loop that run a handler, ask the graph for an edge,
save a checkpoint and move. This exercise keeps that function's signature and hands the loop to
LangGraph.js. Then it runs lab 12's tests, unchanged, against the result.

Lab 12 stays framework-free. This package imports lab 12's graph file, parse, guards, handlers,
walker, queue and test helpers, and lab 07's trace and fake gateway. The one thing repeated is the
pair of wiring checks `runGraph` runs before any handler (a guard with no implementation, a node with
no handler), because the runner must refuse the same faults before it builds anything.

## What lives here

| File | What it is |
|---|---|
| `src/langgraph-runner.ts` | `orchestrate`, which builds a `StateGraph` from a lab 12 graph, and `runGraph`, typed as `typeof Lab12.runGraph` |
| `src/job-thread.ts` | the audit job on a framework thread: `startOnThread`, `answerOnThread` (`Command({ resume })`), `waitingAt`, `frameworkCheckpoints` |
| `src/main.ts` | three runnable parts, a to c |
| `vitest.config.ts` | the swap: a plugin that hands any importer of lab 12's `interpreter.ts` the runner instead, and includes lab 12's test files |
| `tests/port.test.ts` | proves the swap happened, from both sides |
| `tests/native-resume.test.ts` | pause by `interrupt()`, resume by `Command`, a refused answer, a resume to the wrong thread, the re-run node |
| `tests/bound.test.ts` | the framework's step limit, measured on a 40-step loop |

Lab 12's `handlers.ts` gained two exports for this exercise, `jobContext` and `finishJob`, split out
of its private `drive` function with no change in behaviour. Lab 12's own 74 tests were re-run green
after the split.

## Commands

```bash
pnpm install                                   # once, from hermes-sdk-lab/
pnpm --filter 13-graph-orchestration test      # lab 12's 74 tests + 9 of lab 13's, on the framework
pnpm --filter 13-graph-orchestration job a     # the audit on StateGraph, two checkpoint records
pnpm --filter 13-graph-orchestration job b     # paused by interrupt(), resumed by Command
pnpm --filter 13-graph-orchestration job c     # a resume value the verdict schema refuses
```

## Measured, 2026-10-22

Versions, pinned exact in `package.json`: `@langchain/langgraph` 1.4.21, `@langchain/core` 1.2.17,
`zod` 4.4.3, `vitest` 3.2.7, Node 22.14.0. The declarations quoted in the lesson were read from the
installed `.d.ts` files. Docs checked in-session: the LangGraph.js interrupts page and the graph API
page on docs.langchain.com.

**`pnpm test`:** 12 files, 83 tests, all green. Nine files are lab 12's, run byte for byte. Of lab
12's 74 tests, 30 reach `runGraph` (interpreter 7, park 3, graph-run 13, parked-run 7) and 44 never
call it.

**Red run, before the runner existed:** 7 files failed to load (lab 12's four that reach the
interpreter, and lab 13's three). The error already named the redirected path, so the plugin worked
before the runner did. 44 tests passed.

**Mutations of the runner**, one at a time, restored after each:

| Mutation | Tests failing |
|---|---|
| the router routes to any declared target without asking `findOpenEdge` | 2 (the two guard refusals) |
| the arriving node does not call lab 12's checkpoint port | 14 |
| a park no longer calls `interrupt()` | 13 |
| the swap plugin removed from `vitest.config.ts` | 2 (the port tests; lab 12's 74 pass on lab 12's interpreter) |

**Part a.**

```
result                 : landed, 2 calls, 80 tokens, tools: graph_health → ran
trace                  : job_started > call_started > reply > gate > tool_result > call_started > reply > job_ended
walks                  : {"ok":true, …, "complete":true, …}
lab 12 checkpoints     : 7 (one per move)
framework checkpoints  : 10 (one per framework step, plus the input)
```

**Part b.**

```
paused                 : parked at awaiting_approval, step 4, 1 model call
framework says waiting : ["awaiting_approval"]
lab 12 queue says      : Audit the atlas graph at step 4
resumed                : landed, 2 calls, 80 tokens, tools: graph_health → ran (approved)
trace                  : 9 lines, {"ok":true, …, "complete":true, …}
lab 12 checkpoint steps: 1, 2, 3, 4, 4, 5, 6, 7, 8
framework checkpoints  : 11
lab 12 queue after     : 0 waiting (latest checkpoint at landed)
```

Step 4 is saved twice because the framework restarts the paused node from its first line, and that
line makes the arrival. The two saves are equal.

**Part c.**

```
refused                : $ZodError, invalid_value: Invalid option: expected one of "approved"|"denied"
trace                  : 4 lines, unchanged
framework says waiting : ["awaiting_approval"]
```

**Step limit.** A toy loop of 40 steps lands through `runGraph`, which sets the limit to 10,000.
Through `orchestrate` with `recursionLimit: 25`, the framework's default, it throws
`GraphRecursionError`.

## How the runner maps lab 12 onto the framework

| Lab 12 | Lab 13 |
|---|---|
| the `for` loop in `runGraph` | the framework's loop over nodes |
| a node name in the graph file | a framework node with the same name |
| `findOpenEdge` before each move | one conditional edge per node; its router calls `findOpenEdge`; its targets are the edges the file draws, plus `END` |
| save after the move | the node the router picked saves on arrival |
| a refusal returned by the loop | the router sends the run to `END`; the runner asks `findOpenEdge` again to name the refusal, because a router cannot write state |
| a park returned by the loop | the node calls `interrupt(position)`; the run's result carries `__interrupt__` |
| no step limit | `recursionLimit: 10_000` |
| the wiring checks before any handler | the same checks, copied, before the builder is made |

The framework's state has two fields, `at` (where the run stands) and `wanted` (the move the last
handler asked for). `JobState` lives inside `at`.

## Break experiments

1. Remove the plugin from `vitest.config.ts`. Lab 12's 74 tests still pass, against lab 12's own
   interpreter, and `tests/port.test.ts` fails. That is why the port test exists.
2. In `langgraph-runner.ts`, make the router return `wanted.to` whenever it is a declared target. Only
   the two guard refusals fail: the targets list still refuses an undeclared edge.
3. Call `orchestrate(...).start` with `recursionLimit: 25` on the audit. It lands at step 7, well
   under the default. The limit only bites on long runs, as `tests/bound.test.ts` shows.
4. In `src/langgraph-runner.ts`, delete the paused-thread check in `resume`, then run
   `native-resume.test.ts`. A resume sent to the wrong thread now fails inside the framework with
   `TypeError: Cannot read properties of undefined (reading 'node')`, because `Command` started an
   empty run. The check turns that into "holds no paused run".
5. Make a router return a node that is not in its targets list. LangGraph.js throws
   `Branch condition returned unknown or null destination`. Leave a node out of every list and
   `compile()` throws `UnreachableNodeError` before anything runs.

## What lesson 0020 does not do

- The framework's resume never crossed a process. `MemorySaver` ends with the process, so part b and
  the tests use a fresh job context in the same process to stand in for a second one. A durable saver
  is a parameter (`saver`), and none was tested.
- Under lab 12's port, the framework's checkpointer exists only because `interrupt()` requires one. Its
  thread is discarded when `runGraph` returns.
- The framework's resume keeps the verdict in its thread. Lab 12's queue reads lab 12's checkpoint
  files, so under that resume two records say a job waits, and only one of them is a file an operator
  can list.
- Under `Command({ resume })` the paused handler runs three times: once when it parks, once more
  when the framework restarts the node (it parks again, and `interrupt()` now returns the answer),
  and once with the answer in its state. Lab 12's handler records nothing on the park path, so the
  trace shows none of this. A handler with a side effect before its park would repeat it.
- A refused move is named by calling `findOpenEdge` a second time after the run, so its guards run
  twice. That is safe only because every guard is a pure function of the event being left.
- No adopt, wrap or skip decision is made here. That is lesson 0021, below.

---

## Lesson 0021 — the spec decides the graph

Scenario step **S3 (dispatch under the graph)**, with a graph built for one job. Lab 12's file holds
every path any spec could need, so the audit, which holds nothing for approval, still has an edge
into `awaiting_approval`. It stays closed only because `gateToolCall` never answers `hold` for that
spec. `graphForSpec` cuts what the spec makes unreachable before the job starts, and the result goes
through `admitWorkflowGraph` like the file does.

| File | What it is |
|---|---|
| `src/graph-for-spec.ts` | `graphForSpec(full, spec)`: three rules, each read from one spec field, returning the job graph and the `Cut`s that made it |
| `src/dispatch.ts` | `dispatch`: one spec value feeds both `graphForSpec` and `startJob` |
| `tests/graph-for-spec.test.ts` | 19 tests: the cuts, the counts, the re-admission, purity, and the seven recorded traces walked on their own spec's graph |
| `tests/job-graph-run.test.ts` | 5 tests: dispatched runs, and two moves the job graph refuses (on LangGraph.js, through the swap) |
| `src/main.ts` | parts d and e, which run on lab 12's own interpreter |

The three rules, each a fact about lab 12's handlers:

| Spec field | Value | Cut | Why |
|---|---|---|---|
| `approvalRequired` | empty | `awaiting_approval` and its 5 edges | the gate answers `hold` only for a listed tool |
| `evidenceQueries` | empty | `grounded` and its 4 edges | `started` enters `grounded` only when a pack answers the queries |
| `evidenceQueries` | listed | the edge `started > calling` | with queries listed and no pack, `started` ends at `no_evidence` |

Nothing is cut for an empty `allowedTools`: the model may still name a tool, and the gate must run to
refuse it. `no_evidence` always stays, because a pack the spec never asked for still ends there.
Hermes's `--no-writeback` audit is lab 07's audit spec: lab 07's TaskSpec has no writeback flag, so
the job that may change nothing is the one whose `approvalRequired` is empty.

```bash
pnpm --filter 13-graph-orchestration job d     # three specs, three job graphs, what each cut
pnpm --filter 13-graph-orchestration job e     # runs under a job graph, on lab 12's interpreter
pnpm --filter 13-graph-orchestration test      # the same runs on LangGraph.js, through the swap
```

### Measured, 2026-10-30

Same versions as above. **`pnpm test`:** 14 files, 107 tests, all green (lab 12's 74, lesson 0020's
9, lesson 0021's 24).

**Red run, tests first:** both new files failed to load, `Cannot find module '../src/dispatch.js'`.
Green on the first implementation run, 24/24; `tsc -p .` clean.

**Mutations of `graph-for-spec.ts`**, one at a time, restored and verified with `cmp` after each:

| Mutation | Tests failing |
|---|---|
| the `approvalRequired` rule never applies | 6 |
| the `grounded` rule never applies | 4 |
| the `started > calling` rule never applies | 2 |
| guards no edge cites are kept | 1 |

**Part d.**

```
full graph             : 13 nodes, 26 edges, 6 guards

audit                  : 11 nodes, 17 edges, 3 guards
  cut by approvalRequired: node awaiting_approval, 5 edge(s), because no tool is held for approval, so the gate never answers hold
  cut by evidenceQueries : node grounded, 4 edge(s), because no evidence is asked for, so no pack can ground the job

held                   : 12 nodes, 22 edges, 6 guards
  cut by evidenceQueries : node grounded, 4 edge(s), because no evidence is asked for, so no pack can ground the job

grounded               : 12 nodes, 20 edges, 3 guards
  cut by approvalRequired: node awaiting_approval, 5 edge(s), because no tool is held for approval, so the gate never answers hold
  cut by evidenceQueries : 1 edge(s), because evidence is asked for, so no model call may start before it is used
```

**Part e** (lab 12's interpreter; `tests/job-graph-run.test.ts` measures the same on LangGraph.js):

```
audit, dispatched      : landed, 2 calls, 80 tokens, tools: graph_health → ran
walks its job graph    : {"ok":true, …, "complete":true, …}

hold on audit's graph  : refused: no_edge gating > awaiting_approval at step 4
  model calls made     : 1 of the 2 the script held
  trace                : job_started > call_started > reply > gate
  last checkpoint      : step 3, node gating

no pack, grounded graph: refused: no_edge started > calling at step 1, 0 model calls

parked-audit.jsonl     : 9 lines
  on the held graph    : {"ok":true, …, "complete":true, …}
  on the audit's graph : {"ok":false,"line":5,"from":"gating","to":"awaiting_approval","reason":"no edge gating > awaiting_approval"}
```

The two refused runs hand `startJob` a spec other than the one the graph was built from. That stands
in for a gate that disagrees with its spec; `dispatch` never does it.

### Break experiments

1. In `graph-for-spec.ts`, make the `approvalRequired` rule never apply. Six tests fail, and part e's
   hold parks instead of being refused.
2. Make the `started > calling` rule never apply and run part e. The run with no pack now makes a
   model call: its handler read a spec that asks for no evidence, and the graph no longer objects.
3. Walk `../11-evidence-in-the-loop/traces/audit-atlas-grounded.jsonl` against the plain audit's job
   graph. It is refused at line 2, entering `grounded`.

### What lesson 0021 does not do

- The rules are facts about lab 12's handlers, checked by tests. Nothing ties them to the handlers'
  code, so a handler change could make a rule false; the recorded traces and the run tests are what
  would catch it.
- No writeback flag exists in the TaskSpec. An empty `approvalRequired` stands in for `--no-writeback`.
- No rule reads `allowedTools`, `maxModelCalls` or the deadline. The bounds can end a job from several
  nodes, and those edges stay.

### The decision this lab informs

[`docs/adr/0001-skip-langgraph-js-keep-the-port.md`](../../docs/adr/0001-skip-langgraph-js-keep-the-port.md):
skip LangGraph.js for the loop's graph, and keep `runGraph`'s signature as the port. This package
stays as the harness that measures any later engine against lab 12's tests. Line counts used there
(comments and blank lines excluded): `interpreter.ts` 66, `langgraph-runner.ts` 157, `job-thread.ts`
80. The two pinned packages bring 19 more into the lockfile, zod excluded.
