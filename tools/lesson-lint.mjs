#!/usr/bin/env node
// lesson-lint — checks course material against docs/style/ste-profile.md.
//
//   node tools/lesson-lint.mjs                     # all lessons
//   node tools/lesson-lint.mjs lessons/0001-*.html # named files
//   node tools/lesson-lint.mjs --warnings          # show WARN as well as ERROR
//
// ERROR fails the build (exit 1). WARN never does: those rules are heuristic,
// or the profile marks them as needing judgment. Every finding names its rule id.
//
// No dependencies. Node 18+.

import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join, basename, resolve } from "node:path";

const ROOT = resolve(process.argv[1], "..", "..");
const args = process.argv.slice(2);
const SHOW_WARN = args.includes("--warnings") || args.includes("-w");
const files = args.filter((a) => !a.startsWith("-"));

// ---------------------------------------------------------------- rules data

// Profile section 6. Multi-word entries are matched as phrases.
const BANNED_WORDS = [
  // from no-ai-slop
  "delve", "leverage", "empower", "streamline", "robust", "cutting-edge",
  "paradigm shift", "game changer", "transformative", "supercharge", "harness",
  // added for this course, measured as overused
  "earns its keep", "earn its keep", "deserves", "genuinely", "load-bearing",
  "careful reader", "worth noting", "in passing", "deconfusion", "deconfuse",
];

// TERM-2: coinages the profile names explicitly.
const BANNED_COINAGES = [
  "policy seed", "honest ledger", "spine thread", "wire truth",
  "the three graphs", "layer accounting",
];

