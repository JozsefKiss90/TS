---
term: transport
aliases:
  - stdio transport
  - standard-io transport
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

# transport

The channel that carries protocol messages between one [[mcp|MCP]] client and one server.

Exercise 09 uses the standard-io transport. The client starts the server as a child process, writes [[json-rpc|JSON-RPC]] frames to its stdin, and reads frames from its stdout. The client owns the server's lifetime, and a closed pipe stops the process. The transport owns stdout, so server diagnostics go to stderr.

**In [[lesson-0013-mcp-anatomy|lesson 0013]]:** `StdioServerTransport`, passed to `server.connect`. The lab's first break experiment puts a stray log line on stdout and reads the wire.

**Why it matters for Hermes:** the evidence surface must be startable by whatever supervises a job. A child process on pipes needs no network listener and no credentials yet.

**Related:** [[mcp]] · [[json-rpc]] · [[resource]] · [[endpoint]]
