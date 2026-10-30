---
term: atomic write
aliases:
  - writeAtomic
  - write then rename
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

# atomic write

A write to a temporary file, then a rename over the target, so no reader sees a half-written file.

`writeAtomic` in lab 14 writes `<name>.tmp`, then calls `renameSync` from `node:fs`. Node's documentation says that `rename` overwrites an existing target. Linux's `rename(2)` page also promises the swap is atomic. Windows documents no such promise, so there the guarantee rests on the order of the two steps.

A kill during the first step leaves only the temporary file, and the old target is still whole. Lab 12's checkpoint sink writes the real file in place, so a kill there can leave half a JSON document.

**In [[lesson-0024-landing-the-outputs|lesson 0024]]:** a test makes the first step die halfway, and the earlier `artifact.json` is unchanged. With the temporary file removed from `writeAtomic`, that test fails.

**Why it matters for Hermes:** scenario step S8 (outputs land, linked to cost) needs a folder that a kill cannot tear. With `artifact.json` written last, a reader never sees an artifact whose cost report is missing.

**Related:** [[artifact]] · [[checkpoint]] · [[trace]]
