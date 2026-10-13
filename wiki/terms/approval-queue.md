---
term: approval queue
aliases:
  - the queue
  - parkedJobs
type: glossary-term
lesson: "0019"
phase: 3
category: hermes
status: introduced
introduced: 2026-10-13
tags:
  - glossary
  - hermes
---

# approval queue

The set of checkpoints standing at `awaiting_approval` with no verdict yet.

Nothing writes the queue. It is a filter over the [[checkpoint|checkpoints]] the wiring keeps: `parkedJobs` keeps those whose node is `awaiting_approval` and whose `state.verdict` is `null`. A job whose spec requires no approval never enters it, because its gate never says hold and the [[guard]] `gate_held` never opens.

The answer to a queued job is `answerParked(checkpoint, verdict)`. It writes `"approved"` or `"denied"` into the checkpoint's state and returns a checkpoint again. The resume reads that checkpoint back through the same strict parse. It refuses a job at another node, a job already answered, and a job with nothing pending. No event is recorded by the answer. The handler that runs on resume reads the verdict, records the `approval` event, and the call is answered as it would be in-process.

**In [[lesson-0019-interruption-is-a-state|lesson 0019]]:** `src/queue.ts`. Part H lists two checkpoint files and finds one waiting. Part I answers it from a second shell, and the trace file is untouched. Part J resumes it from a third shell: landed, 2 model calls, 80 tokens, one trace file of nine lines that walks legal and complete. With the verdict-in-state branch of the handler disabled, 2 tests fail.

**Why it matters for Hermes:** scenario step S5 (the loop iterates) promised this queue in lesson 0010. The operator's side of a held call is now a directory any process can read, and the verdict is a word in a file.

**Related:** [[parked-run]] · [[checkpoint]] · [[approval-gate]] · [[node-handler]] · [[trace]] · [[safe-parse]]
