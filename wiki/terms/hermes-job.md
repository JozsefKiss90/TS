---
term: Hermes job
aliases:
  - job
  - governed unit of work
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

# Hermes job

The unit of work in the Claude-Assisted Hermes OS: a **governed unit of work created to achieve a specified outcome**, carrying a [[job-envelope|Job Envelope]] (the contract), a [[context-pack|Context Pack]] (the admitted evidence), state, budget, accruing evidence, and a terminal outcome. It is **not** a prompt, a model request, a Claude Code session, a cron invocation, a tool call, or a chat message — each of those may occur *inside* a job, under the job's contract. Dispatch is mechanical: *no envelope → no dispatch; no pack → no dispatch* (accepted — D-006/D-013, ADR-0002).

**In supplement [0006b](../../lessons/0006b-the-hermes-control-plane.html):** the worked instance is the Wave-1 vertical slice `hermes rag audit atlas --graph-health --cost-report --no-writeback` — owner Themis, read-only tools, $1 ceiling — followed through twelve moments from operator request to Artifact Vault. The full composed job structure (state, plan, decision history as one object) is a *proposed clarification*; the accepted record defines the parts but no single schema composes them.

**Why it matters for Hermes:** every architecture question in the course resolves against this unit — the [[job-supervisor]] owns its lifecycle, policies constrain it, gateways execute single steps of it, and the [[model-gateway]] is one late, bounded organ inside it.

**Related:** [[job-envelope]] · [[context-pack]] · [[job-supervisor]] · [[spec-to-evidence-loop]] · [[capability-routing]] · [[artifact-vault]]
