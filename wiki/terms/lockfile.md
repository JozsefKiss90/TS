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

The record of what a dependency install resolved: the exact version of every package, transitive dependencies included. The file `package.json` only states the ranges you would accept, such as `^5.7.0` for any 5.x from 5.7. Commit the lockfile, and every later install reproduces the identical tree.

**In [[lesson-0002-raw-http-against-a-mock|lesson 0002]]:** `hermes-sdk-lab/pnpm-lock.yaml` records that `"typescript": "^5.7.0"` resolved to 5.9.3. A teammate installing next month gets 5.9.3 too, not the newest 5.x of that day.

**Why it matters for Hermes:** a system whose behavior must be reproducible cannot sit on a dependency tree that drifts between installs. The lockfile pins the tree. The [[api-version-header]] pins the wire rules for the same reason.

**Related:** [[api-version-header]] · [[test-double]] · [[sdk]]
