# ADR 0001 — Skip LangGraph.js for the loop's graph; keep the port

- **Status:** accepted, 2026-10-30 (user decision, lesson 0021 session)
- **Scope:** this course workspace's Spec-to-Evidence Loop (labs 12 and 13). It is a course decision,
  not a Hermes OS ADR. Hermes OS's own record (ADR-0001..0021 in the `hermes-os` repo) is unaffected.
- **Answers:** `ROADMAP.md` Phase 3 exit criterion, "a written justification of what the framework
  bought", and the adopt / wrap / skip decision the Phase 3 header deferred.

## Context

Phase 3 built the loop's control flow as a hand-written workflow graph first (lessons 0017–0019, lab 12:
a strict Zod graph file, guards as named pure functions, a 66-line interpreter, a file checkpoint per
job, a parked run answered from a second process). Lesson 0020 then ran the same graph on LangGraph.js
behind lab 12's own `runGraph` signature (lab 13), and lab 12's 74 tests passed unchanged on it.
Lesson 0021 built each job's graph from its TaskSpec, and both engines refused the same moves.

Versions measured: `@langchain/langgraph` 1.4.21, `@langchain/core` 1.2.17, zod 4.4.3, vitest 3.2.7,
Node 22.14.0.

## The three options

| Option | Meaning |
|---|---|
| Adopt | LangGraph.js runs the graph **and** owns the stored record and the resume: its checkpointer replaces lab 12's checkpoint file, and `Command({ resume })` replaces `answerParked` and the queue. |
| Wrap | LangGraph.js runs the graph behind Hermes's `runGraph` port. Hermes keeps the record and the resume (lab 13 as built). |
| Skip | Hermes's own interpreter runs the graph. LangGraph.js is not a dependency of the loop. |

## Evidence

| Measurement | Source | Bears on |
|---|---|---|
| Under the port, only traversal moved. The guards stayed Hermes's (the router calls `findOpenEdge`; removing that call fails 2 tests). The checkpoint save stayed Hermes's (removing it fails 14). The pause stayed Hermes's (bypassing it fails 13). | lesson 0020, lab 13 README | Wrap buys traversal only. |
| Traversal is 66 code lines in lab 12's `interpreter.ts`. The runner that hands it to the framework is 157 code lines. Comments and blank lines excluded. | measured 2026-10-30 | Wrap costs more code than it removes. |
| The framework's own resume needs 80 more code lines in `job-thread.ts`, beside the runner. | measured 2026-10-30 | Adopt adds code on top of Wrap's. |
| The two pinned packages bring 19 more into the lockfile (zod excluded, which the loop already uses). | `pnpm-lock.yaml`, measured 2026-10-30 | Wrap and Adopt add a dependency tree. |
| `interrupt()` refuses to run without a checkpointer, so the runner builds a `MemorySaver` per call that nobody reads. | lesson 0020, `dist/interrupt.js` | Wrap carries a record with no reader. |
| The framework stops any run at 25 steps unless raised. Lab 12 has no step limit, because the spec's bounds end a job. The runner raises it to 10,000. | lesson 0020, `bound.test.ts` | A rule the loop did not ask for. |
| Under the framework's own resume, two records say the job waits (the thread and lab 12's queue), and the paused node reruns from its first line, so lab 12's step 4 is saved twice. The paused handler runs three times. | lesson 0020, part b | Adopt duplicates the record and repeats side effects before a pause. |
| Hermes OS ADR-0018 (accepted): job truth lives in manifests, job state files and the ledger. | `docs/hermes_os/architecture/hermes-job-control-plane.md` §4 | Adopt moves the verdict into a store Hermes does not own. |
| Kill-and-resume from a checkpoint (0018) and a verdict from a second process (0019) work with no framework. | lessons 0018, 0019 | Skip loses no capability the course has built. |
| A job graph built from the spec runs on both engines and both refuse the same two moves. | lesson 0021, `job-graph-run.test.ts`, `pnpm job e` | Neutral: the graph file, not the engine, holds the job's rules. |

## Decision

**Skip.** Hermes's loop runs its graph on lab 12's interpreter. LangGraph.js is not a dependency of
the loop.

**Keep the port.** `runGraph`'s signature stays the one place an engine plugs in, and lab 13 stays as
the measurement harness: its `vitest.config.ts` swap runs lab 12's tests on any engine typed
`typeof Lab12.runGraph`. Re-evaluating a framework costs one runner file and one test run.

## Consequences

- Lab 12 stays the loop's engine. Lab 13 stays in the workspace as evidence and as the harness for a
  future candidate. Its two pinned packages stay in lab 13's `package.json` only.
- The checkpoint file and the approval queue stay Hermes's single record that a job waits.
- No durable LangGraph.js checkpointer is evaluated. None is needed while lab 12's file checkpoint
  survives a process exit.

## Revisit when

- A need appears that lab 12 cannot meet with a small change: streaming of node progress to a client,
  a durable store shared by several workers, or several agents in one graph (Phase 6, gated on
  benchmark evidence).
- Phase 5 meets the Claude Agent SDK. Any harness that brings its own loop is measured through the
  same port first.
