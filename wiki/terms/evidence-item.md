---
term: evidence item
aliases:
  - EvidenceItem
type: glossary-term
lesson: "0014"
phase: 2
category: validation
status: introduced
introduced: 2026-09-10
tags:
  - glossary
  - validation
---

# evidence item

One claim from the knowledge graph, packaged with its [[provenance]].

An item has three fields: the graph's canonical `id`, a one-sentence `claim` the adapter templates, and a `provenance` object. A query's answer is a bundle of items with a header of its own: who assembled them, from which snapshot, and when. PROV-DM lets a set of provenance descriptions be an entity itself, so provenance can have provenance.

The word *evidence* collides with dev_graph, where `evidence` is a node's list of backing kinds such as `code` or `ADR`. The course uses the word for the packaged claim only.

**In [[lesson-0014-evidence-with-provenance|lesson 0014]]:** `EvidenceItemSchema` and `EvidenceBundleSchema` in `evidence.ts`. The same [[zod-schema|Zod schema]] is the port's type, the adapter's guard, the tool's `outputSchema`, and the parse the SDK runs on `structuredContent` after the handler. A miss is an empty bundle, never an error.

**Why it matters for Hermes:** the bundle is what scenario step S2 (evidence assembled) puts into a Context Pack. The Zod parse at that boundary is the admissibility check.

**Related:** [[provenance]] · [[confidence]] · [[derivation]] · [[context-pack]] · [[zod-schema]] · [[port]] · [[mcp]]
