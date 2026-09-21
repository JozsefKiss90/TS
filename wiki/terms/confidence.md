---
term: confidence
aliases:
  - confidence label
  - confidence lifecycle
type: glossary-term
lesson: "0014"
phase: 2
category: hermes
status: demonstrated
introduced: 2026-09-10
demonstrated: 2026-09-20
tags:
  - glossary
  - hermes
---

# confidence

A label from a closed list that says how well a claim is supported. It is not a probability.

The five labels are dev_graph's, adopted as they stand: `confirmed`, `single-source`, `inferred`, `speculative`, `experimental`. Each has a rule for moving to the next. A second independent source promotes `single-source` to `confirmed`. A contradiction drops any label to `speculative`. No arithmetic on the labels is meaningful, and the schema refuses a number.

**In [[lesson-0014-evidence-with-provenance|lesson 0014]]:** `ConfidenceSchema` is a `z.enum` of the five labels. The first promotion rule is written as a [[schema-refinement|refinement]]: `confirmed` needs at least two sources. The label crosses the adapter untranslated, because Hermes adopts dev_graph's scale instead of inventing a second one.

**Why it matters for Hermes:** an answer cites its nodes and carries each node's confidence. The loop can weigh a claim before acting on it. The labels are not part of PROV-DM. They are the user's dev_graph practice, quoted from its `CLAUDE.md`.

**Related:** [[provenance]] · [[evidence-item]] · [[schema-refinement]] · [[drift]]
