---
term: MCP client
aliases:
  - scripted client
  - Client
type: glossary-term
lesson: "0015"
phase: 2
category: protocol
status: introduced
introduced: 2026-09-20
tags:
  - glossary
  - protocol
---

# MCP client

A program that connects to one [[mcp|MCP]] server over a [[transport]] and calls what the server serves.

The SDK ships one as the `Client` class. The `connect` method opens the transport and runs the initialize handshake. The `callTool` method sends one `tools/call` frame with a fresh id and settles when that id returns. So [[json-rpc|JSON-RPC]] id matching is the SDK's job.

The data channel, `structuredContent`, arrives typed `unknown`. The SDK checks it against the JSON Schema from `tools/list`, which carries no cross-field rule. The client's own Zod parse is what makes it a typed bundle and runs the [[schema-refinement|refinement]].

**In [[lesson-0015-test-it-without-an-llm|lesson 0015]]:** `src/client.ts` starts the exercise 10 server as a child process on stdio, lists the tool, searches twice, reads one [[resource]], and closes. Measured: 864 ms to connect, three items for `gate`, zero for `kubernetes`.

**Why it matters for Hermes:** scenario step S2 (evidence assembled) is this program inside the loop. Lesson 0016's planning step calls it and reads a bundle.

**Related:** [[mcp]] · [[transport]] · [[in-memory-transport]] · [[json-rpc]] · [[evidence-item]] · [[runtime-validation]]
