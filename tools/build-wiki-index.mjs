#!/usr/bin/env node
// build-wiki-index — writes wiki/index.md from the wiki's own frontmatter.
//
//   node tools/build-wiki-index.mjs           # write wiki/index.md
//   node tools/build-wiki-index.mjs --check   # exit 1 if wiki/index.md is stale
//
// Why: the Understand Anything plugin's /understand-knowledge only runs on a
// wiki that has an index.md. Each `## ` heading becomes one topic group (and
// one dashboard layer), and the heading order becomes the guided tour. So the
// sections run governance first, then one section per phase, in course order.
//
// The output must pass tools/lesson-lint.mjs, because wiki/ is course material.
// Headings use a colon instead of an em-dash. Rows are tables (see `table`).
//
// Everything is derived: lesson maps (wiki/lessons, type: lesson-map), term
// notes (wiki/terms, type: glossary-term), course docs (wiki/course), and
// phase names (the `## Phase N — Name — status` headings in ROADMAP.md).
// Never edit wiki/index.md by hand; rerun this script.
//
// No dependencies. Node 18+.

import { readFileSync, readdirSync, writeFileSync, existsSync } from "node:fs";
import { join, resolve, basename } from "node:path";

const ROOT = resolve(process.argv[1], "..", "..");
const WIKI = join(ROOT, "wiki");
const OUT = join(WIKI, "index.md");
const CHECK = process.argv.includes("--check");

// The read order COURSE.md recommends. Course docs not listed here are
// appended alphabetically, so a new doc still lands in the index.
const GOVERNANCE_ORDER = [
  "COURSE",
  "course-spine",
  "hermes-integration",
  "course-module-graph",
  "course-architecture",
  "course-pedagogy",
];

// ------------------------------------------------------------- frontmatter

// Flat `key: value` pairs only — enough for this wiki's schema (wiki/GLOSSARY.md).
// List values (tags) are skipped; nothing below needs them.
function frontmatter(path) {
  const text = readFileSync(path, "utf8").replace(/\r\n/g, "\n");
  const m = text.match(/^---\n([\s\S]*?)\n---/);
  if (!m) return {};
  const fm = {};
  for (const line of m[1].split("\n")) {
    const kv = line.match(/^([A-Za-z_][\w-]*):\s*(.*)$/);
    if (kv) fm[kv[1]] = kv[2].trim().replace(/^["']|["']$/g, "");
  }
  return fm;
}

function notes(dir) {
  return readdirSync(join(WIKI, dir))
    .filter((f) => f.endsWith(".md"))
    .map((f) => ({ slug: basename(f, ".md"), ...frontmatter(join(WIKI, dir, f)) }));
}

// ROADMAP.md headings look like `## Phase 2 — Graph RAG through MCP — *complete…*`.
// Keep the name, drop the status: the index must not go stale when a status flips.
function phaseNames() {
  const names = new Map();
  const roadmap = readFileSync(join(ROOT, "ROADMAP.md"), "utf8");
  for (const m of roadmap.matchAll(/^## Phase (\d+) — ([^—\n]+?)\s*(?:—|$)/gm)) {
    names.set(Number(m[1]), m[2].trim());
  }
  return names;
}

// ------------------------------------------------------------------ build

const lessons = notes("lessons").filter((n) => n.type === "lesson-map");
const terms = notes("terms").filter((n) => n.type === "glossary-term");
const course = notes("course");
const phases = phaseNames();

const rank = (slug) => {
  const i = GOVERNANCE_ORDER.indexOf(slug);
  return i === -1 ? GOVERNANCE_ORDER.length : i;
};
course.sort((a, b) => rank(a.slug) - rank(b.slug) || a.slug.localeCompare(b.slug));

// "0006a" sorts after "0006" and before "0007" under plain string compare.
lessons.sort((a, b) => a.lesson.localeCompare(b.lesson));
// Same rule as the glossary's DataView: `lesson` if set, else `first_used`.
const lessonOf = (n) => n.lesson || n.first_used || "";
terms.sort(
  (a, b) =>
    lessonOf(a).localeCompare(lessonOf(b)) ||
    (a.term || a.slug).localeCompare(b.term || b.slug),
);

// Number("") is 0, so test for an empty field before converting.
const phaseOf = (n) => (/^\d+$/.test(n.phase ?? "") ? Number(n.phase) : null);

// Rows are markdown tables, never lists. Two reasons:
//  - lesson-lint splits sentences only before a capital letter, so a list of
//    `[[links]]` reads as one long sentence. It checks table cells one by one.
//  - an alias pipe inside a table must be escaped as `\|`, and the plugin's
//    parser then reads the target as `slug\` and fails to resolve it. So each
//    link is a bare [[slug]] and the display name sits in its own column.
const table = (head, rows) => [
  `| ${head.join(" | ")} |`,
  `| ${head.map(() => "---").join(" | ")} |`,
  ...rows.map((r) => `| ${r.join(" | ")} |`),
];

const lines = [
  "---",
  "type: wiki-index",
  "generated_by: tools/build-wiki-index.mjs",
  "tags:",
  "  - index",
  "---",
  "",
  "# Wiki index",
  "",
  "Every note in this wiki, grouped by course phase. Each phase lists its lesson maps first, then the terms it introduces.",
  "",
  "This file is generated. Run `node tools/build-wiki-index.mjs` after you add or move a note.",
  "",
  "## Course governance",
  "",
  ...table(
    ["Note", "Title"],
    [...course.map((n) => [`[[${n.slug}]]`, n.title || n.slug]), ["[[GLOSSARY]]", "Glossary"]],
  ),
];

const phaseIds = [...new Set([...lessons, ...terms].map(phaseOf))]
  .filter((p) => p !== null)
  .sort((a, b) => a - b);

for (const p of phaseIds) {
  const name = phases.get(p);
  lines.push("", `## Phase ${p}${name ? `: ${name}` : ""}`, "");

  const phaseLessons = lessons.filter((n) => phaseOf(n) === p);
  if (phaseLessons.length) {
    lines.push(
      ...table(
        ["Lesson", "Title", "Lesson map"],
        phaseLessons.map((n) => [n.lesson, n.title, `[[${n.slug}]]`]),
      ),
      "",
    );
  }

  const phaseTerms = terms.filter((n) => phaseOf(n) === p);
  if (phaseTerms.length) {
    lines.push(
      ...table(
        ["Term", "Category", "Lesson", "Note"],
        phaseTerms.map((n) => [n.term || n.slug, n.category || "", lessonOf(n), `[[${n.slug}]]`]),
      ),
    );
  }
}

// Notes that carry no usable phase would otherwise vanish from the index.
const orphans = [...lessons, ...terms].filter((n) => phaseOf(n) === null);
if (orphans.length) {
  lines.push("", "## Notes without a phase", "");
  lines.push(...table(["Note"], orphans.map((n) => [`[[${n.slug}]]`])));
}

const output = lines.join("\n") + "\n";

// ------------------------------------------------------------------ write

if (CHECK) {
  const current = existsSync(OUT) ? readFileSync(OUT, "utf8").replace(/\r\n/g, "\n") : "";
  if (current !== output) {
    console.error("wiki/index.md is stale. Run: node tools/build-wiki-index.mjs");
    process.exit(1);
  }
  console.log("wiki/index.md is up to date.");
} else {
  writeFileSync(OUT, output);
  console.log(
    `wiki/index.md: ${course.length + 1} governance notes, ${lessons.length} lesson maps, ` +
      `${terms.length} terms, ${phaseIds.length} phases` +
      (orphans.length ? `, ${orphans.length} without a phase` : ""),
  );
}
