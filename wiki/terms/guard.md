---
term: guard
aliases:
  - named guard
type: glossary-term
lesson: "0017"
phase: 3
category: hermes
status: introduced
introduced: 2026-10-06
tags:
  - glossary
  - hermes
---

# guard

A named rule on an edge of the [[workflow-graph|workflow graph]] that says whether the move is allowed.

A guard lives in two places. The graph file holds its name, so the parse can check that every edge cites a declared guard. The code holds its function, keyed by that name, so the walker can run it. The split is the one lesson 0003 drew between a signature and its implementation. The file says which rule an edge needs, and the code does the check.

Every guard in the job lifecycle reads the event being left, because that event decided the branch in the supervisor. The guard `reply_finished` reads a reply's stop reason. The guard `gate_held` reads a gate's decision. The guard `verdict_answered` reads an approval's verdict. None reads the spec, the ledger or the clock.

**In [[lesson-0017-thinking-in-state-graphs|lesson 0017]]:** the file `src/guards.ts` implements the six names the graph declares. The walker refuses a graph that names a guard the table cannot run, before it reads any event. A guard that says no ends the walk with the line number and the guard's name.

**Why it matters for Hermes:** the approval gate of lesson 0010 becomes a guarded edge into `awaiting_approval`. Lesson 0021 derives which edges exist from the spec, and the guards are where permission levels will be read.

**Related:** [[workflow-graph]] · [[terminal-node]] · [[approval-gate]] · [[trace]]
