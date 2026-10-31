---
term: cost report
aliases:
  - costReport
  - --cost-report
  - cost-report.json
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

# cost report

The time, tokens and dollars of one run, step by step, computed from its trace file.

`costReport` in lab 14 reads the events of one [[trace]] and a row of the price table. It returns one [[span]] per model call and one per tool run, plus totals. It writes nothing. A record with no `job_started` line returns `ok: false`, because it cannot say what ran.

The report then compares its totals with `job_ended`. If the two differ, it says `agrees: false`, and `--cost-report` exits 1. A call that was cut off has no reply line. Its tokens are the remainder of the job's total, marked `source: "remainder"`, and priced at the output rate as an upper bound.

**First used in [[lesson-0022-what-the-run-cost|lesson 0022]]:** on all seven recorded runs the report agrees with `job_ended`. The audit-atlas run costs $0.002765 as claude-opus-4-8. A test changes one reply by one token, and the sum becomes 218 against 217.

**In [[lesson-0024-landing-the-outputs|lesson 0024]]:** each landed [[artifact]] holds a `cost-report.json`, written before `artifact.json`.

**Why it matters for Hermes:** scenario step S8 (outputs land, linked to cost) links each output to its cost. Hermes's ceilings are in dollars, and this report is where tokens become dollars.

*A reference note: lessons use this phrase as ordinary English, with no definition. It carries no `lesson` id for that reason.*

**Related:** [[span]] · [[trace]] · [[budget-alert]] · [[artifact]] · [[partial-artifact]]
