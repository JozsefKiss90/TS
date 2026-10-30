---
term: semantic convention
aliases:
  - semconv
  - GenAI semantic conventions
  - gen_ai.*
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

# semantic convention

A published list of attribute names and values, so that viewers read one span the same way.

The OpenTelemetry GenAI conventions name model calls and tool runs: `gen_ai.operation.name`, `gen_ai.request.model`, `gen_ai.usage.input_tokens`, `gen_ai.tool.name` and others. A model call's span is named after the operation and the model, such as `chat claude-opus-4-8`. On 2026-10-30 every GenAI attribute and document had status Development, so a name can change without a major version.

**In [[lesson-0023-opentelemetry-evaluated|lesson 0023]]:** lab 15 uses 8 `gen_ai.*` names and 22 `hermes.*` names, all as strings in `conventions.ts`. No convention covers dollars, the [[context-pack|Context Pack]], or the gate's decision. A cut-off call carries no `gen_ai.usage.*`, because the provider never reported its tokens. A rename passes the round-trip test, so one test names the expected strings.

**Why it matters for Hermes:** scenario step S7 (the durable record) is exported with these names. They are the part of [[architecture-decision-record|ADR 0002]] most likely to change.

**Related:** [[otlp]] · [[span]] · [[exporter]]
