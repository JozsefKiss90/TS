# Building the course knowledge graph with Understand Anything

How to build one merged knowledge graph of the course, covering the wiki, the lessons and the lab, with the Understand Anything plugin.

## How the work is split

Each source goes through exactly one analyzer, so nothing enters the graph twice.

| Source | Analyzer | Why |
|---|---|---|
| `wiki/` (terms, lesson maps, course docs) | `/understand-knowledge` | Reads `[[wikilinks]]` and groups notes by the sections of `wiki/index.md` |
| `lessons/*.html`, `hermes-sdk-lab/`, `docs/adr/`, root governing files | `/understand` | Builds a file graph with layers and a tour |

`.ua/.understandignore` keeps `wiki/` and generated lab output (`runs/`, `traces/`, `artifacts/`) out of the root run. Read that file for the full list.

## Before every run

1. Commit your work. The graph records the commit it was built from and uses it to detect staleness.
2. Check that the wiki index is current:

   ```
   node tools/build-wiki-index.mjs --check
   ```

   If it reports stale, run `node tools/build-wiki-index.mjs` and commit `wiki/index.md`.

## Steps

### 1. Build the wiki graph

```
/understand-knowledge wiki
```

Output: `wiki/.ua/knowledge-graph.json`. Expect about 10–15 analysis agents, 3 at a time. The dashboard opens when the run finishes.

Check in the dashboard:

- Six layers: Course governance and Phases 0–4.
- The tour runs from governance through Phase 4.

Five links in existing notes do not resolve in the plugin's parser. Four use a `#heading` anchor, and one is an aliased link inside a table. Obsidian resolves them. They are missing from the graph.

### 2. Hand the wiki graph to the root run

```
cp wiki/.ua/knowledge-graph.json .ua/wiki-knowledge-graph.json
```

The root run only merges files named `*knowledge-graph*.json` in `.ua/`.

### 3. Build the root graph and merge

```
/understand
```

The run merges the wiki graph first, then analyzes the lessons, the lab and the ADRs. It pauses once to confirm `.ua/.understandignore`. Confirm it unchanged unless you want to add `docs/hermes_os/`.

### 4. Check the merge

Open the dashboard with `/understand-dashboard` and follow links from a lesson file to its term notes.

This step decides whether the merge worked. It has not been tested on this repo. Wiki node IDs are relative to `wiki/` (`article:terms/<slug>`), while root node IDs use repo paths (`document:lessons/…`). If no links join the two halves, the result is two graphs side by side. The fix then is a small script that adds edges from each lesson map to its files, using the `material:` and `lab:` fields in its frontmatter.

## Optional, after the merge

| Command | Result | Note |
|---|---|---|
| `/understand-domain` | The S1–S9 integration scenario as a flow graph | Derived from the merged graph, so it is cheap |
| `/understand-onboard` | One written guide built from the merged graph | Run `node tools/lesson-lint.mjs <file>` before you save it under `wiki/` |
| `/understand-chat <question>` | Answers grounded in the graph | For study sessions |
| `/understand-explain <path>` | A deep dive into one file | For example, one lab module |

## Refreshing after new lessons

1. Run `node tools/build-wiki-index.mjs` and commit.
2. Repeat steps 1–3. `/understand` updates only what changed since the recorded commit.

## What git tracks

`.gitignore` ignores everything in `.ua/` except `.understandignore`, and all of `wiki/.ua/`. The graphs are rebuilt, never committed.
