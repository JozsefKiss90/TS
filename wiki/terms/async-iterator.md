---
term: Async iterator
aliases:
  - for await...of
  - AsyncIterable
type: glossary-term
lesson: "0004"
phase: 0
category: type-system
status: demonstrated
introduced: 2026-07-25
demonstrated: 2026-07-27
tags:
  - glossary
  - type-system
---

# Async iterator

JavaScript's shape for a sequence of values that arrive over time. An object implements `AsyncIterable` and is consumed with `for await (const item of source)`. A `Promise` is one future value. An async iterator is many, each awaited in turn. The SDK types its streaming surfaces this way: `create({ stream: true })` returns a `Stream<RawMessageStreamEvent>`. Each yielded event is a [[discriminated-union]] member you narrow on `event.type`, lesson 0001's `block.type` move one level up.

**In [[lesson-0004-the-response-becomes-a-process|lesson 0004]]:** Part A iterates the raw stream and logs the event order. TypeScript narrows `content_block_delta` to `text_delta` before `.text` is reachable.

**Why it matters for Hermes:** the Phase 1 loop consumes model output as a sequence of text deltas and tool-use fragments. This is the control structure under that loop. The rule in [[type-erasure]] still applies, so the union's claims are compile-time promises, not runtime checks.

**Related:** [[discriminated-union]] · [[narrowing]] · [[message-stream]] · [[delta]]
