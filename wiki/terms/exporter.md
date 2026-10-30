---
term: exporter
aliases:
  - span exporter
  - InMemorySpanExporter
type: glossary-term
lesson: "0023"
phase: 4
category: sdk-layer
status: introduced
introduced: 2026-10-30
tags:
  - glossary
  - sdk-layer
---

# exporter

The SDK object that receives ended spans and sends them somewhere.

In OpenTelemetry JS a tracer starts spans, a processor receives each one when it ends, and the processor hands it to an exporter. `InMemorySpanExporter` keeps them in an array, which `getFinishedSpans()` returns. A simple processor exports each span at once. A batch processor holds them until a timer or `forceFlush()`.

**In [[lesson-0023-opentelemetry-evaluated|lesson 0023]]:** lab 15 emits lab 14's [[span|spans]] into an in-memory exporter, reads them back, and tests them equal on all seven recorded runs. Swap in a batch processor and 23 of 26 tests fail, because the exporter is still empty when the tests read it.

**Why it matters for Hermes:** scenario step S7 (the durable record) stays the [[trace]] file. An exporter only carries a view of it, computed after the run, to a viewer such as Phoenix.

**Related:** [[span]] · [[otlp]] · [[trace]] · [[architecture-decision-record]]
