---
type: course-doc
doc: style-profile
title: The Lesson Prose Profile (ASD-STE100-derived)
date: 2026-08-08
normative: true
tags:
  - course
  - style
---

# The lesson prose profile

**Status: normative.** This document governs the prose in `lessons/*.html` and `wiki/**/*.md`. A lesson
that breaks a rule here does not ship, however correct its content is.

**It does not govern anything else.** It says nothing about how an agent works in this repository: not
tool use, not commit messages, not chat during a working session, not `NOTES.md`, not code comments. It
governs course material that a human reads to learn.

## 1 · Why this document exists

Lessons 0001 to 0006b drift in one direction. The measurements, taken 2026-08-08:

| Lesson | Words | Mean words per sentence | Sentences over 35 words | Em-dashes |
|---|---|---|---|---|
| 0001 | 1,339 | 15.6 | 5 | 26 |
| 0002 | 1,495 | 20.2 | 9 | 39 |
| 0003 | 1,510 | 20.7 | 6 | 39 |
| 0004 | 1,709 | 20.6 | 14 | 56 |
| 0005 | 2,794 | 24.1 | 19 | 79 |
| 0006 | 3,635 | 24.6 | 24 | 99 |
| 0006a | 4,516 | 27.0 | 30 | 111 |
| 0006b | 7,217 | 26.9 | 44 | 185 |

Every measure gets worse in the same direction. The cause is structural. `CLAUDE.md` Article VII says that
a lesson which needs a supplement proves the constitution failed, and that the repair is to amend an
Article. All thirteen recorded defects in `wiki/course/course-pedagogy.md` were repaired by demanding more
text. None of Article III's nine standards limits length, sentence complexity, or vocabulary. So a report
of confusion could only ever produce more apparatus. It could never produce a cut.

This profile supplies the missing half of that mechanism.

## 2 · Relationship to ASD-STE100

ASD-STE100 Simplified Technical English is a controlled natural language. ASD (Aerospace, Security and
Defence Industries Association of Europe) owns it. The current edition is **Issue 9, dated 15 January
2025**, maintained by STEMG. It is copyright and trademark, EU trade mark 017966390. An official copy is
free on request from `asd-ste100.org`.

This profile is **derived from ASD-STE100. It is not compliant with it, and must not be described as
compliant.** Three reasons:

1. **The dictionary cannot live here.** ASD-STE100's approved dictionary of roughly 900 words is ASD's
   copyright. This repository must not vendor it. The approved word list in section 3 is our own, and it
   is small.
2. **The dictionary targets a different job.** ASD-STE100 was built for aircraft maintenance procedures.
   Its approved vocabulary would reject words this course needs, and it has no entry for the ideas this
   course teaches.
3. **Most of the course is descriptive, not procedural.** ASD-STE100's strongest machinery governs
   instructions. This course explains how a system behaves. The instruction rules apply to lab steps
   only.

What this profile takes from ASD-STE100 is the part that fixes the observed defect: strict vocabulary
control, short sentences, active voice, one idea per sentence, and a formal mechanism for admitting
domain words. That mechanism is Technical Names, and section 3 maps it onto infrastructure this
repository already has.

**Open action.** Request the official Issue 9 copy and reconcile this profile against it: confirm the
rule count and part structure, and check each rule below against its ASD-STE100 counterpart. Until that is
done, no rule here should cite an ASD-STE100 rule number.

## 3 · Vocabulary — the rules that matter most

This section addresses the primary complaint: the material invents terms and then uses them as though the
reader already knows them.

### TERM-1 · The term gate

A word or phrase may appear in a lesson only if one of these is true:

- It is ordinary English that a competent TypeScript developer reads without stopping.
- It is a **Technical Name**: it has a note at `wiki/terms/<slug>.md`, **and** the lesson defines it at
  first use in 20 words or fewer.
- It is a literal identifier from the code, marked up as `<code>`.

Anything else is deleted. There is no fourth case.

