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

Exercise 02's request with one field added — `stream: true` — against the same [[test-double]]: the response stops being a value and becomes a process. [[server-sent-events]] carry a typed event grammar, an [[async-iterator]] consumes it, the [[message-stream]] helper folds it back into the very `Message` exercise 02 received in one piece, and [[cancellation]] gains a target *mid-response*. Material: [open the lesson](../../lessons/0004-the-response-becomes-a-process.html) · lab: `hermes-sdk-lab/03-streaming-and-cancellation/`.

## The event grammar, as the mock plays it

```mermaid
sequenceDiagram
    participant C as your client
    participant M as mock :8787
    C->>M: POST /v1/messages — params + stream: true
    Note over M: same gates ②③④ — a 401/400 still arrives as plain JSON
    M-->>C: 200 text/event-stream — connection stays open
    M-->>C: message_start (a Message skeleton: content [], stop_reason null)
    M-->>C: ping (keep-alive — your loop never sees it)
    M-->>C: content_block_start (index 0, an empty text block)
    loop 8 chunks, ~120 ms apart
        M-->>C: content_block_delta (text_delta: the next words)
    end
    M-->>C: content_block_stop (index 0)
    M-->>C: message_delta (stop_reason + final usage — at last)
    M-->>C: message_stop — only NOW does the response end
```

Measured: 13 events reach the client over ~1.4 s; the wire's `ping` is filtered out by the SDK before iteration. The [[delta]] fold — skeleton + patches + retrofit — reassembles byte-for-byte the non-streaming `Message`: **streaming changes delivery, not the contract.**

## Responsibility ⑥, transformed

```mermaid
sequenceDiagram
    participant C as your code
    participant S as MessageStream
    participant M as mock :8787
    C->>S: client.messages.stream(params, { signal })
    S->>M: POST /v1/messages (stream: true)
    M-->>S: message_start · content_block_start
    M-->>S: delta "Hello from the mock."
    S-->>C: on("text") — 20 chars held
    M-->>S: delta " These bytes have the"
    S-->>C: on("text") — 41 chars held
    C->>S: controller.abort() — 700 ms in
    S--xM: connection torn down
    Note over M: 6 remaining deltas are NEVER sent
    S-->>C: throws APIUserAbortError (1 attempt — user aborts are never retried)
```

Measured: abort at 700 ms → `APIUserAbortError` ~30 ms later; the client keeps 41 of 164 characters; the mock logs 2 of 8 deltas then *client aborted the request mid-flight*. The remainder is never generated — against the real API, never billed. [[cancellation]] graduated from a hang-up lever to a **cost** lever, which is what makes Hermes's budgets enforceable.

## Order of knowledge

- `usage.input_tokens`, `id`, `model` — in the **skeleton**: known before generating.
- The text — as [[delta]] patches, while generating.
- [[stop-reason]] and the real `usage.output_tokens` — in `message_delta`, at the **end**: mid-flight, cost and ending are unknown.
- `finalMessage()._request_id` is `undefined` — the assembled object never traveled as one HTTP body; the id lives on `stream.request_id`. Layers own facts.

## Terms introduced

[[server-sent-events]] · [[delta]] · [[async-iterator]] · [[message-stream]]

```dataview
TABLE term AS Term, category AS Category, status AS Status
FROM "wiki/terms"
WHERE type = "glossary-term" AND lesson = "0004"
SORT category ASC, term ASC
```
