---
term: provenance
aliases: []
type: glossary-term
lesson: "0014"
phase: 2
category: hermes
status: introduced
introduced: 2026-09-10
tags:
  - glossary
  - hermes
---

# provenance

The record of a claim's origin: who stands behind it, which activity produced it, and what it was made from.

W3C PROV-DM is the published standard for that record. It uses three nouns and a set of named relations. The course keeps three relations, each as one field of the evidence schema: `sources` for attribution, `generatedBy` for generation, and `derivedFrom` for [[derivation]]. PROV-DM's word for the responsible party is agent. That word means a loop that acts elsewhere in this course, so the schema says source.

**In [[lesson-0014-evidence-with-provenance|lesson 0014]]:** every [[evidence-item|evidence item]] carries a `provenance` object. The adapter fills it from the export row's own fields, and a [[schema-refinement|refinement]] refuses `confirmed` on a single source. Measured: the refusal stops the server at wiring.

**Why it matters for Hermes:** scenario step S2 (evidence assembled) requires that every item in a Context Pack carry provenance. Without it a claim cannot be checked, so it cannot be admitted.

**Related:** [[evidence-item]] · [[derivation]] · [[confidence]] · [[context-pack]] · [[json-boundary]] · [[trace]]
