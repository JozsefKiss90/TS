---
term: Delta
aliases:
  - content_block_delta
  - text_delta
  - streaming event grammar
type: glossary-term
lesson: "0004"
phase: 0
category: protocol
status: introduced
introduced: 2026-07-25
tags:
  - glossary
  - protocol
---

# Delta

An incremental patch against a message under construction. The streaming grammar opens with a `Message` **skeleton** (`message_start`: id, model, `usage.input_tokens` — but `content: []`, `stop_reason: null`), then `content_block_delta` events patch text into the open block a few words at a time, and `message_delta` retrofits the two facts only knowable after generation: `stop_reason` and the real `usage.output_tokens`. Fold skeleton + deltas + retrofit together and you hold exactly the `Message` the non-streaming path returns in one piece.

**In [[lesson-0004-the-response-becomes-a-process|lesson 0004]]:** the mock's fixture text arrives as 8 `text_delta` chunks ~120 ms apart; the assembled result is byte-for-byte exercise 02's response. Order of knowledge is the lesson: input cost first, output cost and ending last.

**Why it matters for Hermes:** the numbers a budget enforces on arrive in the *last* events — mid-flight, a call's cost and ending are unknown. Loop accounting must either wait for `message_delta` or kill the stream and accept a partial with no [[stop-reason]].

**Related:** [[server-sent-events]] · [[message-stream]] · [[stop-reason]] · [[discriminated-union]]
