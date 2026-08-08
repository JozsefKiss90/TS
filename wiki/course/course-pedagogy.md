---
type: course-doc
doc: pedagogy
title: The Pedagogy Record
date: 2026-07-25
normative: false
tags:
  - course
---

# The pedagogy record

**Purpose.** After lessons 0001–0004 shipped, two post-hoc documents proved necessary: a review (`lessons_review.md`) and a supplement (`learning-records/supplement-signature-trace-from-new-anthropic-to-message.html`). Both exist because the lessons, though coherent and correctly scoped, left explanatory gaps a careful learner had to have filled elsewhere. The constitution ([CLAUDE.md](../../CLAUDE.md)) was written so that **future lessons carry these explanations natively and supplements stay the exception**.

This note is the defect record behind that constitution: each gap, where it surfaced, and the Article that now closes it. It is rationale, not law — the law is in `CLAUDE.md`.

**Standing rule (Article VII):** a needed supplement is a defect signal. When one appears, add a row here, amend the matching Article, record the why in [NOTES.md](../../NOTES.md), and apply the fix from the next lesson forward. Shipped lessons are history — they are not retro-edited except on explicit user request.

## Gap → Article map

| # | Gap observed in lessons 0001–0004 | Evidence | Article now covering it |
|---|---|---|---|
| 1 | SDK-level code shown without the HTTP exchange underneath — lesson 0004 never contrasted the one-JSON-document response with the SSE body ("the missing bridge") | review § *JSON response versus event-stream response* | III.1 Wire truth |
| 2 | Change claims left un-decomposed — "streaming changes the contract" is true for three layers and false for six | review § *Does streaming change the contract?* | III.2 Layer accounting |
| 3 | API surface used without reading its declaration — `.create()`'s two overloads (return type selected by `stream: true`) were exercised but never explained | review § *What does `client.messages.create()` do?*; the entire supplement | III.3 Signature discipline |
| 4 | Signature vs. implementation conflated — what TypeScript checks vs. what the runtime does ("the SDK abstracts responsibilities away from your application code, not away from TypeScript") | supplement, opening callout | III.3 Signature discipline |
| 5 | Types shown without a typical runtime value beside them (`Message` as interface only) | review § *What exactly is a `Message`?* | III.4 Type + value pairing |
| 6 | Overloaded words unmarked — "message" carries four distinct meanings (request property, response object, stream event, `MessageStream`), "which contributes to the confusion" | review § *What exactly is a `Message`?*, opening table | III.5 Collision table |
| 7 | New abstraction introduced on new material — discriminated unions were explained at stream events although `ContentBlock`, already seen in lesson 0001, was the natural first instance | review § *What is a discriminated union?* | III.6 Seen-instance rule |
| 8 | Coined phrases inviting misreading — "two SDK surfaces for one wire format" was readable as *two SDKs* | review § *"Two SDK surfaces for one wire format"* | III.7 Deconfuse coinages |
| 9 | No separation of genuinely-new ideas from reprise, and no closing compression — the review had to extract "four genuinely new ideas" and "five statements" after the fact | review §§ *What lesson 4 is really adding*, *What to focus on before continuing* | III.8 New-vs-reprise + compression |
| 10 | SDK excerpts not version-pinned in the material itself — generated surfaces drift, so unpinned excerpts rot silently | supplement, version-pin callout (`@anthropic-ai/sdk` 0.113.0, no `^`/`~`) | IV.1 Version pin |
| 11 | Course-level: no stated thematic spine — terminal skills and their use in Hermes OS left implicit; the Hermes connection lived in scattered "Hermes relevance" fragments | user review, 2026-07-25 | II (mission callout names spine thread + scenario step); [[course-spine]]; [[hermes-integration]] |
| 12 | System context invoked before it was taught, and future capabilities left unlabeled — lesson 0006 leaned on "Hermes policy — routing, provider, model choice" (S4) without the architecture picture that makes "policy" operational, and without marking which capabilities exist in exercise 05 versus which are only planned; a careful reader could mistake the one-call policy seed for a routing engine, budget system, or trace (the §4 phrase "the fake is the second provider" compounded it — narrowed 2026-07-29) | supplement [0006a](../../lessons/0006a-hermes-architecture-primer.html); user request, 2026-07-29 | III.9 Present-vs-planned labeling; [[course-architecture]] as the standing reference |
| 13 | The wider system invoked without its record — 0006a closed the *code-seam* gap (row 12) but still assumed the surrounding Hermes OS was defined somewhere: the course said "job", "supervisor", "routing", "Spec-to-Evidence Loop" while the governance record that actually defines them (PDR-001, ADR-0001..0021, accepted 2026-07-05) was never surfaced, so a careful reader could not answer *what is a Hermes job, what lifecycle does it follow, when is the Model Gateway actually needed* — and could not see that the real Wave-1 slice reached review with zero model calls; the code-graded implemented/seeded/planned scale also cannot grade governance claims (a document mentioning a concept is not "implemented") | supplement [0006b](../../lessons/0006b-the-hermes-control-plane.html); user request, 2026-07-30 | III.9 as amended 2026-07-30: system-of-record claims graded accepted/scaffolded/planned/proposed-clarification/open-decision against the governing PDR/ADRs; durable reference `docs/hermes_os/architecture/hermes-job-control-plane.md` |

## What was already right (kept, now pinned)

The user's 2026-07-25 review confirmed the **quizzes and exercises are at the right level**. Article V therefore pins the shipped calibration as the standard — four questions, equal-length options, immediate automatic feedback, no format clues, plus a classification exercise and a say-it-in-your-own-words section — rather than inviting redesign. Likewise kept: one tangible win per lesson, ~45–60 min sizing, mock-first labs, feedback-first authoring (never generate a course in advance).
