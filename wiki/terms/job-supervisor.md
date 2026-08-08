---
term: Job Supervisor
aliases:
  - supervisor
type: glossary-term
lesson: "0006b"
phase: 1
category: hermes
status: introduced
introduced: 2026-07-30
tags:
  - glossary
  - hermes
---

# Job Supervisor

The control-plane component that **owns the job lifecycle**: state transitions, the next permitted action, and — alone — **whole-job completion** judged against the [[job-envelope|envelope's]] completion condition, consuming harness verdicts and (on mutating paths) operator approval as inputs. It must not own provider-specific mechanics or implementation. Status, honestly: **accepted as a named Hermes role** (PDR-001 §3 — "scheduler, memory layer, model router, job supervisor, messaging surface"), **absent as a specified component** — no ADR enumerates its state machine (the ADR-0018 gap; 0006b's lifecycle is a *proposed clarification* and a recommended open decision).

**In supplement [0006b](../../lessons/0006b-the-hermes-control-plane.html):** every other component acts inside one state at the supervisor's instruction and reports facts back; gateways return classified results, never job outcomes. Exercise 05's `superviseOneCall` ([[hermes-policy]]) is this role's one-call course seed — the same throttled-means-park decision, one lifecycle instead of one call.

**Why it matters for Hermes:** the compression's fourth line — *Supervisor decides* — is the answer to quiz questions the [[model-gateway]] keeps tempting: who decides a model is needed (routing above), who decides the job is done (the supervisor), never the gateway.

**Related:** [[hermes-job]] · [[spec-to-evidence-loop]] · [[capability-routing]] · [[model-gateway]] · [[hermes-policy]]
