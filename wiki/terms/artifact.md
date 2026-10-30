---
term: artifact
aliases:
  - artifact.json
  - landed artifact
type: glossary-term
lesson: "0024"
phase: 4
category: hermes
status: introduced
introduced: 2026-10-30
tags:
  - glossary
  - hermes
---

# artifact

The folder one run leaves under `artifacts/<run>/`: its output, its status, and links to its trace and cost report.

To land a run is to write its artifact. The folder holds `cost-report.json`, written first, and `artifact.json`, written last. A reader opens only `artifact.json`, through a strict Zod schema. Its status is `done` or `failed`, the two terminal words Hermes OS accepts.

The artifact is computed from the [[trace]] file. It copies the output text and links to the trace, so the trace stays the one record of what happened. A run that ends `over_budget` still lands, failed, with its [[partial-artifact|partial artifact]] as the output. A run whose process died lands later, failed, with no output.

The outcome `landed` in `job_ended` is a different thing: it means the model finished. Every run lands an artifact, whatever its outcome.

**In [[lesson-0024-landing-the-outputs|lesson 0024]]:** all seven recorded runs land. Five are done and two are failed, with 46 and 24 characters of partial text. A live run whose approver throws lands failed, with outcome null. A parked run lands nothing until it resumes and ends.

**Why it matters for Hermes:** scenario step S8 (outputs land, linked to cost) is what an artifact is. It imitates one entry in the [[artifact-vault|Artifact Vault]]. Lesson 0025's graders are planned to read it and the trace, and nothing else.

**Related:** [[atomic-write]] · [[trace]] · [[span]] · [[partial-artifact]] · [[artifact-vault]] · [[parked-run]]
