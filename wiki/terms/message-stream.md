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
status: demonstrated
introduced: 2026-07-25
demonstrated: 2026-07-27
tags:
  - glossary
  - sdk-layer
---

# Message stream

The SDK's high-level streaming surface. The call `client.messages.stream(params)` returns a `MessageStream`, declared in `lib/MessageStream.d.ts`, which assembles the streamed events into a `Message` for you. The `.on("text", (delta, snapshot) => …)` listener delivers each chunk and the running total. `finalMessage()` resolves to the assembled `Message`. `currentMessage` exposes the partly assembled value mid-flight. An `abort()` call, or a `signal` in the [[request-options]], stops the process. The helper also filters transport noise, so the wire's `ping` keep-alives never reach your code.

**In [[lesson-0004-the-response-becomes-a-process|lesson 0004]]:** Part B's `finalMessage()` matches exercise 02's response, except `_request_id: undefined`. That object was assembled client-side and never traveled as one HTTP body. The id lives on `stream.request_id`.

**Why it matters for Hermes:** the [[model-gateway]] chooses a surface per need: the helper for whole answers, raw events where the loop must react mid-flight. Since lesson 0009 the adapter streams every call, so a bound can stop a reply that is still being written.

**Related:** [[api-client]] · [[request-options]] · [[async-iterator]] · [[delta]] · [[cancellation]]
