---
term: partial artifact
aliases:
  - partial output
type: glossary-term
lesson: "0009"
phase: 1
category: hermes
status: demonstrated
introduced: 2026-08-15
demonstrated: 2026-09-01
tags:
  - glossary
  - hermes
---

# partial artifact

The output kept from a generation that was stopped before it finished.

An abort is not a deletion. The text that streamed in before the stop already exists, and Hermes keeps it. The remainder was never generated and never billed, which lesson 0004 measured.

**In [[lesson-0009-bounds-and-termination|lesson 0009]]:** the gateway accumulates streamed text and returns it on the aborted arm as `partialText`. Part E kept 46 of 82 characters when the budget fired, and Part F kept 24 when the deadline did. The report's notes carry the text.

**Why it matters for Hermes:** scenario step S6 (the budget is enforced) promises that a kill at the ceiling keeps the partial output. Step S8 (outputs land) stores it in the Artifact Vault, linked to the job and its cost. In this lab the report is as far as it travels, because nothing writes files yet.

**Related:** [[termination]] · [[cancellation]] · [[server-sent-events]] · [[artifact-vault]] · [[message-stream]]
