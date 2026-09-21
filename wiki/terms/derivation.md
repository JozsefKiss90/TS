---
term: derivation
aliases:
  - wasDerivedFrom
  - derivedFrom
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

# derivation

The link from a record to the earlier record it was made from.

PROV-DM names the relation `wasDerivedFrom`: the construction of a new entity from a pre-existing one. The schema keeps it as `derivedFrom`, a list of references. An [[evidence-item|evidence item]] is derived from one export row, and the row from a markdown note. Each reference names a snapshot and a canonical id, so the chain can be followed back.

Derivation is not dependency. dev_graph's `depends_on` says which node needs another. `derivedFrom` says which record this record was made from.

**In [[lesson-0014-evidence-with-provenance|lesson 0014]]:** the adapter writes `derivedFrom: ["dev-graph-2026-09-09#MOD-001"]` from the file's snapshot name and the row's `canonical_id`. The field defaults to an empty list, so the input type differs from the output type (lesson 0007).

**Why it matters for Hermes:** a Context Pack that names its derivation can be traced back to the note behind each claim. That trace is how Drift between graph intent and reality is found.

**Related:** [[provenance]] · [[evidence-item]] · [[drift]] · [[schema-inference]]