`wiki/terms/` is this repository's Technical Names registry. It already exists and already carries the
required schema. Registering a term is therefore cheap, which is the point: the cost of a new term is a
note and a definition, not nothing.

### TERM-2 · No invented vocabulary

Do not coin a phrase to carry an idea. Name the idea in ordinary words, or register a Technical Name.

Coinages found in shipped lessons, all of which fail this rule: *policy seed*, *honest ledger*,
*deconfusion*, *spine thread*, *wire truth*, *the six*, *the three graphs*, *layer accounting*.

`CLAUDE.md` Article III.7 currently requires that a coinage be followed by what it does not mean. That
rule treats the symptom. This rule removes the cause. Article III.7 is amended accordingly.

### TERM-3 · One word, one meaning

A word carries exactly one meaning across the whole course. If two ideas need two words, use two words.

The course currently uses **policy** for three things: a decision rule in `supervisor.ts`, a data field in
a job envelope, and a whole rule set drawn as a graph. Pick one meaning for the word and rename the other
two.

Where a word is genuinely overloaded by an external system and cannot be renamed, `CLAUDE.md` Article
III.5 already requires a collision table. Keep it, and keep it to one table. A word the course overloads
by itself does not qualify. Rename it.

**Applied 2026-08-08 — "contract".** The course overloaded it three ways, so the collision table did not
apply. *Contract* now names one thing: **the TaskSpec**, an agreement about which work Hermes may run.
Responsibility ④ is the **request and response shape**. `gateway.ts` is **the port**. Lessons 0001 to
0005 still carry the old wording until they are rewritten.

### TERM-4 · No definition chains

A definition must not contain an undefined Technical Name. If defining term A requires term B, define B
first, or write the definition without B.

### TERM-5 · Approved part of speech

Use a word only as the part of speech the glossary note gives it. Do not turn a noun into a verb.

### TERM-6 · No metaphors for mechanisms

Describe what the code does. Do not describe what it resembles. *Seeded*, *planted where the organ will
grow*, *the wire cannot see the architecture*, and *the ledger lies* all fail this rule.

An exception: a metaphor that is the established industry name for the thing, such as **port** or
**adapter**, is a Technical Name and passes TERM-1.

**Applied 2026-08-08.** Article III.9's middle status label was *seeded*, which this rule bans. It is now
**prepared**. *Reserved* was tried first and rejected, because lesson 0006a already uses "reserved" for
the model choice, and TERM-3 forbids the second meaning.

### TERM-7 · Scenario steps carry a gloss

`S1` to `S9` are the nine steps of the worked job in `wiki/course/hermes-integration.md`. A bare code
tells a learner nothing, which is the same defect as an undefined Technical Name.

Each distinct step a lesson uses appears once as `S4 (model calls)`. Later mentions can be bare. The
gloss is six words or fewer.

The linter reads prose blocks, not raw HTML, so a Mermaid node named `S1` is not mistaken for a step.

## 4 · Sentences

### SENT-1 · Length
- Instructions in a lab: **20 words or fewer**.
- Explanatory sentences: **25 words or fewer**.
- Absolute ceiling: **30 words**, and only where breaking the sentence would change the meaning.

### SENT-2 · One idea per sentence
One statement per sentence. One instruction per sentence.

### SENT-3 · Active voice
Write in the active voice. Name who or what does the action. The passive is allowed only where the actor
is genuinely unknown or genuinely irrelevant.

### SENT-4 · Simple tenses
Use the simple present, simple past, or simple future. Prefer the present tense for how a system behaves.

### SENT-5 · No `-ing` forms
Do not open a clause with a participle. *Passing MODEL into the constructor prevents the adapter from
owning model selection* becomes *The wiring passes MODEL into the constructor. The adapter therefore
cannot choose the model.*

An `-ing` word that is part of a Technical Name, such as **streaming**, is allowed.

