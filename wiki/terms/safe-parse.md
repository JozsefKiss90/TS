---
term: Safe parse
aliases:
  - safeParse
  - ZodSafeParseResult
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

# Safe parse

[[runtime-validation]] that returns its verdict instead of throwing. `schema.safeParse(data)` returns a [[discriminated-union]] with two arms. On success you get `{ success: true, data }`, carrying the validated, typed value. On failure you get `{ success: false, error }`, where the `ZodError` holds an `issues` array. Each issue names one disagreement, with a `path` into the value, a `code` and a message. You [[narrowing|narrow]] on `result.success`, the same move as `block.type` in lesson 0001 and `event.type` in lesson 0004.

The throwing sibling `.parse()` suits places where invalid means stop the program, such as reading your own config at startup. Use `safeParse` where invalid input is an expected outcome.

**In [[lesson-0005-validate-the-boundary|lesson 0005]]:** one parse of the drifted body reported both lies at once. Zod collects and does not stop at the first. It found `invalid_value` at `stop_reason` and `invalid_type` at `usage.output_tokens`. `z.prettifyError` renders the same issues for a human.

**Why it matters for Hermes:** the refusal is data rather than an exception. It can go to a trace or to an operator. Step S1 (the envelope is parsed) rejects work before a token is spent, with machine-readable reasons. The loop must refuse a job and keep supervising, not unwind its own stack.

**Related:** [[discriminated-union]] · [[narrowing]] · [[zod-schema]] · [[json-boundary]] · [[typed-error]]
