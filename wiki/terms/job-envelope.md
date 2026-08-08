---
term: Job Envelope
aliases:
  - envelope
  - universal envelope
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

# Job Envelope

The mandatory **operational contract** every dispatched [[hermes-job|Hermes job]] carries — eight fields, accepted verbatim (D-013, ADR-0012; schema `rag_job.schema.json`): **title · owner · model policy · tool policy (`allowedTools`) · cost ceiling · output artifact path · completion condition · cancellation rule**. *No envelope → no dispatch.* The envelope **governs** execution but contains no context, evidence, state, or results — those live elsewhere in the job.

**In supplement [0006b](../../lessons/0006b-the-hermes-control-plane.html):** the audit job's worked values — owner Themis (a routing-table row, not an agent), strong-reasoning model policy, read-only `allowedTools`, **$1** ceiling, vault-relative output path. Terminology debt recorded as an open decision: ADR-0001 says *typed job manifest*, ADR-0006/0007/0012 say *Job Envelope*; 0006b reads the manifest as the serialized document and the envelope as its eight governing fields, and maps the course's TaskSpec (lesson 0007) to the validated request admission consumes — none of this is ratified.

**Why it matters for Hermes:** the envelope is where S1 ("parsed and Zod-validated, invalid work rejected before a single token is spent") and S6 (the cost ceiling the `AbortController` enforces) get their data. "Who did this" is always answerable from the envelope (ADR-0015).

**Related:** [[hermes-job]] · [[context-pack]] · [[hermes-policy]] · [[routing-policy]] · [[runtime-validation]]
