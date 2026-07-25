---
term: Lockfile
aliases:
  - pnpm-lock.yaml
type: glossary-term
lesson: "0002"
phase: 0
category: sdk-layer
status: introduced
introduced: 2026-07-23
tags:
  - glossary
  - sdk-layer
---

# Lockfile

The record of what a dependency install **actually resolved** — the exact version of every package, transitive dependencies included — as opposed to `package.json`, which only states the ranges you would accept (`^5.7.0` = "any 5.x from 5.7"). Committing it makes every future install reproduce the identical tree.

**In [[lesson-0002-raw-http-against-a-mock|lesson 0002]]:** `hermes-sdk-lab/pnpm-lock.yaml` records that `"typescript": "^5.7.0"` resolved to 5.9.3 today; a teammate installing next month gets 5.9.3 too, not whatever 5.x is newest then.

**Why it matters for Hermes:** it is the dependency-world version of a recorded fixture — pinned reality instead of a range of possibilities. An agent harness whose behavior must be reproducible cannot sit on a dependency tree that drifts between installs. (The same reasoning behind pinning the [[api-version-header]] on the wire.)

**Related:** [[api-version-header]] · [[test-double]] · [[sdk]]
