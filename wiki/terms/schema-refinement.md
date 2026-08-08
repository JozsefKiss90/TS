---
term: Refinement
aliases:
  - schema refinement
  - refine
type: glossary-term
lesson: "0007"
phase: 1
category: validation
status: introduced
introduced: 2026-08-08
tags:
  - glossary
  - validation
---

# Refinement

A schema rule that runs after every field's type passes. It reads the whole object, so it can state a rule no single field can carry.

`z.object` checks fields one at a time and cannot compare two of them. A refinement is a function over the parsed object, plus a message and a path. The path decides which field the rejection names.

**In [[lesson-0007-the-taskspec-is-a-contract|lesson 0007]]:** `TaskSpecSchema` refuses a spec whose `maxTokens` exceeds its `costCeilingTokens`. Both fields hold valid positive integers, so only a rule that reads both can object. The issue code reads `custom`, because the rule is written rather than declared.

Order is measurable. A file that omits `owner` and also breaks the ceiling rule reports the `owner` issue alone. The refinement never runs, so one bad file can be refused in two rounds.

**Why it matters for Hermes:** most admissibility rules span fields. A budget must cover its own calls, and a tool policy must agree with the job's autonomy cap. Those are refinements, not field types.

**Related:** [[task-spec]] · [[admissibility-check]] · [[zod-schema]] · [[safe-parse]] · [[runtime-validation]]
