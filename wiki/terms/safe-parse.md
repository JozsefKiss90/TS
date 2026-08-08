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

Non-throwing [[runtime-validation]]: `schema.safeParse(data)` returns a [[discriminated-union]] — `{ success: true, data }` with the validated, typed value, or `{ success: false, error }` with a `ZodError` whose `issues` array names **every** disagreement, each with a `path` into the value, a `code`, and a message. [[narrowing|Narrow]] on `result.success` — the same move as `block.type` (lesson 0001) and `event.type` (lesson 0004), now meaning *proof* vs *refusal*. The throwing sibling `.parse()` fits places where invalid means "stop the program" (own config at startup); `safeParse` fits every boundary where invalid is an expected outcome to classify.

**In [[lesson-0005-validate-the-boundary|lesson 0005]]:** one parse of the drifted body reported both lies at once (Zod collects; it does not stop at the first): `invalid_value` at `stop_reason`, `invalid_type` at `usage.output_tokens`. `z.prettifyError` renders the same issues for humans.

**Why it matters for Hermes:** the rejection is **data**, not an exception — loggable to a trace, showable to an operator, and S1's "rejected before a token is spent" arrives with machine-readable reasons. The loop must reject a job and keep supervising, not unwind its own stack.

**Related:** [[discriminated-union]] · [[narrowing]] · [[zod-schema]] · [[json-boundary]] · [[typed-error]]