### SENT-6 · Noun clusters of three words maximum
*One-call policy seed*, *provider-neutral result type*, and *Spec-to-Evidence Loop* all fail. Break the
cluster with a preposition or a verb.

### SENT-7 · Keep the syntactic words
Do not drop articles, relative pronouns, or *that*, to save length. Cut content instead.

### SENT-8 · Punctuation
- **Em-dash: at most two in a whole lesson.** This number comes from `no-ai-slop` (none in short copy, one
  or two in a long piece). Lesson 0006b has 185. An em-dash almost always marks a second idea that wants
  its own sentence.
- No colon that introduces a dramatic reveal. A colon introduces a list or a definition.
- Lowercase after a colon, unless grammar, a proper noun, a title, or a code identifier requires a capital.
- No parenthetical that carries load-bearing content. If it matters, it is a sentence.
- No semicolon joining two independent clauses. Use two sentences.

## 5 · Paragraphs and structure

### PARA-1 · Length
Six sentences maximum. Three or four is better.

### PARA-2 · The point first
The first sentence of a paragraph states the paragraph's point. Do not build to it.

### PARA-3 · Teaching starts within 100 words
Counting from the `<h1>`, the reader must reach a sentence that teaches something within 100 words.

Provenance belongs in the footer, not the opening: why the document exists, how its claims are labelled,
which other document to read first, and which library version was used. Lesson 0006a spends about 380
words on exactly this before its first teaching sentence.

### PARA-4 · No writing about the writing
Delete any sentence whose subject is the lesson, the section, or the word being used. Failures from
shipped lessons: *here is the definition it deserves*, *the word earns its keep only if it excludes
things*, *call this what it is*, *worth memorizing*, *read it for what it is*.

### PARA-5 · Tables answer their own questions
A table cell states the answer and its reason. Do not put the answer in the table and the reason in a
paragraph below it.

### PARA-6 · One status table
Where `CLAUDE.md` Article III.9 requires implemented, prepared, or planned labels, they go in **one table**,
once, near the end of the lesson. They do not appear inline in prose. Article III.9 is amended
accordingly.

### PARA-7 · The closing compression is bounded

`CLAUDE.md` Article III.8 requires every lesson to close with an N-statement compression. The rule stands,
with a bound decided 2026-08-08:

- At most five sentences.
- At most 25 words per sentence.
- No Technical Name the lesson did not define.

`no-ai-slop` bans summary-recap conclusions. This is the one recorded exception, because a compression is
retrieval practice rather than rhetoric. The reasoning is in `docs/style/vendor/no-ai-slop.md`.

A compression that breaks the bound is not an exception. It is the lesson repeated. Lesson 0006a's
current closing runs to 178 words with a 46-word sentence, and fails.

## 6 · Banned constructions

These come from the `no-ai-slop` skill by Peter Yang, MIT licence, `github.com/petergyang/no-ai-slop`.
The rules are vendored, not installed, at `docs/style/vendor/no-ai-slop.md`, which carries the licence
notice, records what this course adopts and rejects, and explains one conflict with `CLAUDE.md` Article
III.8. Read it before changing anything in this section.

Every example below is from a shipped lesson.

### Rhetorical patterns

| # | Pattern | Example |
|---|---|---|
| BAN-1 | Throat-clearing opener | *Before any more architecture words, watch one job cross the intended system.* |
| BAN-2 | Faux-insight setup | *Read it for what it is:* |
| BAN-3 | Colon reveal: noun, colon, lowercase drama | *here is the definition it deserves:* |
| BAN-4 | Importance puffery | *The one-sentence version, worth memorizing* |
| BAN-5 | Weasel attribution | *a careful reader could mistake…* |
| BAN-6 | Synonym cycling for one referent | *the port*, *the seam*, *the line*, *the boundary*, *the contract*, in one section |
| BAN-7 | Fake-profound ending | *the call stack is upside-down relative to the architecture diagram, and that is fine* |
| BAN-8 | Binary contrast, negative list, rhetorical setup | *a lying ledger is worse than an empty one* |
| BAN-9 | Dramatic fragment, robotic rhythm | *Same English word; different layer, different owner, different lifetime.* |
| BAN-10 | Weak verb for a real action | *makes a decision* for *decides* |

