---
term: tool loop
aliases:
  - the tool loop
type: glossary-term
lesson: "0008"
phase: 1
category: hermes
status: demonstrated
introduced: 2026-08-11
demonstrated: 2026-08-15
tags:
  - glossary
  - hermes
---

# tool loop

The repeated exchange between Hermes and a model. Hermes sends the transcript, the model asks for a tool or finishes, and Hermes runs the tool and sends the result back.

One job becomes several model calls. The loop ends when a reply's [[stop-reason|stop_reason]] is anything other than `tool_use`, or when a bound stops it first.

The transcript belongs to Hermes. The [[messages-api]] keeps no memory between requests, so every model call resends the whole conversation, and the input token count rises as it grows.

**In [[lesson-0008-tool-use-the-loops-heartbeat|lesson 0008]]:** `runTask` puts one `gateway.complete` call inside a `for`. Two turns join the transcript per tool call answered: the model's, then the tools'. The only bound is a literal cap on model calls.

**Why it matters for Hermes:** this is scenario step S5 (the loop iterates), and the frame every later Phase 1 lesson fills in. Lesson 0009 adds budgets and deadlines, lesson 0010 adds approval gates, and lesson 0011 records the run.

**Related:** [[tool-use-block]] · [[tool-result-block]] · [[job-supervisor]] · [[spec-to-evidence-loop]] · [[model-gateway]]
