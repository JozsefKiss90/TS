---
term: Admissibility check
aliases:
  - admissibility
  - admitTaskSpec
type: glossary-term
lesson: "0007"
phase: 1
category: hermes
status: demonstrated
introduced: 2026-08-08
demonstrated: 2026-08-15
tags:
  - glossary
  - hermes
---

# Admissibility check

The parse that decides whether Hermes may dispatch a job. It answers with the admitted value or with reasons, and it never throws.

The check is one [[safe-parse]] call plus a formatter for its issues. What makes it a gate rather than a helper is the type it produces. Downstream code asks for that type, so a caller cannot skip the check and still compile.

**In [[lesson-0007-the-taskspec-is-a-contract|lesson 0007]]:** `admitTaskSpec(raw: unknown)` returns `{ admitted: true, spec }` or `{ admitted: false, rejections }`. Part B measured the cost of a refusal. Two bad files produced four rejections, the fake recorded no calls, and the mock's request counter did not move.

**Why it matters for Hermes:** S1 (the envelope is parsed) rejects an invalid job before a token is spent. Step S2 (evidence is checked) applies the same check to an assembled [[context-pack]]. Both guarantees are one parse at a [[json-boundary]].

**Related:** [[task-spec]] · [[schema-refinement]] · [[safe-parse]] · [[runtime-validation]] · [[job-envelope]] · [[discriminated-union]]
