---
term: JSON-RPC
aliases:
  - json-rpc
  - frame
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

# JSON-RPC

The message format [[mcp|MCP]] borrows: one JSON object per message, named by method, matched to its answer by id.

On the standard-io [[transport]], one frame is one line. Answers can arrive out of order, because handlers are async. The id is the join, the same job the pairing id did in lesson 0008's tool loop. Failure uses two channels: a tool refusal arrives inside a result with `isError`, and a protocol error arrives as an `error` object.

**In [[lesson-0013-mcp-anatomy|lesson 0013]]:** `probe.jsonl` drives the server with seven raw frames, and the measured run answered ids 1, 2, 5, 6, 4, 3.

**Why it matters for Hermes:** the trace joins wire evidence by id here too. Diagnosing a misbehaving evidence query starts with these frames.

**Related:** [[mcp]] · [[transport]] · [[server-sent-events]] · [[tool-result-block]]
