---
term: in-memory transport
aliases:
  - InMemoryTransport
  - linked pair
type: glossary-term
lesson: "0015"
phase: 2
category: protocol
status: demonstrated
introduced: 2026-09-20
demonstrated: 2026-09-30
tags:
  - glossary
  - protocol
---

# in-memory transport

A pair of linked transports that carry protocol frames between a client and a server inside one process.

`InMemoryTransport.createLinkedPair()` returns the two ends. The server connects to one and the [[mcp-client|MCP client]] to the other. The frames are the same [[json-rpc|JSON-RPC]] messages the standard-io [[transport]] would carry, and the handshake runs. What is absent is the child process, the pipe, and the rule that stdout belongs to the transport. So a test over this channel proves the handler and the protocol, and says nothing about spawn or shutdown.

**In [[lesson-0015-test-it-without-an-llm|lesson 0015]]:** five tests in `tests/server-in-memory.test.ts` and five in `tests/fixtures.test.ts` run the whole server over a [[fake]] this way. Measured: 141 ms for five tests, 68 ms per connect, 7 ms per call. One stdio test takes 1,130 ms and stays, for what only a pipe can prove.

**Why it matters for Hermes:** the evidence surface can be tested at every commit with no model, no key and no process. Scenario step S9 (scoring the run) grows from suites that run this fast.

**Related:** [[transport]] · [[mcp-client]] · [[fake]] · [[fixture]] · [[port]]
