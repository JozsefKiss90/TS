---
type: lesson-map
title: The Response Becomes a Process
lesson: "0004"
phase: 0
date: 2026-07-25
material: lessons/0004-the-response-becomes-a-process.html
lab: hermes-sdk-lab/03-streaming-and-cancellation
tags:
  - lesson-map
---

# Lesson 0004 — The Response Becomes a Process

Exercise 02's request gains one field, `stream: true`. The response becomes a process. Typed events arrive as [[server-sent-events]], an [[async-iterator]] consumes them, and the [[message-stream]] helper reassembles exercise 02's `Message`. [[cancellation]] gains a target mid-response. Material: [open the lesson](../../lessons/0004-the-response-becomes-a-process.html) · lab: `hermes-sdk-lab/03-streaming-and-cancellation/`.

## The streaming events, as the mock sends them

```mermaid
sequenceDiagram
    participant C as your client
    participant M as mock :8787
    C->>M: POST /v1/messages with stream: true
    Note over M: the auth and shape gates still answer plain JSON
    M-->>C: 200 text/event-stream, connection stays open
    M-->>C: message_start (a Message with empty content)
    M-->>C: ping (keep-alive, filtered by the SDK)
    M-->>C: content_block_start (index 0, an empty text block)
    loop 8 chunks, ~120 ms apart
        M-->>C: content_block_delta (text_delta, the next words)
    end
    M-->>C: content_block_stop (index 0)
    M-->>C: message_delta (stop_reason and final usage)
    M-->>C: message_stop, the response ends here
```

Measured: 13 events reach the client over ~1.4 s. The SDK filters the wire's `ping` out before iteration. Assemble every [[delta]] onto `message_start`'s value and the result is byte-for-byte the non-streaming `Message`. Streaming changes delivery. The response shape does not change.

## Responsibility ⑥ (cancellation), transformed

```mermaid
sequenceDiagram
    participant C as your code
    participant S as MessageStream
    participant M as mock :8787
    C->>S: client.messages.stream(params, { signal })
    S->>M: POST /v1/messages (stream: true)
    M-->>S: message_start · content_block_start
    M-->>S: delta "Hello from the mock."
    S-->>C: on("text"), 20 chars held
    M-->>S: delta " These bytes have the"
    S-->>C: on("text"), 41 chars held
    C->>S: controller.abort() at 700 ms
    S--xM: connection torn down
    Note over M: 6 remaining deltas are never sent
    S-->>C: throws APIUserAbortError, one attempt, no retry
```

Measured: the abort at 700 ms raises `APIUserAbortError` about 30 ms later. The client keeps 41 of 164 characters. The mock logs two of eight deltas, then the disconnect. The remainder is never generated, and against the real API never billed. That is what scenario step S6 (budget enforcement) uses to stop spend.

## What arrives when

- The counts `usage.input_tokens`, plus `id` and `model`, ride `message_start`: known before generating.
- The text arrives as [[delta]] patches, while generating.
- The [[stop-reason]] and the real `usage.output_tokens` ride `message_delta`, at the end.
- Mid-flight, a call's cost and ending are unknown.
- The value of `finalMessage()._request_id` is `undefined`. The id lives on `stream.request_id`.

## What the 2026-08-16 rewrite changed

The lesson went from 1,881 words and 21 errors to 1,993 words and 0, under `docs/style/ste-profile.md`. The em-dash asides, the bold-led bullets and the reader guidance were deleted. They paid for four `<dfn>` definitions, a new-vs-reprise callout, a status table, the bounded compression and a version pin. A layer table now keys the circled numbers. The word *contract* no longer names the response shape, per the 2026-08-08 rename.

## Terms introduced

[[server-sent-events]] · [[delta]] · [[async-iterator]] · [[message-stream]]

```dataview
TABLE term AS Term, category AS Category, status AS Status
FROM "wiki/terms"
WHERE type = "glossary-term" AND lesson = "0004"
SORT category ASC, term ASC
```
