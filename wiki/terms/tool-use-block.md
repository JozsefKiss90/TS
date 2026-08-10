---
term: tool_use
aliases:
  - tool use block
  - tool call
type: glossary-term
lesson: "0008"
phase: 1
category: protocol
status: introduced
introduced: 2026-08-11
tags:
  - glossary
  - protocol
---

# tool_use

The model's request to run one named tool, with arguments. It arrives as a content block inside an ordinary assistant message, alongside any text the model wrote.

The block carries three fields. `id` pairs the request with its answer, `name` selects the tool, and `input` holds the arguments. When a reply contains one, [[stop-reason|stop_reason]] reads `tool_use`.

**In [[lesson-0008-tool-use-the-loops-heartbeat|lesson 0008]]:** the adapter parses the block at the [[json-boundary]] and hands the domain a `ToolCall`. The port calls the same stop cause `wants_tool`, so no line of domain code spells the wire's word.

**Why it matters for Hermes:** scenario step S5 (the loop iterates) begins here. The model asks, and nothing runs until Hermes decides to run it. The arguments are model output, so `runTool` parses them with a [[zod-schema]] before dispatch.

**Related:** [[tool-result-block]] · [[tool-loop]] · [[stop-reason]] · [[messages-api]] · [[discriminated-union]]
