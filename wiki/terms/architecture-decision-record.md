---
term: architecture decision record
aliases:
  - ADR
  - decision record
type: glossary-term
lesson: "0021"
phase: 3
category: hermes
status: introduced
introduced: 2026-10-30
tags:
  - glossary
  - hermes
---

# architecture decision record

A short file that records one design decision: the options, the evidence, the choice, and when to revisit it.

The abbreviation is ADR. A decision record is written once and not rewritten. A later decision that changes it gets its own record and names the one it replaces.

Hermes OS keeps its own records, ADR-0001 to ADR-0021, in the `hermes-os` repo. This course keeps its records in `docs/adr/`. The two numberings are separate.

**In [[lesson-0021-the-spec-decides-the-graph|lesson 0021]]:** `docs/adr/0001-skip-langgraph-js-keep-the-port.md` weighs adopt, wrap and skip for LangGraph.js against lessons 0018 to 0021's measurements. It decides skip, and it keeps lab 12's `runGraph` signature as the place a later engine plugs in.

**Why it matters for Hermes:** the Hermes OS promotion model asks for a signed ADR before an architecture change. The course applies the same rule to its own framework choice.

**Related:** [[job-graph]] · [[workflow-graph]] · [[port]] · [[checkpointer]] · [[graph-interpreter]]
