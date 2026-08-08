---
term: Hermes policy
aliases:
  - policy
  - decision rule
type: glossary-term
lesson: "0006a"
phase: 1
category: hermes
status: introduced
introduced: 2026-07-29
tags:
  - glossary
  - hermes
---

# Hermes policy

A **deterministic rule that converts validated facts** — about a task, the loop's state, or an external result — **into a permitted next action or a terminal outcome**. Same facts, same decision, every time; nothing enters a rule unvalidated; the output is always an allowed action or terminal state, never an unwound exception. The word earns its keep by excluding its neighbours: object construction is [[composition-root|wiring]], vocabulary translation is [[adapter|adaptation]], Zod parsing is boundary [[runtime-validation|validation]], and the SDK's automatic retry is transport mechanics.

**In supplement [0006a](../../lessons/0006a-hermes-architecture-primer.html):** exercise 05's only policy is `superviseOneCall` in `supervisor.ts` — a *policy seed*: throttled → `retry_later`, malformed reply → `gave_up` with zero tokens booked, success → `landed` with validated usage ledgered. Routing, budgets, permissions, and the trace are policies that do not exist yet ([[routing-policy]], lessons 0009–0011 provisional).

**Why it matters for Hermes:** the whole course's guiding principle — *probabilistic reasoning inside a deterministic control system* — makes policy the deterministic half. S4's "above it: Hermes policy" is only meaningful once policy is this narrow, operational thing.

**Related:** [[model-gateway]] · [[port]] · [[adapter]] · [[fake]] · [[composition-root]] · [[routing-policy]]
