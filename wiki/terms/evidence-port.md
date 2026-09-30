---
term: evidence port
aliases:
  - EvidencePort
  - McpEvidenceAdapter
type: glossary-term
lesson: "0016"
phase: 2
category: hermes
status: introduced
introduced: 2026-09-30
tags:
  - glossary
  - hermes
---

# evidence port

The [[port]] the loop asks for evidence: one method, a query in, a bundle of [[evidence-item|evidence items]] out.

Named `EvidencePort` to match `ApprovalPort` and `TracePort` in the same loop, and to leave the word *source* with one meaning. A source is who stands behind a claim, inside an item's [[provenance]].

Narrower than lesson 0014's `KnowledgeGraph`, which also serves one node by id and lists everything it holds. A job that is being planned asks questions and reads answers, so `search(query, limit)` is the whole port. Above it the assembler knows about queries and packs. Below it sit an [[mcp-client|MCP client]], a child process and one `tools/call` request per query.

**In [[lesson-0016-evidence-enters-the-loop|lesson 0016]]:** `McpEvidenceAdapter` is the adapter, over exercise 10's server. Its `search` parses `structuredContent` with `EvidenceBundleSchema`, because the [[schema-refinement|refinement]] has no JSON Schema form and the SDK's own check cannot run it. An in-band refusal becomes a thrown error, and the assembler turns it into a rejection naming the query.

**Why it matters for Hermes:** scenario step S2 (evidence assembled) reaches the loop through this port. The RAG Factory's supply is one implementation. A [[fake]] list is another, which is why the grounded loop is testable with no model and no network.

**Related:** [[port]] · [[adapter]] · [[context-pack]] · [[mcp-client]] · [[evidence-item]] · [[model-gateway]]
