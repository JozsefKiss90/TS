---
term: trial
aliases:
  - trials
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

# trial

One graded run of one task.

Lesson 0025 ran one trial per [[golden-task|golden task]]. Lab 07's [[fake]] replays one script, so a second trial repeats the first. One trial is one sample: it shows that the loop can pass, not how often it does.

`runTrials` runs each task n times. Trial *i* uses seed *i* and lands under the run name `<task>-s<i>`, so no trial overwrites another. Each trial row in `trials.json` holds the seed, the recording the seed chose, and the graders that failed.

**In [[lesson-0026-many-runs-one-verdict|lesson 0026]]:** ten series of 400 audit trials at a true pass rate of 90% read between 70% and 100% after ten trials.

**Why it matters for Hermes:** S9 (score the run). The Hermes OS README says a promotion needs at least ten consecutive clean runs, which is a count of trials, not one.

**Related:** [[seeded-fake]] · [[pass-rate]] · [[pass-hat-k]] · [[scorecard]] · [[grader]]
