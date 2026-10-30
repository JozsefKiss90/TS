---
term: span
aliases:
  - ModelSpan
  - ToolSpan
type: glossary-term
lesson: "0022"
phase: 4
category: hermes
status: introduced
introduced: 2026-10-30
tags:
  - glossary
  - hermes
---

# span

One timed step of a run: when it started, when it ended, and what it used.

A span is computed from two [[trace]] lines, a start line and an end line. A model call runs from `call_started` to the `reply` with the same call number. A call that was cut off has no reply, so it ends at `job_ended`. A tool run goes from its `gate` line to its `tool_result`. A wait for a human verdict sits inside the tool span as `heldMs`.

A span is a view of the trace and never a second record. Delete every span and nothing is lost, because `costReport` computes them again from the same lines.

**In [[lesson-0022-what-the-run-cost|lesson 0022]]:** the audit-atlas run has three spans. Call 1 takes 1,654 ms and 65 tokens, the tool takes 1 ms, and call 2 takes 1,013 ms and 152 tokens. Priced as claude-opus-4-8, the run costs $0.002765. On all seven recorded runs the spans sum to `job_ended`'s totals.

**Why it matters for Hermes:** scenario step S7 (the durable record) is what spans are read from. Step S6 (budget enforcement) gets its 80% alert placed at a span. Hermes's ceilings are in dollars, and a span is where tokens become dollars.

**Related:** [[trace]] · [[json-lines]] · [[partial-artifact]] · [[context-pack]] · [[parked-run]]
