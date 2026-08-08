---
term: Artifact Vault
aliases:
  - the vault
  - artifacts tree
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

# Artifact Vault

The **versioned `artifacts/` tree where every job output persists, linked to jobs and costs** (accepted — ADR-0013). Eight subtrees: `dreams/ · reports/ · evals/ · costs/ · pr_summaries/ · graph_deltas/ · dashboards/ · generated_docs/` (plus filed context packs). The v1 dashboard *is* the vault: script-generated markdown pages, read-only by construction, derivative by definition — deletable and regenerable at any time, which is the proof they hold no state (ADR-0013/0018: job truth lives in manifests, job state files, and the ledger, never in UI state).

**In supplement [0006b](../../lessons/0006b-the-hermes-control-plane.html):** the walkthrough's final moment — the audit report, the context pack used, the evidence bundle, harness results, cost report, and limitations all land here, and the job is not `completed` until they do (publication is part of landing, not an afterthought).

**Why it matters for Hermes:** the vault is the trace side of S8 — outputs persist linked to job + cost — and the evidence base for every later approval, promotion, and ROI question.

**Related:** [[hermes-job]] · [[spec-to-evidence-loop]] · [[job-envelope]] · [[capability-gateway]]
