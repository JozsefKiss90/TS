---
term: seeded fake
aliases:
  - SeededFakeGateway
type: glossary-term
lesson: "0026"
phase: 4
category: hermes
status: introduced
introduced: 2026-10-31
tags:
  - glossary
  - hermes
---

# seeded fake

A fake gateway that replays one of several recordings. A seed number picks the recording, the same one for the same seed.

`SeededFakeGateway` implements lab 07's `ModelGateway` port, so the loop cannot tell it from the [[fake]] or the real adapter. A golden task's `fixture` may list recordings with whole-number weights. The function `pickVariant` turns the seed into one draw of the mulberry32 generator and picks a recording by weight. Then lab 07's fake replays it.

The weights set the failure rate before any run. The variation is chosen. No model produced it.

**In [[lesson-0026-many-runs-one-verdict|lesson 0026]]:** `audit` replays `audit-atlas.jsonl` at weight 9 and the parked audit at weight 1. The parked answer drops the tool's numbers, so one trial in ten fails `reports_tool_output`.

**Why it matters for Hermes:** S9 (score the run). A failed trial reruns exactly from its seed, so a failure can be read, not only counted.

**Related:** [[trial]] · [[fake]] · [[fixture]] · [[port]] · [[adapter]]
