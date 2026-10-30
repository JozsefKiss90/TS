---
term: OTLP
aliases:
  - OpenTelemetry Protocol
type: glossary-term
lesson: "0023"
phase: 4
category: protocol
status: introduced
introduced: 2026-10-30
tags:
  - glossary
  - protocol
---

# OTLP

OpenTelemetry's wire format for sending spans to a trace viewer.

OTLP has a protobuf form and a JSON form, sent over HTTP or gRPC. Over HTTP, an exporter sends `POST /v1/traces`, with `Content-Type: application/json` for the JSON form. In the JSON form, a trace id is 32 hex characters and a span id is 16. Times are nanoseconds since the epoch, written as strings. Each attribute is a `{ key, value }` pair with a typed value, such as `intValue`. Span kind is a number one higher than the API's enum, so `CLIENT` is 3.

**In [[lesson-0023-opentelemetry-evaluated|lesson 0023]]:** lab 15 builds the OTLP/HTTP JSON body offline and prints it with `pnpm job --otlp`. Nothing is sent. For audit-atlas the body is 3,733 bytes, from a 1,268-byte trace file.

**Why it matters for Hermes:** [[architecture-decision-record|ADR 0002]] adopts OTLP as Hermes's export format. Phoenix, the trace viewer Hermes OS names, accepts traces over OTLP. The [[trace]] file stays the record.

**Related:** [[exporter]] · [[span]] · [[semantic-convention]] · [[json-lines]]
