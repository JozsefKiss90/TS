---
term: promotion
type: glossary-term
lesson: "0027"
phase: 4
category: hermes
status: introduced
introduced: 2026-10-31
tags:
  - glossary
  - hermes
---

# promotion

The act that replaces the baseline. It needs ten consecutive clean runs and an accepted ADR that names the benchmark's hash.

The Hermes OS README, Guarantees, says promotion requires at least ten consecutive clean runs plus a signed ADR. No Hermes PDR or ADR states the number. Lab 16's `promote` applies the rule to the course's [[baseline]]. A run is clean when it has no [[regression]] and writes the same bytes as run 1.

**In [[lesson-0027-the-regression-gate|lesson 0027]]:** the real loop passed ten runs and became the baseline under ADR 0003. `drops-the-pack-after-200` passed two runs and was refused on run 3.

**Why it matters for Hermes:** S9 (score the run). The integration scenario plans the same rule for blueprints, autonomy levels and architecture changes. That claim is illustrative only. On a seeded fake, ten runs show that no state leaks between runs. They show nothing about a model.

**Related:** [[baseline]] · [[regression-gate]] · [[pass-hat-k]] · [[benchmark]]
