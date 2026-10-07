---
term: checkpoint
aliases:
  - JobCheckpoint
  - checkpoint file
type: glossary-term
lesson: "0018"
phase: 3
category: hermes
status: introduced
introduced: 2026-10-07
tags:
  - glossary
  - hermes
---

# checkpoint

The job state plus the node the run enters next, written after every step.

The [[graph-interpreter|interpreter]] writes one after each step, through a port, and the wiring decides where it lands. The lab's sink is one file per job, replaced on every step. The [[trace]] sink appends one line per event and never rewrites one. The checkpoint says where the run is. The trace says what the run did. Neither holds the other's content, and the checkpoint's strict shape refuses an `events` key at the root.

Reading a checkpoint back is a JSON boundary. The parse `admitCheckpoint` is a [[safe-parse]] over a strict schema, and its `state` field is `JobStateSchema`. That state is the transcript, the ledger, the tool runs, and a reply not yet booked. It also holds the tool calls not yet answered, with the gate's decision and the operator's verdict on the first of them. Three things are not in it: the deadline timer, the abort controller, and a model call in flight.

**In [[lesson-0018-the-loop-walks-the-graph|lesson 0018]]:** a run killed while a held call waits leaves a checkpoint at step 4, node `awaiting_approval`, with one pending call. Resumed from it, the job asks the operator again and not the model. That costs 2 model calls and 80 tokens, against 3 calls and 110 tokens for lesson 0011's resume from the trace. A run killed inside a model call leaves a checkpoint that never heard of the call. The call is made again, and neither resume knows what the dead call cost.

**Why it matters for Hermes:** scenario step S7 (the run is recorded) gains a second record, so a job can continue where it stopped. Lesson 0019 parks a held call as a checkpoint that a second process answers.

**Related:** [[graph-interpreter]] · [[node-handler]] · [[trace]] · [[workflow-graph]] · [[safe-parse]] · [[job-supervisor]]
