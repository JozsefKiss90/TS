---
term: Zod schema
aliases:
  - schema (Zod)
  - z.object
  - ZodObject
type: glossary-term
lesson: "0005"
phase: 0
category: validation
status: demonstrated
introduced: 2026-07-27
demonstrated: 2026-07-29
tags:
  - glossary
  - validation
---

# Zod schema

A **runtime value** that encodes a shape: built by calling factory functions (`z.object`, `z.string`, `z.enum`, …) and held as an object instance (`ZodObject`) that survives compilation — the exact thing an `interface` is not. It checks what static types only claim, composes like any value (`usage: UsageSchema`), and can carry *more* contract than a type: `z.enum(["end_turn", …])` where the old interface said only `string`. Not to be confused with **JSON Schema**, the serialized description standard (Phase 2's MCP tools declare inputs with it) — same word, different artifact.

**In [[lesson-0005-validate-the-boundary|lesson 0005]]:** `MessageSchema` (zod 4.4.3, pinned) catches both of the mock's drifts — a string `output_tokens` and a misspelled `stop_reason` — in one [[safe-parse]] at the [[json-boundary]], where exercise 01's hand-written interface caught neither. The mock's own gate ④ `if`-checks (exercise 01) were this, hand-rolled.

**Why it matters for Hermes:** every Hermes contract from Phase 1 on is one — the TaskSpec/Job Envelope (S1), evidence with provenance (S2), tool arguments (S5). Admissibility checking *is* running one of these against untrusted bytes.

**Related:** [[runtime-validation]] · [[safe-parse]] · [[schema-inference]] · [[json-boundary]] · [[type-erasure]]
