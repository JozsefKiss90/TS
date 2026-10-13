---
term: parked run
aliases:
  - park
  - parked
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

# parked run

A run stopped at a node by its handler, with no process holding it.

A [[node-handler|handler]] returns one of two results. A move names the next node, carries the state, and records an event. A park, `{ park: true }`, stops the run where it stands. The [[graph-interpreter|interpreter]] asks for no edge, records no event and writes no [[checkpoint]], because the last checkpoint already names this node. It returns a typed result, `{ ok: false, kind: "parked", step, node, state }`, and the process may exit.

Resumed from that checkpoint, the same handler runs again. If nothing has changed it parks again, and the step count stays where it was.

**In [[lesson-0019-interruption-is-a-state|lesson 0019]]:** the handler for `awaiting_approval` parks when no approver is wired in-process and the wiring sets `park`. Part G runs the audit with `graph_health` held, makes one model call, and parks at step 4. The trace file holds four lines and the checkpoint names the node. With the park check in the interpreter replaced by a throw, 8 tests fail.

**Why it matters for Hermes:** scenario step S5 (the loop iterates) says a held writeback call queues for the operator. A parked run is the job in that queue, and the [[approval-queue]] is the set of them. No process waits on a promise while a human decides.

**Related:** [[approval-queue]] · [[checkpoint]] · [[graph-interpreter]] · [[node-handler]] · [[approval-gate]] · [[workflow-graph]]
