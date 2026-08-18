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

The seam where serialized bytes enter or leave your typed code. An HTTP response body, a model's output, a tool result, a config file and a CLI argument are all boundaries. Inside one, [[type-erasure|erased static types]] carry what the compiler already checked. At one there is only `unknown`, and every claim about shape needs [[runtime-validation]]. The rule: parse once where bytes enter, then trust the types inside.

**In [[lesson-0005-validate-the-boundary|lesson 0005]]:** the mock's drift scenario measures what an unguarded boundary costs. A 200 whose body stopped matching the types crossed `JSON.parse` and the `as` assertion untouched. It surfaced far away, as a ledger claiming 1142 tokens against 53 spent.

**Why it matters for Hermes:** every guarantee Hermes OS makes is enforced at one of these seams. The Job Envelope is one, at step S1 (the envelope is parsed). The Context Pack is another, at S2 (evidence is checked). Tool arguments and results are two more, at S5 (the loop iterates). "No envelope, no dispatch" is a parse at a JSON boundary.

**Related:** [[runtime-validation]] · [[type-erasure]] · [[zod-schema]] · [[safe-parse]] · [[request-and-response-shape]]
