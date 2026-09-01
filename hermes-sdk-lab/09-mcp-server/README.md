# Exercise 09 — a minimal MCP server

Lesson 0013's lab. You build nothing here at first: the server ships complete.
The work is to poke it three ways, from the rawest layer up.

The server (`src/server.ts`) exposes a miniature knowledge graph
(`src/graph.ts`): one tool, one static resource, one resource template. The
snapshot stands in for the real `dev_graph`, which is Python-side and stays
there.

Verified with `@modelcontextprotocol/server` 2.0.0, `zod` 4.4.3,
`@modelcontextprotocol/inspector` 2.4.0, Node 22.14.0, on 2026-09-02.

## Setup

```
pnpm install        # once, at the hermes-sdk-lab root
pnpm typecheck      # in this folder — expect silence
```

## Step 1 — drive it with raw JSON-RPC

The server reads frames from stdin and writes frames to stdout. `probe.jsonl`
holds seven frames. Pipe them in:

```
# Git Bash
npx tsx src/server.ts < probe.jsonl

# PowerShell
Get-Content probe.jsonl | pnpm exec tsx src/server.ts
```

Seven frames go in and six answers come out: the `initialized` notification has
no id, so it draws no response. Check each of these against your output:

1. The `initialize` response names the server and `protocolVersion` `2025-06-18`.
2. The `tools/list` response carries your Zod schema, converted to JSON Schema.
   Find `minLength`, the `default: 5`, and `required: ["query"]`.
3. The responses arrive out of order (ids 1, 2, 5, 6, 4, 3 on our run).
   A response matches its request by `id`, never by position.
4. The bad call (id 4, `query: 42`) fails inside the result: `isError: true`,
   with the Zod message. The SDK refused it before the handler ran.
5. The unknown node (id 6) fails outside the result: a JSON-RPC `error`
   object, code `-32603`.

## Step 2 — poke it with the Inspector UI

```
pnpm inspect
```

A browser opens. Connect, then: list the tools, run `search_nodes` with
`query: "gate"` (3 hits on this graph), list the resources, read
`graph://node/taskspec`, and try `query: 42` to see the refusal in the UI.

Press Ctrl+C in the terminal when done — the Inspector owns the server's
lifetime, and closing the pipe stops the process.

## Step 3 — script it with the Inspector CLI

The same checks, without a browser. Each command starts a fresh server,
asks one question, and exits:

```
npx @modelcontextprotocol/inspector@2.4.0 --cli npx tsx src/server.ts --method tools/list
npx @modelcontextprotocol/inspector@2.4.0 --cli npx tsx src/server.ts --method tools/call --tool-name search_nodes --tool-arg query=spec
npx @modelcontextprotocol/inspector@2.4.0 --cli npx tsx src/server.ts --method resources/templates/list
```

The middle command returns one text block: `taskspec · TaskSpec schema ·
implemented`. Inspector 2.4.0 wants Node ≥ 22.19; on 22.14 it prints an
`EBADENGINE` warning and works anyway.

## Break experiments

Predict each outcome before you run.

1. **Log to stdout.** Add `console.log("searching…")` at the top of the
   `search_nodes` handler and rerun step 1. The bare line lands between two
   frames — the corruption is visible on the wire. Measured: the raw probe
   still answers, and Inspector 2.4.0 skips the line. The rule stands anyway:
   the transport owns stdout, and nothing obliges other clients to recover.
   Revert.
2. **Drop a required field.** In `probe.jsonl`, delete `"query":42` from the
   id-4 frame entirely. The refusal's tail changes from `received number` to
   `received undefined`. Same boundary, same guard.
3. **Widen the schema.** Change `limit`'s `.max(20)` to `.max(500)` and rerun
   the step-3 `tools/list`. The JSON Schema a client sees changes with it —
   the schema travels; there is nothing to keep in sync by hand.

## What this exercise does not do

No model, no API key, no network socket. The graph is eight nodes in a
TypeScript file. Provenance fields, the evidence schema, and a real scripted
client arrive in lessons 0014 and 0015.
