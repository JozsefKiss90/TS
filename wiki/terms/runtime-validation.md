---
term: Runtime validation
aliases:
  - schema validation
type: glossary-term
lesson: "0001"
phase: 0
category: validation
status: demonstrated
introduced: 2026-07-23
demonstrated: 2026-07-29
tags:
  - glossary
  - validation
---

# Runtime validation

Checking that actual bytes match an expected schema **while the program runs** — what [[type-erasure|erased static types]] cannot do. In this curriculum the tool is Zod: parse untrusted JSON at every boundary and get a typed value or a described failure.

**In [[lesson-0001-trace-one-request|lesson 0001]]:** named as the missing piece — the [[sdk]] *asserts* its response types; nothing *checks* them. For SDK responses that's a reasonable bet; for model-**generated** data (tool arguments, task specs, retrieved evidence) it is not.

**Why it matters for Hermes:** the guiding principle in one mechanism — *put probabilistic reasoning inside a deterministic, typed, observable control system*. Every JSON boundary in the loop (TaskSpec in, tool args in, evidence in) gets a schema. Dedicated lesson coming; promoted here only once used in anger.

**Related:** [[type-erasure]] · [[request-contract]] · [[model-gateway]] · [[sdk]]
