---
name: lesson-authoring
description: Author, rewrite, edit, or review course material in this teaching workspace — lessons/*.html, wiki/terms/*.md, wiki/lessons/*.md. Use whenever a lesson or supplement is written, rewritten, shortened, split, or checked for readability, and whenever glossary term notes or lesson-map notes are created. Loads the binding prose rules and the shipping checklist.
---

Course material in this workspace is governed by rules the reader paid for in confusion. Follow them.

## Step 1 — Load the rules. Do not skip this.

Read these two files in full before writing any lesson prose:

1. `docs/style/ste-profile.md` — binding. Rule IDs, budgets, the term gate.
2. `docs/style/vendor/no-ai-slop.md` — the banned-pattern source and its licence.

Then read the constitution's requirements for the artefact you are producing:

3. `CLAUDE.md` Articles I, II, III, IV, and VIII.
4. The latest dated updates in `NOTES.md`.
5. `wiki/course/course-spine.md` and `wiki/course/hermes-integration.md`, for the spine thread and the
   S1–S9 scenario step the lesson must name.

Do not write from memory of these rules. They change. Read them.

## Step 2 — Check the budget before writing

A lesson body is 2,000 words, with at most six new Technical Names and one tangible win.

If the material does not fit, **split the lesson**. Do not compress the prose and keep the scope. Say so
to the user before writing, and propose the split.

This is the rule that failed most often. Lessons 0005 to 0006b run from 2,794 to 7,217 words, and two of
them exist only because an earlier lesson refused to split.

## Step 3 — Write

The term gate governs every word. A word appears only if it is ordinary English, a registered Technical
Name defined at first use in 20 words or fewer, or a literal `<code>` identifier. Register a term at
`wiki/terms/<slug>.md` before you use it. Coin nothing.

Sentence and paragraph limits, banned constructions, banned words, and the punctuation rules are in the
profile. The active output style summarises them; the profile is authoritative where they differ.

## Step 4 — Ship the whole artefact

`CLAUDE.md` Article I requires all of this in the same session, not just the HTML:

- The lesson at `lessons/NNNN-name.html`, linking `assets/course.css` and `assets/quiz.js`.
- One `wiki/terms/<slug>.md` note per introduced term, at `status: introduced`.
- A `wiki/lessons/lesson-NNNN-<short-name>.md` map note mirroring the diagrams.
- At least one Mermaid diagram, using the vendored `assets/vendor/mermaid.min.js`.
- A lab exercise in `hermes-sdk-lab/` where the lesson is hands-on.
- Bookkeeping: `ROADMAP.md` status, `wiki/course/course-module-graph.md`, and a dated `NOTES.md` update.

## Step 5 — Check it

Run the linter:

```bash
node tools/lesson-lint.mjs lessons/NNNN-name.html
```

**Not built yet, as of 2026-08-08.** Until it exists, check the profile's mechanical rules by hand and
say in your report that you did so. Do not claim a lesson passed the linter when no linter ran.

It exits non-zero on any mechanical violation and reports the rule ID. Fix every violation. Two rules are
heuristic and produce false positives — passive voice, and the 20-word versus 25-word split. Judge those,
and say which ones you judged.

## Rewriting an existing lesson

Two passes. Never merge them.

1. **Detect.** Name the pattern, quote the line, give the fix in one sentence. Rewrite nothing yet.
   Report the detection to the user before editing.
2. **Edit.** Apply the fixes. Output the revised lesson and a short "What changed" list.

Keeping them apart stops a rewrite from quietly deciding a violation was acceptable.

Shipped lessons are history under Article VII and are retro-edited only on explicit user request. The
2026-08-08 readability rewrite is that request, recorded in `NOTES.md`.

## When a rule fights the content

Say so. Do not silently break a rule, and do not mangle a true statement to fit a word count. Report the
conflict, propose the smallest change that satisfies both, and let the user decide.

A confusion report is never answered by adding text alone. Article VII now requires the response to
consider cutting or splitting first.
