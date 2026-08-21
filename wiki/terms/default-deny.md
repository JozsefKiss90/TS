---
term: default deny
aliases: []
type: glossary-term
lesson: "0010"
phase: 1
category: hermes
status: introduced
introduced: 2026-08-20
tags:
  - glossary
  - hermes
---

# default deny

The rule that refuses whatever a policy does not permit.

The lab applies it twice. A spec that says nothing permits no tools, because `allowedTools` defaults to an empty list (lesson 0007). A held call with no approval channel is denied, because permission is granted, never assumed. The empty `approvalRequired` default is the deliberate exception. It is permissive, so a job with read-only tools can run unattended.

**In [[lesson-0010-approval-gates-and-permissions|lesson 0010]]:** `runTask` with no approver denies every held call, and Part H treats a closed terminal the same way.

**Why it matters for Hermes:** the OS guarantees are refusal guarantees: no envelope, no dispatch. A control plane that assumed permission on silence could not make them.

**Related:** [[approval-gate]] · [[task-spec]] · [[admissibility-check]]
