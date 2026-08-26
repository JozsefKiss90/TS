---
term: JSON Lines
aliases:
  - JSONL
type: glossary-term
lesson: "0011"
phase: 1
category: protocol
status: introduced
introduced: 2026-08-25
tags:
  - glossary
  - protocol
---

# JSON Lines

A file format that holds one complete JSON value per line.

The format is what makes a file appendable. One event is one line, an append never rewrites earlier lines, and the line number doubles as a sequence number. A writer that dies mid-run loses at most the line it was writing.

Each line is parsed on its own. One tampered or truncated line costs that line, not the file, which is why the [[trace]] reader can refuse line 7 and still read line 6.

**In [[lesson-0011-the-trace-is-what-happened|lesson 0011]]:** the trace sink appends `JSON.stringify(event)` plus a newline per event. The reader splits on newlines and runs [[safe-parse|safeParse]] per line.

**Why it matters for Hermes:** the control plane's run logs and cost ledgers want the same two properties. Append without rewriting, and lose one line instead of the record.

**Related:** [[trace]] · [[json-boundary]] · [[safe-parse]]
