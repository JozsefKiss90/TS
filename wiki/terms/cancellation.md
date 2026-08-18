---
term: Cancellation
aliases:
  - AbortController
  - AbortSignal
type: glossary-term
lesson: "0003"
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

Stopping an in-flight request on purpose. The standard JavaScript mechanism is `AbortController`. Pass its `signal` to `fetch` or to the [[sdk]]'s request options, then call `controller.abort()`. The transport closes the connection, and the pending promise rejects. Without a signal, an unanswered request holds resources until a timeout, or holds them forever.

**First seen in [[lesson-0001-trace-one-request|lesson 0001]]** as responsibility ⑥. The same `signal` works in raw `fetch` and in the SDK's request options. **In [[lesson-0003-the-sdk-absorbs-the-six|lesson 0003]]:** measured. An abort raises `APIUserAbortError` after one attempt, and it is never retried.

**Why it matters for Hermes:** budgets, timeouts, iteration limits and approval gates are enforceable only if every model call has a working cancel path. `AbortController` is that path in TypeScript. Scenario step S6 (budget limits) depends on it.

**Related:** [[sdk]] · [[retry-with-backoff]] · [[model-gateway]]
