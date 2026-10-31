---
type: glossary-index
tags:
  - glossary
---

# Glossary

One Obsidian note per term under `wiki/terms/`, one map note per lesson under `wiki/lessons/`. Terms are wikilinked to each other and to their lesson map, so the **graph view** shows each lesson as a cluster.

**House rule:** a lesson that introduces a term creates its note at `status: introduced`. The note moves to `status: demonstrated` only after the learner uses the term correctly under pressure-testing. Creation is capture, and promotion is evidence.

## All terms

```dataview
TABLE term AS Term, category AS Category, status AS Status, choice(lesson, lesson, first_used) AS Lesson
FROM "wiki/terms"
WHERE type = "glossary-term"
SORT choice(lesson, lesson, first_used) ASC, term ASC
```

## By category

```dataview
TABLE rows.term AS Terms
FROM "wiki/terms"
WHERE type = "glossary-term"
GROUP BY category
```

## Awaiting promotion

Introduced but not yet demonstrated — retrieval-practice candidates for the next session. Reference notes are left out, and have their own view below.

```dataview
TABLE term AS Term, lesson AS Lesson, introduced AS Since
FROM "wiki/terms"
WHERE type = "glossary-term" AND status = "introduced" AND lesson
SORT introduced ASC
```

## Reference notes

Words the lessons use without a definition: demoted Technical Names, product names, code identifiers, and plain phrases that recur. Each note has `lesson: ""`, so the linter never asks a lesson for a `<dfn>`, and `first_used` names the lesson that first uses the word.

```dataview
TABLE term AS Term, category AS Category, first_used AS "First used", status AS Status
FROM "wiki/terms"
WHERE type = "glossary-term" AND !lesson
SORT first_used ASC, term ASC
```

## Lessons

```dataview
TABLE title AS Title, phase AS Phase, date AS Date
FROM "wiki/lessons"
WHERE type = "lesson-map"
SORT lesson ASC
```

## Frontmatter schema

| Field | Values |
|---|---|
| `term` | Display name of the term |
| `aliases` | Alternate names (Obsidian-native; searchable and linkable) |
| `type` | `glossary-term` |
| `lesson` | Zero-padded lesson id as a string, e.g. `"0001"`. Empty (`""`) for a reference note: the lint then counts it against no lesson's budget and asks for no `<dfn>` |
| `first_used` | Reference notes only: the lesson id that first uses the word, e.g. `"0022"` |
| `phase` | Curriculum phase number (0–6) |
| `category` | `protocol` · `sdk-layer` · `type-system` · `validation` · `hermes` |
| `status` | `introduced` → `demonstrated` |
| `introduced` | Date the lesson introduced the term |
| `demonstrated` | Date of demonstrated use (added on promotion) |
| `tags` | `glossary` + the category (drives graph-view color groups) |
