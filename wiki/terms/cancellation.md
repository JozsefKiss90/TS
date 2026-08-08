---
term: Cancellation
aliases:
  - AbortController
  - AbortSignal
type: glossary-term
lesson: "0001"
phase: 0
category: sdk-layer
status: demonstrated
introduced: 2026-07-23
demonstrated: 2026-07-27
tags:
  - glossary
  - sdk-layer
---

# Cancellation

Stopping an in-flight request on purpose. The standard JavaScript mechanism is `AbortController`: pass its `signal` to `fetch` or to the [[sdk]]'s request options, call `controller.abort()`, and the transport tears the request down. Without it, an unanswered request holds resources until a timeout — or forever.

**In [[lesson-0001-trace-one-request|lesson 0001]]:** responsibility ⑥ of the six — the same `signal` works in both snippets; the SDK plumbs it through to its transport.

**Why it matters for Hermes:** the autonomy boundary (budgets, timeouts, iteration limits, approval gates) is only enforceable if every model call has a working cancel path. `AbortController` is that path in TypeScript.

**Related:** [[sdk]] · [[retry-with-backoff]] · [[model-gateway]]
