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
status: demonstrated
introduced: 2026-07-25
demonstrated: 2026-07-27
tags:
  - glossary
  - protocol
---

# Delta

An incremental patch against a message that is still being assembled. The stream opens with `message_start`, a `Message` whose `content` is empty and whose `stop_reason` is null. Then `content_block_delta` events patch text into the open block, a few words at a time. Last, `message_delta` adds the two facts only knowable after generation: `stop_reason` and the real `usage.output_tokens`. Assemble all of it and you hold the `Message` the non-streaming path returns in one piece.

**In [[lesson-0004-the-response-becomes-a-process|lesson 0004]]:** the mock's fixture arrives as 8 `text_delta` chunks about 120 ms apart. The assembled result is byte-for-byte exercise 02's response. Input cost arrives first, output cost and ending last.

**Why it matters for Hermes:** the numbers a budget enforces arrive in the last events. Mid-flight, a call's cost and ending are unknown. Loop accounting must wait for `message_delta`, or abort and accept a partial with no [[stop-reason]].

**Related:** [[server-sent-events]] · [[message-stream]] · [[stop-reason]] · [[discriminated-union]]