// BAN-1..BAN-9, the mechanically detectable ones.
const SLOP_PHRASES = [
  [/\bhere'?s the thing\b/i, "BAN-1", "throat-clearing opener"],
  [/\blet me be clear\b/i, "BAN-1", "throat-clearing opener"],
  [/\bbefore any more\b/i, "BAN-1", "throat-clearing opener"],
  [/\bthe uncomfortable truth\b/i, "BAN-1", "throat-clearing opener"],
  [/\bwhat most people get wrong\b/i, "BAN-2", "faux-insight setup"],
  [/\bhere'?s what nobody tells you\b/i, "BAN-2", "faux-insight setup"],
  [/\bread it for what it is\b/i, "BAN-2", "faux-insight setup"],
  [/\bcall (this|it) what it is\b/i, "BAN-2", "faux-insight setup"],
  [/\bhere is the \w+ it deserves\b/i, "BAN-3", "colon reveal"],
  [/\bworth memori[sz]ing\b/i, "BAN-4", "importance puffery"],
  [/\bplays? a vital role\b/i, "BAN-4", "importance puffery"],
  [/\bmarks? a pivotal moment\b/i, "BAN-4", "importance puffery"],
  [/\bthe one-sentence version\b/i, "BAN-4", "importance puffery"],
  [/\bexperts agree\b/i, "BAN-5", "weasel attribution"],
  [/\bstudies show\b/i, "BAN-5", "weasel attribution"],
  [/\ba careful reader (could|might|would)\b/i, "BAN-5", "weasel attribution"],
  [/\bit is worth (noting|saying|stating)\b/i, "BAN-4", "importance puffery"],
];

// PARA-3 proxy: meta content that belongs in the footer.
const META_MARKERS = [
  /\bwhy this (supplement|lesson|primer) exists\b/i,
  /\bhow every claim\b/i,
  /\bversion pin\b/i,
  /\brecommended order\b/i,
  /\bread (it|this) (after|before)\b/i,
  /\bthis (primer|supplement) (assumes|maps|advances)\b/i,
];

// Words ending in -ing that are not participles.
const NOT_PARTICIPLES = new Set([
  "everything", "nothing", "something", "anything", "during", "string", "thing",
  "king", "spring", "ring", "wing", "sing", "bring", "along", "morning",
]);

// Used to reject false noun clusters. Broad on purpose: a missed cluster is
// cheaper than a warning stream nobody reads.
const FUNCTION_WORDS = new Set(
  ("the a an and or but nor of in on at to from by with without into over under between within across " +
   "this that these those whom itself themselves ours yours " +
   "through before after above below is are was were be been being am do does did have has had can could " +
   "may might must shall should will would not no if then than as it its their his her our your my you we " +
   "they he she there here what which who whom whose when where why how all any both each few more most " +
   "other some such only own same too very just also however therefore because since while although though " +
   "unless until whether either neither for so yet via per about against toward towards upon among " +
   "still even yet again once always never often sometimes rather instead already still whose " +
   "runs run make makes made take takes use uses used using see sees say says said get gets go goes know " +
   "knows think comes come want look find finds tell ask asks work works seem seems feel try leave leaves " +
   "left call calls called need needs become becomes put keep keeps let lets hold holds bring begins shows " +
   "show hear write writes stand lose pay meet meets include includes continue set sets learn change " +
   "changes lead leads understand watch follow follows stop stops create creates speak read reads allow " +
   "allows add adds spend grow open opens win offer offers wait serve send sends expect build builds stay " +
   "fall cut reach remain remains lives live sits sit points point gives give").split(/\s+/)
);

// ---------------------------------------------------------------- utilities

function lineOf(src, offset) {
  let n = 1;
  for (let i = 0; i < offset && i < src.length; i++) if (src[i] === "\n") n++;
  return n;
}

function words(text) {
  return text.split(/\s+/).filter((w) => /[A-Za-z]/.test(w));
}

function sentences(text) {
  return text
    .split(/(?<=[.!?])\s+(?=[A-Z"'(“])/)
    .map((s) => s.trim())
    .filter((s) => words(s).length > 2);
}

function decode(s) {
  return s
    .replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'")
    .replace(/&[a-z]+;/g, " ");
}

const BLOCK_TAGS =
  "p|li|h1|h2|h3|h4|h5|h6|figcaption|td|th|dd|dt|blockquote|div|section|header|footer";

/**
 * Split an HTML lesson into prose blocks, each with its source line.
 * Blocks matter: splitting sentences across a whole document turns every
 * bullet list into one 62-word "sentence". That false positive is why this
 * function exists.
 */
function htmlBlocks(src) {
  // Blank out what is not prose, preserving offsets so line numbers stay true.
  const blanked = src.replace(
    /<(script|style|pre)\b[^>]*>[\s\S]*?<\/\1>/gi,
    (m) => m.replace(/[^\n]/g, " ")
  );

  const blocks = [];
  let buf = "";
  let start = 0;
  let i = 0;

  const emit = (raw, offset) => {
    const text = decode(raw.replace(/<[^>]*>/g, " ")).replace(/\s+/g, " ").trim();
    if (text) blocks.push({ text, line: lineOf(src, offset) });
  };

  const flush = () => {
    // A callout opens with a bold label: "<strong>Why this matters</strong> Hermes will…".
    // Without this split the label glues onto the first sentence and inflates it.
    const lead = /^\s*<strong>([\s\S]*?)<\/strong>([\s\S]*)$/.exec(buf);
    if (lead && words(decode(lead[1])).length <= 12) {
      emit(lead[1], start);
      emit(lead[2], start);
    } else {
      emit(buf, start);
    }
    buf = "";
  };

  const tagRe = new RegExp(`</?(?:${BLOCK_TAGS})\\b[^>]*>`, "gi");
  let m;
  while ((m = tagRe.exec(blanked)) !== null) {
    buf += blanked.slice(i, m.index);
    flush();
    i = m.index + m[0].length;
    start = i;
  }
  buf += blanked.slice(i);
  flush();
  return blocks;
}

function mdBlocks(src) {
  const noCode = src.replace(/```[\s\S]*?```/g, (m) => m.replace(/[^\n]/g, " "));
  const body = noCode.replace(/^---[\s\S]*?^---/m, (m) => m.replace(/[^\n]/g, " "));
  const blocks = [];
  let offset = 0;
  for (const chunk of body.split(/\n\s*\n/)) {
    const text = chunk.replace(/[#*>|`\-]+/g, " ").replace(/\s+/g, " ").trim();
    if (text) blocks.push({ text, line: lineOf(src, offset) });
    offset += chunk.length + 2;
  }
  return blocks;
}

// ---------------------------------------------------------------- registry

function loadTermRegistry() {
  const dir = join(ROOT, "wiki", "terms");
  const terms = [];
  if (!existsSync(dir)) return terms;
  for (const f of readdirSync(dir).filter((f) => f.endsWith(".md"))) {
    const src = readFileSync(join(dir, f), "utf8");
    const fm = /^---\r?\n([\s\S]*?)\r?\n---/.exec(src);
    if (!fm) continue;
    const get = (k) => (new RegExp(`^${k}:\\s*"?([^"\\n]+)"?`, "m").exec(fm[1]) || [])[1];
    const aliases = [];
    const aliasBlock = /^aliases:\s*\n((?:\s*-\s*.+\n)+)/m.exec(fm[1]);
    if (aliasBlock) {
      for (const a of aliasBlock[1].matchAll(/-\s*(.+)/g)) aliases.push(a[1].trim());
    }
    const term = get("term");
    if (!term) continue;
    terms.push({
      slug: basename(f, ".md"),
      term: term.trim(),
      aliases,
      lesson: (get("lesson") || "").trim(),
    });
  }
  return terms;
}

// ---------------------------------------------------------------- the checks

function lint(path, registry) {
  const src = readFileSync(path, "utf8");
  const isHtml = path.endsWith(".html");
  const blocks = isHtml ? htmlBlocks(src) : mdBlocks(src);
  const findings = [];
  const add = (sev, rule, line, msg, quote) =>
    findings.push({ sev, rule, line, msg, quote });

  const prose = blocks.map((b) => b.text).join(" ");
  const totalWords = words(prose).length;
  const lessonNo = (/^(\d{4}[a-z]?)-/.exec(basename(path)) || [])[1] || "";

  // ---- SENT-1 · sentence length, PARA-1 · paragraph length
  for (const b of blocks) {
    const ss = sentences(b.text);
    for (const s of ss) {
      const n = words(s).length;
      if (n > 30) add("ERROR", "SENT-1", b.line, `sentence of ${n} words (ceiling 30)`, s);
      else if (n > 25) add("ERROR", "SENT-1", b.line, `sentence of ${n} words (limit 25)`, s);
    }
    if (ss.length > 6)
      add("ERROR", "PARA-1", b.line, `paragraph of ${ss.length} sentences (limit 6)`, b.text.slice(0, 90));
  }

  // ---- SENT-8 · punctuation
  const emDashes = (prose.match(/—/g) || []).length;
  if (emDashes > 2)
    add("ERROR", "SENT-8", 1, `${emDashes} em-dashes in this file (limit 2)`);
  for (const b of blocks) {
    if (/;\s+[a-z]/.test(b.text) && /;\s+\w+\s+\w+\s+\w+/.test(b.text))
      add("WARN", "SENT-8", b.line, "semicolon may be joining two independent clauses", b.text.slice(0, 90));
  }

  // ---- SENT-5 · -ing clause openers (heuristic)
  // "Everything", "Nothing" and friends end in -ing without being participles.
  for (const b of blocks)
    for (const s of sentences(b.text)) {
      const first = (/^([A-Z][a-z]+ing)\b/.exec(s) || [])[1];
      if (!first) continue;
      if (NOT_PARTICIPLES.has(first.toLowerCase())) continue;
      add("WARN", "SENT-5", b.line, `sentence opens with "${first}"`, s.slice(0, 90));
    }

  // ---- SENT-6 · noun clusters over three words (heuristic)
  // A cluster is a determiner followed by three or more content words with no
  // function word between them: "the one-call policy seed". Four ordinary words
  // in a row are just English, so the determiner anchor is what makes this usable.
  for (const b of blocks) {
    for (const m of b.text.matchAll(
      /\b(?:the|a|an|this|that|each|every|its|their|our|your)\s+((?:[a-z]+(?:-[a-z]+)*\s+){2,4}[a-z]+(?:-[a-z]+)*)\b/g
    )) {
      const parts = m[1].trim().split(/\s+/);
      if (parts.length < 4) continue; // the rule is "over three words"
      if (parts.some((w) => FUNCTION_WORDS.has(w.replace(/-.*/, "")))) continue;
      if (parts.some((w) => /ly$/.test(w))) continue; // adverbs are not cluster members
      if (parts.some((w) => /(ed|es)$/.test(w) && w.length > 4)) continue; // likely a verb
      add("WARN", "SENT-6", b.line, `possible noun cluster of ${parts.length} words`, m[1].trim());
    }
  }

  // ---- Banned words and coinages
  for (const b of blocks) {
    for (const w of BANNED_WORDS) {
      const re = new RegExp(`\\b${w.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&")}\\b`, "i");
      if (re.test(b.text)) add("ERROR", "BAN-words", b.line, `banned word: "${w}"`, b.text.slice(0, 90));
    }
    for (const c of BANNED_COINAGES) {
      if (new RegExp(`\\b${c}\\b`, "i").test(b.text))
        add("ERROR", "TERM-2", b.line, `coinage: "${c}" — register it or delete it`, b.text.slice(0, 90));
    }
    for (const [re, rule, label] of SLOP_PHRASES) {
      const hit = re.exec(b.text);
      if (hit) add("ERROR", rule, b.line, `${label}: "${hit[0]}"`, b.text.slice(0, 90));
    }
  }

  // ---- BAN-15/16/17 · list formatting (HTML only)
  if (isHtml) {
    for (const list of src.matchAll(/<ul\b[^>]*>([\s\S]*?)<\/ul>/gi)) {
      const line = lineOf(src, list.index);
      const items = [...list[1].matchAll(/<li\b[^>]*>([\s\S]*?)<\/li>/gi)].map((m) => m[1]);
      if (items.length < 3) continue;
      const bolded = items.filter((it) => /^\s*<strong>/i.test(it)).length;
      if (bolded >= 3 && bolded / items.length > 0.5)
        add("WARN", "BAN-15", line, `${bolded}/${items.length} list items open with bold`);
      const shaped = items.filter((it) => /^\s*<strong>[\s\S]*?<\/strong>[\s\S]*—/.test(it)).length;
      if (shaped >= 3)
        add("WARN", "BAN-17", line, `${shaped} list items repeat the same bold-then-dash shape`);
      for (const it of items) {
        const t = decode(it.replace(/<[^>]*>/g, " ")).replace(/\s+/g, " ").trim();
        if (sentences(t).length >= 3)
          add("ERROR", "BAN-16", line, `list item holds ${sentences(t).length} sentences`, t.slice(0, 90));
      }
    }
  }

  // ---- PARA-3 · teaching starts early (proxy: preamble before the first h2)
  if (isHtml) {
    const h1 = src.search(/<h1\b/i);
    const h2 = src.search(/<h2\b/i);
    if (h1 >= 0 && h2 > h1) {
      const pre = htmlBlocks(src.slice(h1, h2)).map((b) => b.text).join(" ");
      const n = words(pre).length;
      if (n > 150)
        add("ERROR", "PARA-3", lineOf(src, h1), `${n} words before the first section (limit 150)`);
      for (const re of META_MARKERS)
        if (re.test(pre))
          add("WARN", "PARA-3", lineOf(src, h1), `meta content in the preamble: ${re.source}`);
    }
  }

  // ---- TERM-1 / TERM-4 · the term gate
  const introduced = registry.filter((t) => lessonNo && t.lesson === lessonNo);
  const dfns = isHtml ? [...src.matchAll(/<dfn\b[^>]*>([\s\S]*?)<\/dfn>/gi)] : [];
  const dfnText = dfns.map((d) => decode(d[1].replace(/<[^>]*>/g, "")).trim().toLowerCase());
  for (const t of introduced) {
    const names = [t.term, ...t.aliases].map((s) => s.toLowerCase());
    const used = names.some((n) => new RegExp(`\\b${n.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&")}\\b`, "i").test(prose));
    if (!used) continue;
    const defined = dfnText.some((d) => names.some((n) => d.includes(n)));
    if (!defined)
      add("ERROR", "TERM-1", 1, `"${t.term}" is introduced by this lesson but has no <dfn> at first use`);
  }
  if (introduced.length > 6)
    add("ERROR", "BUDGET-terms", 1, `${introduced.length} new terms registered to this lesson (limit 6)`);

  // ---- PARA-7 · the compression is bounded
  const comp = blocks.find((b) => /keep only \w+ sentences/i.test(b.text));
  if (isHtml && !comp) {
    add("WARN", "III.8", 1, "no closing compression found (Article III.8 requires one)");
  } else if (comp) {
    const ss = sentences(comp.text);
    if (ss.length > 5)
      add("ERROR", "PARA-7", comp.line, `compression has ${ss.length} sentences (limit 5)`);
    for (const s of ss) {
      const n = words(s).length;
      if (n > 25) add("ERROR", "PARA-7", comp.line, `compression sentence of ${n} words (limit 25)`, s.slice(0, 90));
    }
  }

  // ---- Budgets
  if (isHtml) {
    if (totalWords > 2000)
      add("ERROR", "BUDGET-words", 1, `${totalWords} words of body (limit 2000) — split the lesson`);
    const diagrams = (src.match(/<pre[^>]*class="[^"]*mermaid/gi) || []).length;
    if (diagrams === 0) add("ERROR", "ART-I.3", 1, "no Mermaid diagram (Article I.3 requires at least one)");
    if (diagrams > 3) add("WARN", "BUDGET-diagrams", 1, `${diagrams} diagrams (guideline 1 to 3)`);
  }

  return { path, findings, totalWords, blocks: blocks.length };
}

// ---------------------------------------------------------------- reporting

function targets() {
  if (files.length) return files.map((f) => resolve(f));
  const dir = join(ROOT, "lessons");
  if (!existsSync(dir)) return [];
  return readdirSync(dir).filter((f) => f.endsWith(".html")).sort().map((f) => join(dir, f));
}

const registry = loadTermRegistry();
const list = targets();
if (!list.length) {
  console.error("lesson-lint: no files to check");
  process.exit(2);
}

let errors = 0;
let warnings = 0;

for (const path of list) {
  const r = lint(path, registry);
  const errs = r.findings.filter((f) => f.sev === "ERROR");
  const warns = r.findings.filter((f) => f.sev === "WARN");
  errors += errs.length;
  warnings += warns.length;

  const rel = path.replace(ROOT + "\\", "").replace(ROOT + "/", "").replace(/\\/g, "/");
  const verdict = errs.length ? "FAIL" : "pass";
  console.log(`\n${verdict}  ${rel}  (${r.totalWords} words, ${errs.length} errors, ${warns.length} warnings)`);

  const show = SHOW_WARN ? [...errs, ...warns] : errs;
  const byRule = new Map();
  for (const f of show) {
    if (!byRule.has(f.rule)) byRule.set(f.rule, []);
    byRule.get(f.rule).push(f);
  }
  for (const [rule, fs] of [...byRule.entries()].sort()) {
    console.log(`  ${rule}  (${fs.length})`);
    for (const f of fs.slice(0, 6)) {
      console.log(`    ${rel}:${f.line}  ${f.msg}`);
      if (f.quote) console.log(`      > ${f.quote.slice(0, 110).replace(/\s+/g, " ")}`);
    }
    if (fs.length > 6) console.log(`    … ${fs.length - 6} more`);
  }
}

console.log(
  `\n${errors} error(s), ${warnings} warning(s) across ${list.length} file(s).` +
    (SHOW_WARN ? "" : "  Re-run with --warnings to see warnings.")
);
console.log("Rules: docs/style/ste-profile.md   Heuristic rules (SENT-5, SENT-6, semicolons) are WARN only.");
process.exit(errors ? 1 : 0);
