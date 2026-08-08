---
type: course-index
title: Course Governance & Semantics
date: 2026-07-25
tags:
  - course
---

# Course governance & semantics

This folder holds the course's **meaning and rules** in Obsidian-navigable form. The law itself lives in [CLAUDE.md](../../CLAUDE.md) — the constitution every authoring session loads automatically. These notes carry what the constitution points at: the spine, the Hermes OS integration, the pedagogical defect record, and the module graphs.

**Division of labor:** `CLAUDE.md` defines *what a lesson must be*. This folder defines *what the course means* — and records *why* the constitution says what it says. On any conflict, `CLAUDE.md` wins; fix the conflict rather than living with it.

## Read order for a new session

1. [[course-spine]] — what the course builds, the terminal skills, and where each one is used. Read before authoring anything.
2. [[hermes-integration]] — the use case: how TypeScript and the SDKs become integral parts of Hermes OS, and the one-job scenario every lesson anchors to.
3. [[course-module-graph]] — the phases and lesson modules as graphs; mirror of [ROADMAP.md](../../ROADMAP.md).
4. [[course-architecture]] — the control-plane architecture reference: layers and ownership at the model boundary, "policy" defined operationally, the implemented/seeded/planned ledger. Link lessons here instead of re-explaining architecture (Article III.9).
5. [[course-pedagogy]] — the founding defect record behind the constitution's explanation standards. Read when amending the constitution, not before every lesson.

## Notes in this folder

```dataview
TABLE title AS Title, doc AS Role, normative AS Normative, date AS Since
FROM "wiki/course"
WHERE type = "course-doc"
SORT doc ASC
```

## Frontmatter schema

| Field | Values |
|---|---|
| `type` | `course-doc` (this index: `course-index`) |
| `doc` | `spine` · `integration` · `architecture` · `pedagogy` · `module-graph` |
| `title` | Display title |
| `date` | Date created |
| `normative` | `true` if lessons must conform to it; `false` if it is record/mirror |
| `tags` | `course` (+ `governance` on normative notes) |

## Maintenance duties

- When a lesson ships: flip its status in [ROADMAP.md](../../ROADMAP.md) **and** in [[course-module-graph]].
- When a phase opens: assign lesson ids in both places; extend the phase's module graph.
- When a pedagogical gap is found (a lesson needed a supplement or post-hoc review to be understood): add a row to [[course-pedagogy]], amend the matching Article in `CLAUDE.md`, and record the why as a dated update in [NOTES.md](../../NOTES.md).
