---
term: OpenTelemetry
aliases:
  - OpenTelemetry JS
  - OTel
  - Tracer
  - TracerProvider
type: glossary-term
lesson: ""
first_used: "0023"
phase: 4
category: sdk-layer
status: introduced
introduced: 2026-10-30
tags:
  - glossary
  - sdk-layer
---

# OpenTelemetry

A vendor-neutral standard for traces, with an SDK per language.

The object path has five steps. Import the classes, construct a `TracerProvider`, ask it for a `Tracer`, start a span, and end it. The interface lives in `@opentelemetry/api`, and the work lives in the SDK. An ended span goes to a processor, which hands it to an [[exporter]].

Three words mean something else here than in the course. An OpenTelemetry trace is the spans that share one `traceId`, not a JSON Lines file. Its span carries ids, a parent, times and attributes. Its event is a named, timed note inside a span.

**First used in [[lesson-0023-opentelemetry-evaluated|lesson 0023]]:** lab 15 hands lab 14's [[span|spans]] to the library and reads them back equal on all seven recorded runs. A replayed span must pass its recorded start and end times. Verified against `@opentelemetry/api` 1.9.1 and `@opentelemetry/sdk-trace` 2.12.0.

**Why it matters for Hermes:** [[architecture-decision-record|ADR 0002]] adopts [[otlp|OTLP]] as the export format and keeps the [[trace]] file as the record. Phoenix, the trace viewer Hermes OS names, accepts OTLP.

*A reference note: a product name, used in lessons with no definition. It carries no `lesson` id for that reason.*

**Related:** [[exporter]] · [[otlp]] · [[semantic-convention]] · [[span]] · [[trace]]
