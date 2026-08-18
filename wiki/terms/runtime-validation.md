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

Checking that received bytes match a schema while the program runs. Static types cannot do this, because of [[type-erasure]]. In this course the tool is Zod. A parse at the [[json-boundary]] returns a typed value or a described failure.

**In [[lesson-0001-trace-one-request|lesson 0001]]:** named as the missing check. The [[sdk]] asserts its response types and checks no byte. [[lesson-0005-validate-the-boundary|Lesson 0005]] builds the check.

**Why it matters for Hermes:** every JSON boundary in the loop gets a schema. The TaskSpec, tool arguments, and evidence all enter through a parse. Hermes puts probabilistic output inside a deterministic, typed control system, and this check is the mechanism.

**Related:** [[type-erasure]] · [[json-boundary]] · [[zod-schema]] · [[safe-parse]] · [[model-gateway]]
