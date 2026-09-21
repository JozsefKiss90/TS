# Exercise 10 — evidence with provenance, tested without an LLM

Lessons 0014 and 0015 share this lab. Lesson 0014 built the server that
answers with evidence carrying provenance. Lesson 0015 proves the whole
surface with no model, no key and, for all but one test, no pipe.

| File | Role | Lesson |
|---|---|---|
| `src/evidence.ts` | the evidence schema, designed against W3C PROV-DM; dev_graph's five confidence labels | 0014 |
| `src/graph-port.ts` | `KnowledgeGraph`, the port, in Hermes's words only | 0014 |
| `src/export-adapter.ts` | parses `data/graph-export.json` in dev_graph's spellings and translates once | 0014 |
| `src/build-server.ts` | `buildServer(graph)`: the tool with its `outputSchema` and the resource template, over any port | 0015 |
| `src/server.ts` | the wiring: which adapter, which transport (stdio) | 0014, split in 0015 |
| `src/fake-graph.ts` | `FakeKnowledgeGraph`: answers from a list, records queries, parses nothing | 0015 |
| `src/fixtures.ts` | `RecordedCallSchema` and `loadFixture`: a recorded call is parsed on the way in | 0015 |
| `src/record-fixtures.ts` | `pnpm record`: the real adapter under a real client, in memory, written to `fixtures/` | 0015 |
| `src/client.ts` | `pnpm client`: a scripted MCP client over stdio, parsing the bundle on its own side | 0015 |

`data/graph-export.json` is a hand-written stand-in for dev_graph's `graph.json`,
the offline export a Python script regenerates. The real exporter stays Python.
Hermes only ever sees its bytes.

Verified with `@modelcontextprotocol/client` 2.0.0, `@modelcontextprotocol/server`
2.0.0, `zod` 4.4.3, `vitest` 3.2.7, `@modelcontextprotocol/inspector` 2.4.0,
Node 22.14.0, on 2026-09-20. Timings below are one machine, one run.

## Setup

```
pnpm install        # once, at the hermes-sdk-lab root
pnpm typecheck      # in this folder — expect silence
```

## Step 1 — the scripted client

```
pnpm client
```

Measured output:

```
dev-graph-evidence serving on stdio
connected to dev-graph-evidence in 864 ms
tool search_evidence: outputSchema present
search "gate": 3 item(s) from JsonExportAdapter@dev-graph-2026-09-09
  MOD-001 [confirmed] 2 source(s)
  MOD-003 [single-source] 1 source(s)
  MOD-005 [single-source] 1 source(s)
search "kubernetes": 0 item(s) from JsonExportAdapter@dev-graph-2026-09-09
resource MOD-001: application/json, 504 bytes
closed; the server process ends with the pipe
```

Match each line to a call in `src/client.ts`. The first line is the server's
stderr, inherited by the client. Everything after `connect` is one method call.
`result.structuredContent` is `unknown`; `EvidenceBundleSchema.parse` is what
makes it a bundle, and it runs the two-sources refinement the wire never carried.

## Step 2 — run the suite

```
pnpm test           # 32 tests, 6 files
```

Measured, in order of cost:

| File | Tests | Time | What it proves |
|---|---|---|---|
| `evidence.test.ts` | 10 | 29 ms | the schema's rules, no file, no server |
| `fake-graph.test.ts` | 3 | 16 ms | the fake answers, stamps, records, and misses without a throw |
| `export-adapter.test.ts` | 8 | 38 ms | the file boundary and the translation |
| `fixtures.test.ts` | 5 | 118 ms | fixtures parse on read, tampering is refused, a replay matches |
| `server-in-memory.test.ts` | 5 | 141 ms | the whole server under a real client, over the fake, no pipe |
| `client-stdio.test.ts` | 1 | 1,130 ms | spawn, handshake, stdout discipline, shutdown with the pipe |

Read the last two rows together. The in-memory suite proves the handler and
the protocol at 7 ms per call. The one stdio test proves the three things only
a child process can: the wiring starts, stdout carries frames and nothing else,
and a closed pipe stops the process. Keep one of it.

Three tests to read:

- `server-in-memory.test.ts`, "refuses in-band": a fake holds an item marked
  `confirmed` with one source. It is well typed, so the fake serves it. The
  server's output parse refuses the whole answer:
  `Output validation error: Invalid structured content for tool search_evidence:
  items.0.provenance.confidence: confirmed needs at least two sources`.
  Lesson 0014's break experiment 1, as a test, with no edit to the server.
- `fixtures.test.ts`, "runs the two-sources refinement on read": MOD-003 promoted
  by hand to `confirmed` in the raw JSON is refused before any replay.
- `fixtures.test.ts`, "serves the recorded items back": the replay's items equal
  the recording. `assembledBy.adapter` reads `FakeKnowledgeGraph`, and the test
  says so.

## Step 3 — record, then diff

```
pnpm record
git diff fixtures/
```

Three files: `search-gate.json` (3 items), `search-kubernetes.json` (0 items,
a recorded miss), `search-trace-limit-1.json` (1 item). The adapter runs under a
fixed clock, so only `recordedAt` changes. Anything else in the diff means the
graph, the adapter or the schema moved.

## Step 4 — the older two ways, still there

```
# Git Bash                                  # PowerShell
npx tsx src/server.ts < probe.jsonl         Get-Content probe.jsonl | pnpm exec tsx src/server.ts
pnpm inspect
```

The lesson-0014 probe still draws six answers from the refactored server, ids
1, 2, 5, 6, 3, 4 on our run, and the Inspector still lists eight resources.

## Break experiments

Predict each outcome before you run.

1. **Drop the client's parse.** In `src/client.ts`, replace
   `EvidenceBundleSchema.parse(result.structuredContent)` with a cast,
   `result.structuredContent as EvidenceBundle`. Typecheck passes and the run
   prints the same lines. Then promote MOD-003 to `confirmed` in
   `data/graph-export.json` and run again. Measured: the server refuses at
   wiring, as in lesson 0014, so the cast is never tested. Now revert the export
   and edit `fixtures/search-gate.json` the same way, then run `pnpm test`.
   Measured: `fixtures.test.ts` fails at load with the two-sources message. The
   cast would have accepted the file. Revert both.
2. **Break the spawn.** In `tests/client-stdio.test.ts`, change `src/server.ts`
   to `src/nope.ts`. Measured: the one stdio test fails, the five in-memory tests
   stay green. That is the split the two suites exist for. Revert.
3. **Make the fake throw on a miss.** In `src/fake-graph.ts`, throw when
   `items` is empty after the filter. Measured: "answers a miss with an empty
   bundle" fails, and `readResource` for a known id still passes. A miss is an
   answer the loop must read, and the port's contract says so. Revert.

## What this exercise does not do

No model, no API key, no network, no Python process. The loop does not consume a
bundle until lesson 0016.
