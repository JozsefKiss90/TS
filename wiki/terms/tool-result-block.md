---
term: tool_result
aliases:
  - tool result block
type: glossary-term
lesson: "0008"
phase: 1
category: protocol
status: demonstrated
introduced: 2026-08-11
demonstrated: 2026-08-15
tags:
  - glossary
  - protocol
---

# tool_result

What Hermes sends back after running a tool. It is a content block carrying `tool_use_id`, the output, and an `is_error` flag.

`tool_use_id` must repeat the id from the [[tool-use-block|tool_use]] block it answers. Without that key the provider cannot match an answer to its question.

The wire has no tool role. A `tool_result` block travels inside a `user` message, so the conversation still alternates user and assistant.

**In [[lesson-0008-tool-use-the-loops-heartbeat|lesson 0008]]:** the domain calls this turn `from: "tools"`, and `anthropic-gateway.ts` is the only file that translates it to a user message. A refused tool returns with `is_error` set, and the loop continues.

**Why it matters for Hermes:** a job's trace, S7 (the durable record), is built from these pairs. A tool that ran, what it answered, and whether it failed.

**Related:** [[tool-use-block]] · [[tool-loop]] · [[messages-api]] · [[job-supervisor]]
