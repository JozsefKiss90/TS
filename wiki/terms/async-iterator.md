---
term: Async iterator
aliases:
  - for await...of
  - AsyncIterable
type: glossary-term
lesson: "0004"
phase: 0
category: type-system
status: introduced
introduced: 2026-07-25
tags:
  - glossary
  - type-system
---

# Async iterator

JavaScript's shape for "a sequence of values that arrive over time": an object implementing `AsyncIterable`, consumed with `for await (const item of source)`. Where a `Promise` is one future value, an async iterator is many — each `await`ed in turn. The SDK's streaming surfaces are typed this way: `create({ stream: true })` returns a `Stream<RawMessageStreamEvent>`, and each yielded event is a [[discriminated-union]] member you narrow on `event.type` — lesson 0001's `block.type` skill, one level up.

**In [[lesson-0004-the-response-becomes-a-process|lesson 0004]]:** part A iterates the raw stream and logs the event order; TypeScript narrows `content_block_delta` → `text_delta` before `.text` is reachable, exactly as `noUncheckedIndexedAccess` forced care in exercise 01.

**Why it matters for Hermes:** the Phase 1 loop consumes model output *as a sequence* — text deltas, tool-use JSON fragments, thinking. `for await` over typed events is the control structure the loop is built on; [[type-erasure]] still applies, so what the union claims about each event is a compile-time promise, not a runtime check.

**Related:** [[discriminated-union]] · [[narrowing]] · [[message-stream]] · [[delta]]
