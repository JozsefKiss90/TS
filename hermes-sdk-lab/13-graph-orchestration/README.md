# Exercise 13 — LangGraph.js, evaluated

Lesson: [0020 — LangGraph.js, Evaluated](../../lessons/0020-langgraph-js-evaluated.html)

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
- No adopt, wrap or skip decision is made here. That is lesson 0021.