### Metadiscourse

This is the largest single defect in lessons 0005 to 0006b. The source names four kinds, and all four are
present.

| # | Pattern | Example |
|---|---|---|
| BAN-11 | Interpretive metadiscourse — telling the reader what the text is doing | *Now the honest ledger — which of those nine moments exercise 05 actually contains* |
| BAN-12 | Authorial commentary — the writer's opinion of the material | *The sentence in lesson 0006 most likely to be over-read is…* |
| BAN-13 | Reader guidance — instructions on how to read | *State each layer's nature precisely, because two of these lines are easy to misread* |
| BAN-14 | Redundant glossing — restating a sentence in other words | *Call this what it is: a policy seed* |

Rule PARA-4 states the positive form: delete any sentence whose subject is the lesson, the section, or
the word being used.

### Formatting

| # | Pattern | Where it appears |
|---|---|---|
| BAN-15 | Decorative bold — a bold lead-in on every list item by habit | Nearly every `<ul>` from lesson 0003 onward |
| BAN-16 | Prose-worthy bullets — a list item holding three or more sentences | Lesson 0006a §3 and §7 |
| BAN-17 | Robotic symmetry — every item built to the same shape | Bold phrase, em-dash, elaboration, repeated down a whole list |
| BAN-18 | Summary-recap conclusion | Banned, except the bounded compression of PARA-7 |

Bold marks a defined term at first use. It does not mark emphasis, and it does not open a bullet.

### Banned words

From the source: **delve, leverage, empower, streamline, robust, cutting-edge, paradigm shift, game
changer, transformative, supercharge, harness.**

Added for this course, each measured as overused in the shipped lessons: **earns its keep, deserves,
precisely, exactly (as intensifier), genuinely, actually (as intensifier), honest / honestly, careful
reader, worth noting, it is worth, load-bearing, in passing, one more, deconfusion.**

An added word is allowed where it is literally accurate. *Exactly five decisions* passes, because there
are five. *Exactly the overclaim this primer exists to prevent* fails.

## 7 · Budgets

| Budget | Limit |
|---|---|
| Lesson body | **2,000 words.** Over that, split the lesson. |
| Reading time | 45 to 60 minutes including the lab, per `CLAUDE.md` Article II.4 |
| New Technical Names per lesson | **6.** More than six means the lesson teaches more than one thing. |
| Mermaid diagrams | 1 to 3. A fourth diagram usually means the lesson should split. |
| Sentences over 25 words | **0** |
| Em-dashes | 1 per paragraph |

The word budget is the rule that makes the others possible. Plain diction cannot fix a document that
is 7,800 words long.

## 8 · Conformance

`tools/lesson-lint.mjs` checks this profile and exits non-zero on any violation. It reports the rule ID.

**Checked mechanically:** SENT-1, SENT-5, SENT-6, SENT-7, SENT-8, PARA-1, PARA-3, TERM-1 (a term note
exists and a `<dfn>` appears at first use), TERM-4, PARA-7, the banned-word list, BAN-1 to BAN-5, BAN-9,
BAN-15, BAN-16, BAN-17, and every budget in section 7.

**Needs human or agent judgment:** SENT-2, SENT-3, SENT-4, PARA-2, PARA-4, PARA-5, PARA-6, TERM-2,
TERM-3, TERM-5, TERM-6, BAN-6, BAN-7, BAN-8, BAN-10, BAN-11 to BAN-14, BAN-18. The linter flags
candidates for these and does not fail the build on them.

### The review interface

A rewrite runs in two passes, taken from the source skill's two modes.

