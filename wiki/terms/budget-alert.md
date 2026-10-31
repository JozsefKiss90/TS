---
term: budget alert
aliases:
  - 80% alert
  - alertThreshold
type: glossary-term
lesson: ""
first_used: "0022"
phase: 4
category: hermes
status: introduced
introduced: 2026-10-30
tags:
  - glossary
  - hermes
---

# budget alert

A note that a job's spend has reached 80% of its ceiling, before the ceiling stops it.

Lab 07's supervisor writes the alert into `job_ended.notes` as a string, with no call number. The tight budget's note says only "estimated spend passed 80% of 190". The supervisor checks an estimate while a call runs.

The [[cost-report]] places the alert at a call. It adds each call's tokens in order and finds the first call whose total reaches the line. For a ceiling of 190 tokens the line is 152. The tight budget reaches 191 at call 2, so the alert sits there.

**First used in [[lesson-0022-what-the-run-cost|lesson 0022]]:** on all seven recordings, the report places an alert where `job_ended` noted one. The tight budget's placement rests on an estimated remainder, and the report marks it `estimated: true`.

**In [[lesson-0023-opentelemetry-evaluated|lesson 0023]]:** the alert travels as an event inside a [[span]].

**Why it matters for Hermes:** scenario step S6 (the budget stops a run) needs to say which call crossed the line. Hermes OS accepts job ceilings in dollars with an alert at 80% (ADR-0007).

*A reference note: lessons use this phrase as ordinary English, with no definition. It carries no `lesson` id for that reason.*

**Related:** [[cost-report]] · [[span]] · [[termination]] · [[trace]]
