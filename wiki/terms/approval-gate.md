---
term: approval gate
aliases:
  - gate
type: glossary-term
lesson: "0010"
phase: 1
category: hermes
status: demonstrated
introduced: 2026-08-20
demonstrated: 2026-08-25
tags:
  - glossary
  - hermes
---

# approval gate

A check that holds a permitted tool call until an operator decides.

The gate is the third permission level. A tool can be unlisted, permitted, or permitted with approval, and all three live in the [[task-spec]]. One pure function reads the spec and answers `not_permitted`, `auto` or `hold`.

The gate never runs anything and never decides anything itself. A held call goes to the `ApprovalPort`, and the wait shares the job's `AbortController`, so a silent operator cannot break [[termination]].

**In [[lesson-0010-approval-gates-and-permissions|lesson 0010]]:** `approval.ts` holds `gateToolCall` and the port. Part H wires the port to the terminal, so a live job pauses until the human answers.

**Why it matters for Hermes:** scenario step S5 (the loop iterates) contains this check. Read-only queries pass automatically, and writeback tools wait for the operator. The wire has no approval field, so the whole gate is Hermes policy.

**Related:** [[task-spec]] · [[default-deny]] · [[tool-loop]] · [[termination]] · [[port]]
