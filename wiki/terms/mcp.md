---
term: MCP
aliases:
  - Model Context Protocol
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

# MCP

An open protocol under which a program serves tools and data to any client that connects.

The tool leaves the application's process. A server describes its tools over the wire, and a client discovers them at runtime with `tools/list`. Lesson 0008's tools were data inside Hermes. An MCP tool is hosted, described and executed by its own server.

**In [[lesson-0013-mcp-anatomy|lesson 0013]]:** exercise 09 serves a miniature knowledge graph with one tool, one [[resource]] and a template, over the standard-io [[transport]].

**Why it matters for Hermes:** scenario step S2 (evidence assembled) fills a Context Pack by querying `dev_graph` through MCP tools. This surface is what the loop will consume in lesson 0016.

**Related:** [[json-rpc]] · [[resource]] · [[transport]] · [[tool-use-block]] · [[context-pack]] · [[port]]
