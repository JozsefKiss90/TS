---
term: trace
aliases:
  - job trace
type: glossary-term
lesson: "0011"
phase: 1
category: hermes
status: introduced
introduced: 2026-08-25
tags:
  - glossary
  - hermes
---

# trace

The durable, append-only record of one job's events, written as each event happens.

The trace answers one question: what happened. It grants nothing and decides nothing. Deleting it changes no future decision, and editing it cannot approve a tool. Policy lives in the [[task-spec]], and the trace only records which policy fired.

The record is written at the moment, not at the end. A summary written on exit dies with a crash. A trace written per event keeps the story up to the cut, and a missing final event is itself a finding.

**In [[lesson-0011-the-trace-is-what-happened|lesson 0011]]:** `trace.ts` holds the event vocabulary as one Zod schema and the `TracePort` the supervisor appends through. The file is [[json-lines|JSON Lines]], one event per line. Reading it back is a parse, and a resumed job is rebuilt from the file alone.

**Why it matters for Hermes:** scenario step S7 (the durable trace) is this record. It is the third of the course's three separated records: what Hermes knows, what it may do, and what it did.

**Related:** [[json-lines]] · [[task-spec]] · [[partial-artifact]] · [[artifact-vault]] · [[port]] · [[approval-gate]]
