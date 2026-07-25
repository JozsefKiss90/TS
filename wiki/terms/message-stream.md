---
term: Message stream
aliases:
  - MessageStream
  - streaming helper
  - client.messages.stream()
type: glossary-term
lesson: "0004"
phase: 0
category: sdk-layer
status: introduced
introduced: 2026-07-25
tags:
  - glossary
  - sdk-layer
---

# Message stream

The SDK's high-level streaming surface: `client.messages.stream(params)` returns a `MessageStream` (declared in `lib/MessageStream.d.ts`) that runs the accumulation fold for you. `.on("text", (delta, snapshot) => …)` delivers each chunk *and* the running total; `finalMessage()` resolves to the assembled `Message`; `currentMessage` exposes the fold's state mid-flight; `abort()` / a `signal` in the [[request-options]] kills the process. It also filters transport noise — the wire's `ping` keep-alives never reach your code.

**In [[lesson-0004-the-response-becomes-a-process|lesson 0004]]:** part B's `finalMessage()` matches exercise 02's response exactly — except `_request_id: undefined`, because the object was assembled client-side and never traveled as one HTTP body; the id lives on `stream.request_id`. Layers own facts.

**Why it matters for Hermes:** the [[model-gateway]] must choose an altitude per need — the helper's fold for ordinary calls, raw events where the loop must react mid-flight (budget checks, tool-use fragments, abort decisions). Knowing what the helper absorbs is knowing what the gateway still owns.

**Related:** [[api-client]] · [[request-options]] · [[async-iterator]] · [[delta]] · [[cancellation]]
