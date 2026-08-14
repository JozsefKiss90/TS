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

The compile-time type derived from the runtime schema value, written `type Message = z.infer<typeof MessageSchema>`. TypeScript reads `typeof MessageSchema` as a handle on the schema object. The query then extracts the type a successful parse returns.

This inverts the arrow of lessons 0001 to 0004. There the hand-written type came first, and the bytes were [[type-assertion|asserted]] to match. Here the schema is the single source of truth, and the type is a view of it. The claim and the check cannot drift apart, because they are one declaration.

**In [[lesson-0005-validate-the-boundary|lesson 0005]]:** Part C retires exercise 01's `MessageResponse` interface. The ledger recomputes from `result.data` with no `as` on the path. The parsed value is stripped to the declared subset, measured at 9 wire keys and 7 across the boundary.

**Why it matters for Hermes:** every agreement from Phase 1 on is written schema first, with the type derived. The TaskSpec, tool arguments and evidence all work this way. Two artifacts with nothing holding them together is the gap the control plane cannot afford.

**Related:** [[zod-schema]] · [[type-erasure]] · [[type-assertion]] · [[declaration-file]] · [[safe-parse]]
