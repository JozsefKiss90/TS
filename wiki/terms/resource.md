---
term: resource
aliases:
  - MCP resource
  - resource template
type: glossary-term
lesson: "0013"
phase: 2
category: protocol
status: introduced
introduced: 2026-09-02
tags:
  - glossary
  - protocol
---

# resource

Data an [[mcp|MCP]] server publishes under a URI, for a client to read by its own choice.

The split against tools is about who decides. A tool runs when a model asks for an action. A resource answers when a client reads, and no model turn is spent. A resource template registers one URI pattern that serves many instances, with a list callback that makes them discoverable.

**In [[lesson-0013-mcp-anatomy|lesson 0013]]:** `graph://index` is a static resource, and `graph://node/{id}` is a template serving one URI per node.

**Why it matters for Hermes:** cheap lookups stay out of the model's budget. Scenario step S2 (evidence assembled) should not pay a model turn to enumerate what the graph holds.

**Related:** [[mcp]] · [[transport]] · [[json-rpc]] · [[context-pack]]
