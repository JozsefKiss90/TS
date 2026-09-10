# Exercise 10 — evidence with provenance

Lesson 0014's lab. Exercise 09's server, answering with evidence that says
where it came from. The server ships complete; the work is to read the two
parses that guard one answer, then break each of them.

Four source files:

| File | Role |
|---|---|
| `src/evidence.ts` | the evidence schema, designed against W3C PROV-DM; dev_graph's five confidence labels |
| `src/graph-port.ts` | `KnowledgeGraph`, the port, in Hermes's words only |
| `src/export-adapter.ts` | parses `data/graph-export.json` in dev_graph's spellings and translates once |
| `src/server.ts` | the MCP server: `search_evidence` with an `outputSchema`, `graph://evidence/{id}` |

`data/graph-export.json` is a hand-written stand-in for dev_graph's `graph.json`,
the offline export a Python script regenerates. The real exporter stays Python.
Hermes only ever sees its bytes.

Verified with `@modelcontextprotocol/server` 2.0.0, `zod` 4.4.3, `vitest` 3.2.7,
`@modelcontextprotocol/inspector` 2.4.0, Node 22.14.0, on 2026-09-10.

## Setup

```
pnpm install        # once, at the hermes-sdk-lab root
pnpm typecheck      # in this folder — expect silence
```

Note for the root: `pnpm-workspace.yaml` now lists `"1*"` as well as `"0*"`.
The old glob stopped matching at the tenth exercise.

## Step 1 — run the suite

```
pnpm test           # 18 tests, 2 files
```

Two tests refuse a row. Find them and say which boundary each one guards:

- `parseExport` refuses `confidence: "probably"` at `nodes[0].confidence`. That
  is the file boundary: bytes in dev_graph's vocabulary, checked before
  translation.
- `JsonExportAdapter` refuses a row marked `confirmed` with one source, at
  construction. That is the evidence boundary: the refinement in
  `ProvenanceSchema`, run on every translated item before any query can
  return it.

One more test to read: the JSON Schema conversion keeps `"confirmed"` and
`"minItems":1` and drops the two-sources rule. A refinement does not travel.

## Step 2 — drive it with raw JSON-RPC

```
# Git Bash
npx tsx src/server.ts < probe.jsonl

# PowerShell
Get-Content probe.jsonl | pnpm exec tsx src/server.ts
```

Seven frames in, six answers out, out of order (ids 1, 2, 5, 6, 3, 4 on our
run). Check:

1. The `tools/list` reply carries `outputSchema` beside `inputSchema`. Find the
   seven source kinds, `minItems: 1`, and the `date-time` format. Confirm the
   two-sources rule is not there.
2. The `search_evidence` call (id 3, `query: "gate"`) returns two channels:
   `content` with three text lines, and `structuredContent` with the bundle.
   Three items: MOD-001 `confirmed`, MOD-003 and MOD-005 `single-source`.
3. The miss (id 4, `query: "kubernetes"`) is not an error. `items` is empty and
   the text says `not in the graph`.
4. `graph://evidence/MOD-001` (id 5) is one item as JSON. Answer the three
   questions from it: who stands behind it, which activity produced it, what
   it was made from.
5. `graph://evidence/nope` (id 6) fails outside the result: a JSON-RPC `error`,
   code `-32603`, as in exercise 09.

## Step 3 — the Inspector

```
pnpm inspect
```

Run `search_evidence` with `query: "gate"`. The UI shows the structured result
separately from the text. Then list the resources: eight, one per canonical id,
each named by its claim.

## Break experiments

Predict each outcome before you run.

1. **Drop a field on the way out.** In `src/server.ts`, change the return to
   `structuredContent: { ...bundle, assembledBy: undefined }` and rerun step 2.
   Measured: id 3 comes back in-band, `isError: true`, text
   `Output validation error: Invalid structured content for tool search_evidence:
   assembledBy: Invalid input: expected object, received undefined`. The SDK
   parsed the answer after the handler and refused it on the same channel a bad
   argument uses. Revert.
2. **Claim confirmed on one source.** In `data/graph-export.json`, change
   MOD-003's `confidence` to `"confirmed"` and rerun step 2. Measured: no frames
   at all. The server throws at wiring, on stderr:
   `row MOD-003 rejected: ✖ confirmed needs at least two sources → at
   provenance.confidence`. Revert.
3. **Misspell the Python side.** Rename `source_paths` to `sourcePaths` on one
   row. Measured: no frames, and on stderr `graph export rejected: ✖ Invalid
   input: expected array, received undefined → at nodes[1].source_paths`. The
   file boundary speaks dev_graph's spellings, not Hermes's. Revert.

## What this exercise does not do

No model, no API key, no network, no Python process. The export is eight rows
in a JSON file. A fake adapter behind the same port, recorded evidence
fixtures, and a scripted client that parses the bundle on its own side arrive
in lesson 0015. The loop consumes a bundle in lesson 0016.
