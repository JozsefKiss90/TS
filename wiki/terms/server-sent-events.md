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

A plain-text format for pushing many events over one held-open HTTP response. Each event is an `event:` line naming a type and a `data:` line of JSON, separated by blank lines. The response carries `content-type: text/event-stream` and no `content-length`, because the total size is unknown while it is written. The Messages API streams this way. It is the same `POST /v1/messages`, answering in pieces.

**In [[lesson-0004-the-response-becomes-a-process|lesson 0004]]:** `stream: true` flips the mock from one JSON body to an event stream. Thirteen events cross in about 1.4 s, readable in both terminals. The auth and shape gates still answer in plain JSON before any stream begins.

**Why it matters for Hermes:** a loop that runs for minutes is only observable if the model's work arrives as it happens. This format is the transport under that observability. It is also the transport under the mid-stream [[cancellation]] that makes budgets enforceable.

**Related:** [[delta]] · [[message-stream]] · [[endpoint]] · [[messages-api]]
