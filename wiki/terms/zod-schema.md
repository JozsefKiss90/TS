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

A runtime value that encodes a shape. You build one by calling factory functions such as `z.object`, `z.string` and `z.enum`. The result is an object instance that survives compilation, which is what an `interface` never does. It checks what a static type only claims, and it composes like any other value, as in `usage: UsageSchema`. It can also hold rules a type cannot state: `z.enum(["end_turn", …])` where the old interface said only `string`.

A Zod schema is not **JSON Schema**, the serialized description that travels between programs. Phase 2's MCP tools declare their inputs with that one.

**In [[lesson-0005-validate-the-boundary|lesson 0005]]:** `MessageSchema`, against zod 4.4.3, catches both of the mock's drifts in one [[safe-parse]] at the [[json-boundary]]. Exercise 01's hand-written interface caught neither. The mock's own gate ④ `if` checks were this, hand-rolled.

**Why it matters for Hermes:** every Hermes agreement from Phase 1 on is one of these. The TaskSpec is a schema, at step S1 (the envelope is parsed). Evidence with provenance is a schema, at S2 (evidence is checked). Tool arguments are a schema, at S5 (the loop iterates). Admissibility checking is one of these run against untrusted bytes.

**Related:** [[runtime-validation]] · [[safe-parse]] · [[schema-inference]] · [[json-boundary]] · [[type-erasure]]
