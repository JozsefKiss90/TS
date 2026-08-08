---
type: course-doc
doc: style-vendor
title: no-ai-slop — vendored rules and adaptations
date: 2026-08-08
normative: true
tags:
  - course
  - style
---

# no-ai-slop, vendored

## Provenance

Source: `github.com/petergyang/no-ai-slop`, files `skills/no-ai-slop/SKILL.md` and
`skills/no-ai-slop/eval.md`, retrieved 2026-08-08.

This repository **vendors the rules rather than installing the plugin**. The plugin installs globally
(`npx skills add petergyang/no-ai-slop --global`), and this workspace needs a project-scoped style
authority. Vendoring also prevents a second style document that could contradict
`docs/style/ste-profile.md`.

## Licence

```
MIT License

Copyright (c) 2026 Peter Yang

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and
associated documentation files (the "Software"), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the
following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial
portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, and the authors
assume no responsibility for claims, damages, or other liability arising from the software's use or any
related matters.
```

## What the source says

### Its seven principles

Preserve voice. Minimum effective edit. Lead with the point. Stay concrete. Make verbs work. Show, don't
tell. Protect edge.

### Its patterns

Throat-clearing. Faux-insight setups. Colon reveals. Importance puffery. Weasel attribution. Synonym
cycling. Fake-profound endings. Its eval rubric adds: binary contrasts, negative lists, rhetorical setups,
superficial analysis, weak verbs, dramatic fragments, robotic rhythm, interpretive metadiscourse,
authorial commentary, reader guidance, redundant glossing, summary-recap conclusions, and formatting slop.

### Its banned words

delve, leverage, empower, streamline, robust, cutting-edge, paradigm shift, game changer, transformative,
supercharge, harness.

### Its two modes

**Edit** rewrites the draft and appends a "What changed" section. **Detect** names each pattern, quotes
the line, and gives a concise fix without rewriting.

## Adaptations for this course

### Adopted whole

- Every pattern in the list above. They map onto real defects in lessons 0005 to 0006b.
- The banned-words list, extended in `ste-profile.md` section 6 with words this course actually overuses.
- **Detect mode as the review interface.** A rewrite session runs Detect first: pattern, quoted line,
  fix. Only then does it edit. This keeps the diagnosis separate from the repair and gives the linter's
  judgment-only rules a defined output shape.
- The output format: full edited draft plus a short "What changed" section.

### Adopted with a change

**"Use em dashes sparingly (none in short copy, max 1–2 in longer pieces)."** This is stricter than the
profile's original draft of one per paragraph. The profile now takes the source's number: **at most two
per lesson.** Lesson 0006b currently has 185.

**"Uses lowercase colons unless grammar, proper nouns, titles, or code require capitals."** Adopted, with
the code exception made explicit, because this course writes identifiers after colons constantly.

### Rejected, with reasons

**"Preserve voice", "minimum effective edit", and "cut proportionally; avoid aggressive compression that
strips character".** These are the source's first principles, and this course rejects them.

no-ai-slop is built for personal essays and posts, where the writer's voice is the value. A lesson is
technical documentation. Its register should be uniform, flat, and predictable, because the reader is
decoding an unfamiliar system and every stylistic flourish is extra load. Where the two documents
disagree about voice, `ste-profile.md` wins. Where they disagree about a pattern, they do not — the
pattern list is adopted without exception.

This also settles the compression question. The source's "cut proportionally" would forbid the reduction
the word budget requires. The budget is the whole point, so it stands.

**"Protect edge — keep strong opinions, humour, profanity."** Not applicable. Opinions in a lesson are
claims, and `CLAUDE.md` Article IV requires claims to be verified.

## Conflict with the constitution

The source's eval rubric says: **"Cuts summary-recap conclusions for concrete endpoints."**

`CLAUDE.md` Article III.8 says the opposite. It **requires** every lesson to close with an N-statement
compression, "if you keep only five sentences…".

Both cannot hold. The reasoning:

- Article III.8's compression is useful to a learner. It is retrieval scaffolding, not a rhetorical
  flourish, and it is not the kind of recap the source's rule was written about.
- The shipped instances fail on their own terms. Lesson 0006a's compression is **five sentences totalling
  178 words**, one of them 46 words long. That is not a compression. It is the lesson again.

**Decided 2026-08-08 by the user: keep Article III.8, and bound it.** A compression is at most five
sentences. Each sentence is at most 25 words. It uses no Technical Name the lesson did not define.

This is a recorded exception to the source's summary-recap rule. The linter does not flag a compression
that meets the bound, and does flag one that does not. Lesson 0006a's current compression fails the bound
and is rewritten. The rule lives at `ste-profile.md` PARA-7 and `CLAUDE.md` Article III.8.

## Related

- `docs/style/ste-profile.md` — the profile this document feeds. It wins on every conflict.
- `CLAUDE.md` Article III.8 — the compression requirement discussed above.
