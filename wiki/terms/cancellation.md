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

Stopping an in-flight request on purpose. The standard JavaScript mechanism is `AbortController`. Pass its `signal` to `fetch` or to the [[sdk]]'s request options, then call `controller.abort()`. The transport closes the connection, and the pending promise rejects. Without a signal, an unanswered request holds resources until a timeout, or holds them forever.

**In [[lesson-0001-trace-one-request|lesson 0001]]:** cancellation is responsibility ⑥ of the six. The same `signal` works in both snippets, and the SDK passes it through to its transport.

**Why it matters for Hermes:** budgets, timeouts, iteration limits and approval gates are enforceable only if every model call has a working cancel path. `AbortController` is that path in TypeScript. Scenario step S6 (budget limits) depends on it.

**Related:** [[sdk]] · [[retry-with-backoff]] · [[model-gateway]]
