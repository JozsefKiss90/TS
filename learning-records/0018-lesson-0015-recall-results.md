1. **Three guards**

| Guard | Where it runs | What it guards | Runs Zod refinements? |
|---|---|---|---|
| **Tool input guard** | Server side, before `search_evidence` handler | Bad client arguments: missing `query`, wrong `limit`, malformed request | No, this is the tool input contract |
| **MCP/tool output guard** | Server/MCP boundary, after handler returns | Handler returning something that is not shaped like tool output / `EvidenceBundle` | Mostly structural; refinements are not the guard to rely on here |
| **Explicit bundle parse** | Client, fixture recorder, fixture loader/tests | Hermes trusting malformed evidence | Yes: `EvidenceBundleSchema.parse(...)` runs the real Zod schema, including refinements |

The refinement guard is the explicit Zod parse. That is why `record-fixtures.ts`, `client.ts`, and fixture loading still parse the bundle even though MCP has schemas.

2. **In-memory transport vs stdio**

| Keeps from stdio | Drops from stdio |
|---|---|
| MCP protocol messages | Real child process |
| `initialize` handshake | `stdin` / `stdout` pipes |
| `tools/call` dispatch | Process startup path |
| Client/server separation | CLI entrypoint wiring |
| Registered handler lookup | Shell/tsx/stdout/stderr issues |

So the in-memory test still proves: “A real MCP client can call the real MCP server registration and invoke `search_evidence`.”

The one stdio test still proves: “The production entrypoint actually starts, connects over stdio, and speaks MCP as a separate process.”

3. **Recorded bundle to replay**

| Step | What happens |
|---:|---|
| 1 | `record-fixtures.ts` calls `search_evidence` through MCP |
| 2 | It parses `result.structuredContent` as an `EvidenceBundle` |
| 3 | It writes a fixture containing the request and validated result |
| 4 | A test loads the fixture and parses it with `RecordedCallSchema` |
| 5 | The fixture data seeds the fake graph / expected result |
| 6 | The test calls the server again and compares the replayed result to the recorded bundle |

The field expected to change when re-recording is:

```ts
recordedAt
```

`assembledAt` is kept stable by the fixed clock; `recordedAt` is the recorder timestamp.
---

## Evaluation, 2026-09-30 (lesson 0016 session)

**Answer 2 and answer 3: correct at mechanism level.** Answer 2's two columns match the lesson's
measured account of what the in-memory channel keeps and drops, and both "what it still proves"
statements are right. Answer 3's six-step chain is the recorder and the replay as the lab runs
them, and `recordedAt` is the one field a re-record moves, because the adapter runs under a fixed
clock.

**Answer 1: two of the three guards are misplaced.** The three guards the lesson counted are all
on one answer's way out:

| # | The lesson's guard | Runs the refinement? |
|---|---|---|
| 1 | the server's **output** parse, Zod, after the handler returns | yes, and it refuses in-band with `isError: true` |
| 2 | the SDK client's check inside `callTool`, against the JSON Schema from `tools/list` | no, because JSON Schema cannot express a cross-field rule |
| 3 | your own `EvidenceBundleSchema.parse` of `structuredContent` | yes, and it narrows `unknown` to a bundle |

Two corrections:

- The **tool input** guard in the answer's row 1 is real — lesson 0013's argument parse — but it
  guards the request, not the answer, so it was not one of the three.
- Row 2 merges the server's output parse with the client's schema check and concludes that
  refinements are "not the guard to rely on here". The server's output parse *is* Zod, and the
  measured refusal text is
  `Output validation error: … items.0.provenance.confidence: confirmed needs at least two sources`.
  Two of the three guards run the refinement. Only the middle one is blind to it.

The answer's closing sentence is right about why `client.ts`, `record-fixtures.ts` and the fixture
loader all parse: the client-side parse is the only guard that yields a typed value, because
`structuredContent` arrives `unknown`.

**Promoted to `demonstrated`:** [[mcp-client]] (connect, `callTool`, the parse, and the
record-and-replay chain, all used correctly) and [[in-memory-transport]] (answer 2 is a complete
account of what it keeps and what it drops).

**Held at `introduced`:** [[transport]] — its two rules are still unstated, namely that the client
owns the server's lifetime and that the transport owns stdout. [[json-rpc]] — id matching is still
untouched. [[evidence-item]] — the lesson's meaning, one claim packaged with its provenance, has
not been said back. Held from earlier: [[json-lines]], [[default-deny]]. Lesson 0016's
classification exercise and its second say-it question are the next workout for
[[default-deny]].
