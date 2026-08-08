---
term: Server-sent events
aliases:
  - SSE
  - event stream
  - text/event-stream
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

# Server-sent events

A plain-text format for a server to push a sequence of events over one held-open HTTP response: each event is an `event:` line naming a type and a `data:` line of JSON, separated by blank lines. The response carries `content-type: text/event-stream` and no `content-length` — the total size is unknown while it is being written. This is how the Messages API streams: not a different [[api]], the same `POST /v1/messages` answering in pieces.

**In [[lesson-0004-the-response-becomes-a-process|lesson 0004]]:** `stream: true` flips the mock from one JSON body to an SSE stream — `message_start` → deltas → `message_stop` over ~1.4 s, watchable in both terminals. The gates ②③④ still answer in plain JSON *before* any stream begins.

**Why it matters for Hermes:** a loop that runs for minutes is only observable if the model's work arrives as it happens. SSE is the transport under that observability — and under the mid-stream [[cancellation]] that makes budgets enforceable rather than advisory.

**Related:** [[delta]] · [[message-stream]] · [[endpoint]] · [[messages-api]]
