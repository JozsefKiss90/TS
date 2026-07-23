---
type: glossary-index
tags:
  - glossary
---

# Glossary

One Obsidian note per term under `wiki/terms/`, one map note per lesson under `wiki/lessons/`. Terms are wikilinked to each other and to their lesson map, so the **graph view** shows each lesson as a cluster.

**House rule:** a term note is created at `status: introduced` when a lesson introduces it, and flipped to `status: demonstrated` only after the learner uses it correctly under pressure-testing. Creation is capture; promotion is evidence.

## All terms

```dataview
TABLE term AS Term, category AS Category, status AS Status, lesson AS Lesson
FROM "wiki/terms"
WHERE type = "glossary-term"
SORT lesson ASC, term ASC
```

## By category

```dataview
TABLE rows.term AS Terms
FROM "wiki/terms"
WHERE type = "glossary-term"
GROUP BY category
```

## Awaiting promotion

Introduced but not yet demonstrated — retrieval-practice candidates for the next session.

```dataview
TABLE term AS Term, lesson AS Lesson, introduced AS Since
FROM "wiki/terms"
WHERE type = "glossary-term" AND status = "introduced"
SORT introduced ASC
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
| `lesson` | Zero-padded lesson id as a string, e.g. `"0001"` |
| `phase` | Curriculum phase number (0–6) |
| `category` | `protocol` · `sdk-layer` · `type-system` · `validation` · `hermes` |
| `status` | `introduced` → `demonstrated` |
| `introduced` | Date the lesson introduced the term |
| `demonstrated` | Date of demonstrated use (added on promotion) |
| `tags` | `glossary` + the category (drives graph-view color groups) |
