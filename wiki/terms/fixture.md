---
term: fixture
aliases:
  - recorded fixture
  - recorded exchange
type: glossary-term
lesson: "0012"
phase: 1
category: hermes
status: demonstrated
introduced: 2026-09-01
demonstrated: 2026-09-02
tags:
  - glossary
  - hermes
---

# fixture

Recorded data that a test replays in place of the live exchange that produced it.

The course has two instances. The mock server answers from a canned `Message` file, recorded once from the real shape (lesson 0002). Exercise 08 records whole wire exchanges: the request the adapter sent and the response the mock returned, replayed under the SDK through its `fetch` option.

A fixture is bytes on disk, so reading one back is a parse. The recorder stays in the repo, which makes drift visible: re-record, then read the diff.

**In [[lesson-0012-offline-by-construction|lesson 0012]]:** five fixtures under `08-tested-adapters/fixtures/`. Two replay the audit job's calls, one carries a 429, one a 401, and one is a deliberate tamper the boundary refuses.

**Why it matters for Hermes:** Phase 1's exit criterion names fixtures beside fakes. Scenario step S9 (scoring the run) grows from them in Phase 4, where recorded runs become the benchmark's replays.

**Related:** [[test-double]] · [[fake]] · [[port]] · [[adapter]] · [[json-boundary]] · [[trace]]
