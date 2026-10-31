#!/usr/bin/env node
// Bridge the wiki half and the root half of .ua/knowledge-graph.json.
//
// /understand-knowledge builds the wiki graph with ids relative to wiki/
// (article:lessons/lesson-0001-…). /understand builds the root graph with
// repo-relative ids (file:lessons/0001-….html). The subdomain merge keeps
// both but adds no edge between them. This script reads each lesson map's
// frontmatter and adds:
//   article:lessons/<map>  --documents-->  file:<material>
//   article:lessons/<map>  --related---->  document:<lab>/README.md
// It is idempotent: run it after every /understand.
//
// Usage: node tools/ua-bridge-wiki.mjs [repo-root]
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(process.argv[2] ?? ".");
const uaDir = fs.existsSync(path.join(root, ".understand-anything"))
  ? path.join(root, ".understand-anything")
  : path.join(root, ".ua");
const graphPath = path.join(uaDir, "knowledge-graph.json");
const graph = JSON.parse(fs.readFileSync(graphPath, "utf8"));
const ids = new Set(graph.nodes.map((n) => n.id));
const have = new Set(graph.edges.map((e) => `${e.source}|${e.target}|${e.type}`));

const mapsDir = path.join(root, "wiki", "lessons");
const report = { added: 0, skippedExisting: 0, unresolved: [] };

function frontmatter(text) {
  const m = text.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  const out = {};
  if (!m) return out;
  for (const line of m[1].split(/\r?\n/)) {
    const kv = line.match(/^([A-Za-z_]+):\s*(.*)$/);
    if (kv) out[kv[1]] = kv[2].replace(/^["']|["']$/g, "").trim();
  }
  return out;
}

function add(source, target, type, weight) {
  if (!ids.has(source) || !ids.has(target)) {
    report.unresolved.push({ source, target, type });
    return;
  }
  const key = `${source}|${target}|${type}`;
  if (have.has(key)) { report.skippedExisting++; return; }
  graph.edges.push({ source, target, type, weight, direction: "forward" });
  have.add(key);
  report.added++;
}

for (const file of fs.readdirSync(mapsDir).filter((f) => f.endsWith(".md"))) {
  const fm = frontmatter(fs.readFileSync(path.join(mapsDir, file), "utf8"));
  const mapId = `article:lessons/${file.replace(/\.md$/, "")}`;
  if (fm.material) add(mapId, `file:${fm.material.split("\\").join("/")}`, "documents", 0.5);
  // A map with no lab writes a placeholder (lesson 0006b has "lab: —"), not a path.
  if (fm.lab?.startsWith("hermes-sdk-lab/")) {
    const lab = fm.lab.split("\\").join("/").replace(/\/$/, "");
    add(mapId, `document:${lab}/README.md`, "related", 0.5);
  }
}

fs.writeFileSync(graphPath, JSON.stringify(graph, null, 2));
console.log(`bridge: added ${report.added} edges, ${report.skippedExisting} already present, ${report.unresolved.length} unresolved`);
for (const u of report.unresolved) console.log(`  unresolved: ${u.source} -> ${u.target} (${u.type})`);
