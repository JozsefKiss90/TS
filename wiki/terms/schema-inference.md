---
term: Schema inference
aliases:
  - z.infer
  - inferred type
type: glossary-term
lesson: "0005"
phase: 0
category: type-system
status: demonstrated
introduced: 2026-07-27
demonstrated: 2026-07-29
tags:
  - glossary
  - type-system
---

# Schema inference

`type Message = z.infer<typeof MessageSchema>` — deriving the **compile-time type from the runtime schema value**. `typeof MessageSchema` is TypeScript's type-level handle on the schema object; `z.infer` extracts the type of what a successful parse returns. This inverts the arrow of lessons 0001–0004: there the hand-written type came first and the bytes were [[type-assertion|asserted]] to match; here the schema is the single source of truth and the type is a view of it — so the claim and the check **cannot drift apart**, because they are one declaration.

**In [[lesson-0005-validate-the-boundary|lesson 0005]]:** Part C retires exercise 01's `MessageResponse` interface; the ledger recomputes from `result.data` with no `as` anywhere on the path, and the parsed value is stripped to the declared subset (measured: 9 wire keys → 7; `usage` 4 → 2).

**Why it matters for Hermes:** every Phase 1+ contract is written schema-first — TaskSpec, tool arguments, evidence — and its type derived. Two artifacts (interface + wire) with nothing holding them together is exactly the drift-shaped gap the control plane cannot afford.

**Related:** [[zod-schema]] · [[type-erasure]] · [[type-assertion]] · [[declaration-file]] · [[safe-parse]]
