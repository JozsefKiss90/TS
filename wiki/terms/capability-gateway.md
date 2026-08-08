---
term: capability gateway
aliases:
  - gateway map
  - Claude Code Job Gateway
type: glossary-term
lesson: "0006b"
phase: 1
category: hermes
status: introduced
introduced: 2026-07-30
tags:
  - glossary
  - hermes
---

# Capability gateway

A **bounded access point** to one governed capability: policy is enforced *before* it, execution happens *through* it, normalized results plus metadata (usage, identity, timing, trace correlation, classified failure) come *back from* it. Supplement 0006b's gateway map — **Model Gateway · Claude Code Job Gateway · Evidence Gateway · Tool Execution Gateway · Artifact Gateway · Notification Gateway** — is a *proposed clarification*; the rules each gateway enforces are accepted (ADR-0001/0006/0007/0013/0017/0021).

The load-bearing pair: the [[model-gateway]] executes one stateless, tool-less, reach-less reasoning step; the **Claude Code Job Gateway** dispatches a *governed sub-execution* — own envelope, tool policy, worktree, harness gates, PR-bounded write reach (accepted boundary — ADR-0001, *mutation ⇒ PR, never direct push*). Treating Claude Code as another model behind the Model Gateway would erase the tool whitelist, the PR boundary, and the blocking map — the gateways differ because the capabilities' blast radii differ.

**In supplement [0006b](../../lessons/0006b-the-hermes-control-plane.html):** Diagram 5 — four execution gateways under one router, all reporting to the [[job-supervisor]]; no gateway talks to another gateway.

**Related:** [[model-gateway]] · [[capability-routing]] · [[job-supervisor]] · [[port]] · [[adapter]]