1. **Detect.** Name each pattern, quote the line, give the fix in one sentence. Do not rewrite. This pass
   covers the judgment rules, which the linter cannot decide.
2. **Edit.** Apply the fixes. Output the full revised text and a short "What changed" section.

Keeping the passes separate stops a rewrite from quietly deciding that a violation was acceptable.

### Calibration, measured 2026-08-08

Calibrated against lesson 0001, the closest shipped text to this profile. Warnings across the eight
lessons fell from 417 to 178 after three fixes. The `-ing` check stopped firing on *everything* and
*nothing*. The noun-cluster check gained a determiner anchor and a function-word filter. Callout labels
stopped gluing onto the first sentence of their block, which had been inflating word counts.

Known limits, stated rather than hidden:

- **SENT-6 has low precision even after calibration.** It returns nothing on lesson 0001 and three hits
  on 0006a, and those three are verb phrases rather than true noun clusters. Real detection needs
  part-of-speech tagging, which the linter does not have. It stays WARN-only. Treat it as a prompt to
  look, not as a finding.
- **SENT-1 applies a flat 25-word limit.** The linter does not separate lab instructions from
  explanation, so the 20-word procedural limit is not enforced mechanically. Judge it.
- **SENT-3 passive voice is not implemented.** It remains a judgment rule.

The linter is satisfiable. A conforming fixture exits 0. All eight shipped lessons exit 1.

Block splitting is why the sentence counts can be trusted. A document split on full stops alone turns a
bullet list into one 62-word sentence. The linter splits on block boundaries first.

### Baseline, 2026-08-08

| Lesson | Words | Errors | Warnings |
|---|---|---|---|
| Lesson | Words | Errors | Warnings |
|---|---|---|---|
| 0001 | 1,607 | 21 | 10 |
| 0002 | 1,613 | 19 | 12 |
| 0003 | 1,647 | 19 | 16 |
| 0004 | 1,881 | 21 | 12 |
| 0005 | 2,917 | 35 | 17 |
| 0006 | 3,860 | 60 | 33 |
| **0006a** | **1,579** | **0** | **6** |
| 0006b | 7,942 | 105 | 71 |

Word counts here are lower than section 1's, because the linter excludes code blocks and diagrams and
counts prose only.

0006a was rewritten on 2026-08-08, from 4,088 words and 60 errors to 1,320 words and none. Three linter
bugs surfaced during that rewrite and were fixed: `<button>` was not a block boundary, so four quiz
options concatenated into one 45-word sentence; markdown tables were not split into cells, so a table
read as one 107-word sentence; and *wiring*, *routing* and *streaming* were treated as participles when
this course uses them as nouns. The other lessons' counts moved because of those fixes, not because
their text changed.

A second pass on 0006a closed the largest remaining gap. Quiz feedback lives in `data-why` attributes,
and the linter had never seen it. It is now graded like any other prose, which is why every lesson's word
count rose: 0006b gained 1,273 previously invisible words and 20 errors. That prose is what a learner
reads immediately after answering, so leaving it ungraded made the earlier numbers flattering.

## 9 · What this profile cannot do

It controls diction. It does not decide what to leave out. The bulk problem in lessons 0005 to 0006b is
scope: those words were all deliberately written. Only the budget in section 7 addresses that, and
applying it will force real losses — the status-labelling apparatus, the ownership matrices, and the
step-by-step walkthrough tables are the likely casualties.

## 10 · Related

- `docs/style/vendor/no-ai-slop.md` — the vendored pattern source, its licence, and the Article III.8
  conflict awaiting a decision.
- `CLAUDE.md` — the constitution. Article VIII makes this profile a shipping requirement.
- `wiki/course/course-pedagogy.md` — the defect record that explains how the drift happened.
- `wiki/GLOSSARY.md` — the Technical Names schema that TERM-1 depends on.
- `.scratch/lesson-clarity/sample-0006a-section2.html` — one section written before and after this
  profile. It predates section 6 and has not been rechecked against it.
