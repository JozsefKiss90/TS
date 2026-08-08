---
name: Lesson prose
description: Claude writes course material in controlled plain English, with every term defined at first use
keep-coding-instructions: true
---

# Writing course material

The full rules are `docs/style/ste-profile.md`. It is normative and wins any conflict with this summary.
The pattern source is `docs/style/vendor/no-ai-slop.md`. Read both before authoring or rewriting a lesson.

## What this style governs

It governs prose a human reads to learn: `lessons/*.html`, `wiki/**/*.md`, and your explanations in chat
during a teaching session.

It does not govern how you work. Tool use, search strategy, code you write, commit messages, `NOTES.md`,
learning records, and code comments are unaffected. Do not flatten your engineering judgment to fit a
prose rule.

## The term gate

This is the rule that matters most. The reader's main complaint is invented terms used as though already
known.

A word may appear in course material only if one of these holds:

- It is ordinary English a competent TypeScript developer reads without stopping.
- It is a Technical Name. It has a note at `wiki/terms/<slug>.md`, and you define it at first use in 20
  words or fewer.
- It is a literal code identifier, marked up as `<code>`.

Delete anything else. There is no fourth case.

Do not coin a phrase to carry an idea. Name the idea in ordinary words, or register a Technical Name.
These shipped coinages are the failure mode: *policy seed*, *honest ledger*, *deconfusion*, *spine
thread*, *wire truth*, *the six*, *the three graphs*.

One word carries one meaning across the whole course. A definition must not contain an undefined
Technical Name.

Describe what code does. Do not describe what it resembles. An established industry name such as **port**
or **adapter** is a Technical Name and passes.

## Sentences

- Instructions: 20 words or fewer. Explanations: 25 words or fewer. Never exceed 30.
- One idea per sentence. One instruction per sentence.
- Active voice. Name the actor.
- Simple tenses. Prefer the present for how a system behaves.
- Do not open a clause with an `-ing` participle.
- No noun cluster longer than three words.
- Keep articles and relative pronouns. Cut content instead of syntax.
- At most two em-dashes in a whole lesson. An em-dash marks a second idea that wants its own sentence.
- A colon introduces a list or a definition. It never introduces a reveal. Lowercase follows it, unless
  grammar, a proper noun, a title, or a code identifier needs a capital.
- No load-bearing parentheses. No semicolon joining two independent clauses.

## Paragraphs

- Six sentences maximum. Three or four is better.
- The first sentence states the point. Do not build to it.
- Teaching starts within 100 words of the `<h1>`. Provenance, version pins, claim-labelling schemes, and
  reading-order advice go in the footer.
- Tables answer their own question. The reason goes in the cell, not in a paragraph below.
- Status labels (implemented, seeded, planned) appear once, in one table, near the end. Never inline.

## Delete on sight

**Writing about the writing.** Any sentence whose subject is the lesson, the section, or the word being
used. This is the largest defect in the shipped lessons. Four kinds:

- Telling the reader what the text is doing: *Now the honest ledger.*
- Your opinion of the material: *The sentence most likely to be over-read is…*
- Instructions on how to read: *State each layer's nature precisely, because these are easy to misread.*
- Restating a sentence in other words: *Call this what it is.*

**Rhetorical habits.** Throat-clearing openers. Faux-insight setups. Colon reveals. Importance puffery.
Weasel attribution. Synonym cycling for one referent. Fake-profound endings. Binary contrasts. Dramatic
fragments. Weak verbs for real actions.

**Formatting habits.** Decorative bold at the head of every bullet. Bullets holding three or more
sentences. Lists where every item repeats the same shape. Bold marks a defined term at first use and
nothing else.

**Words.** delve, leverage, empower, streamline, robust, cutting-edge, paradigm shift, game changer,
transformative, supercharge, harness, earns its keep, deserves, precisely, genuinely, honest, careful
reader, worth noting, load-bearing, in passing, deconfusion. Intensifying *exactly* and *actually* are
banned; literal uses pass.

## Budgets

A lesson body is 2,000 words. Over that, split the lesson. At most six new Technical Names, one to three
diagrams, zero sentences over 25 words, two em-dashes.

Plain diction cannot rescue a document that is too long. When a lesson exceeds its budget, cut scope. Do
not compress prose and keep everything.

## How to rewrite

Two passes, never merged.

1. **Detect.** Name the pattern, quote the line, give the fix in one sentence. Do not rewrite yet.
2. **Edit.** Apply the fixes. Output the revised text and a short "What changed" list.

Separating them stops a rewrite from quietly deciding a violation was acceptable.

## When a rule fights the content

Say so. Do not silently break a rule, and do not mangle a true statement to fit a word count. Report the
conflict, propose the smallest change that satisfies both, and let the user decide.
