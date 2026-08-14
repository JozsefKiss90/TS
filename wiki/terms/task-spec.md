---
term: TaskSpec
aliases:
  - task spec
  - TaskSpecSchema
type: glossary-term
lesson: "0007"
phase: 1
category: hermes
status: demonstrated
introduced: 2026-08-08
demonstrated: 2026-08-15
tags:
  - glossary
  - hermes
---

# TaskSpec

Hermes's schema for one unit of work, written before any model call. It declares who asked, what to do, and how large the call may be. It also declares what the job may spend, which tools it may use, and where the artifact lands.

The TaskSpec guards a [[json-boundary]] like every other contract in this course. The bytes reaching it come from an operator rather than a provider. A [[zod-schema]] does the checking, and [[safe-parse]] returns the answer as data.

**In [[lesson-0007-the-taskspec-is-a-contract|lesson 0007]]:** `task-spec.ts` holds `TaskSpecSchema` and two derived types. `z.output` names an admitted spec and `z.input` names a spec file. They differ because `maxTokens` and `allowedTools` carry defaults. Exercise 05 decided both of those in `supervisor.ts`, as literals.

**Why it matters for Hermes:** scenario step S1 (the envelope is parsed) checks the job before anything else runs. The course's TaskSpec is the smaller relative of the [[job-envelope]], which the governance record defines with eight fields. This one carries only fields the Phase 1 loop can already read.

**Related:** [[admissibility-check]] · [[schema-refinement]] · [[job-envelope]] · [[zod-schema]] · [[schema-inference]] · [[json-boundary]]
