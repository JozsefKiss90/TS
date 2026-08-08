---
term: JSON boundary
aliases:
  - boundary
  - the boundary rule
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

# JSON boundary

The seam where serialized bytes enter (or leave) your typed code — an HTTP response body, a model's output, a tool result, a config file, a CLI argument. Inside the boundary, [[type-erasure|erased static types]] carry guarantees the compiler already enforced; **at** the boundary there is only `unknown`, and every claim about shape must be proven by [[runtime-validation]]. The boundary rule: validate once where bytes enter, trust the types inside — not everywhere, not never, exactly at the edge.

**In [[lesson-0005-validate-the-boundary|lesson 0005]]:** the mock's drift scenario shows what an unguarded boundary costs — a 200 whose body quietly stopped matching the types crossed `JSON.parse` and the `as` assertion untouched, and surfaced as a corrupt budget ledger (`"1142"` claimed vs 53 actual tokens), far from the boundary that let it in.

**Why it matters for Hermes:** every guarantee Hermes OS makes is enforced at one of these seams — the Job Envelope (S1), the Context Pack (S2), tool arguments and results (S5), model output throughout. "No envelope, no dispatch" *is* a parse at a JSON boundary. The Python/TypeScript border is itself one.

**Related:** [[runtime-validation]] · [[type-erasure]] · [[zod-schema]] · [[safe-parse]] · [[request-contract]]
