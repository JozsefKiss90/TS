# Exercise 11 — evidence enters the loop

Lesson: [0016 — Evidence Enters the Loop](../../lessons/0016-evidence-enters-the-loop.html)

Scenario step **S2 (evidence assembled)**. Exercise 10 built the evidence surface and proved it
without a model. This exercise puts it in front of the Phase 1 loop: the job's questions are
asked before planning starts, the answers are merged into one Context Pack, the pack is admitted
or the job is not dispatched, and the trace records which evidence the job ran on.

Nothing is copied. This package imports the loop from `../07-tool-loop/src` and the evidence
surface from `../10-graph-evidence/src`, so there is one supervisor, one evidence schema and one
server in the workspace.

## What lives here

| File | What it is |
|---|---|
| `src/context-pack.ts` | the `EvidencePort`, `ContextPackSchema`, `admitContextPack`, the assembler, and the two halves the supervisor reads |
| `src/mcp-evidence.ts` | the adapter: an `EvidencePort` whose answers arrive over MCP, from exercise 10's server |
| `src/main.ts` | four runnable parts |
| `specs/audit-atlas-grounded.json` | the audit job, with `evidenceQueries` and `evidenceLimit` |
| `specs/audit-atlas-bare.json` | the same job with no evidence policy, for the cost comparison |
| `tests/` | 21 tests: the pack's rules, the MCP path, the grounded loop |

Changed in `../07-tool-loop/src` by this lesson, all additive. `task-spec.ts` gained
`evidenceQueries` and `evidenceLimit`. `supervisor.ts` gained the `pack` option, the
`AdmittedPack` type, the `packFault` rule and the `no_evidence` outcome. `trace.ts` gained the
`evidence_used` event and one outcome value. With no pack wired and no queries named, every
earlier part runs unchanged, and exercise 08's 29 tests are the proof.

`packFault` is the rule that makes the spec the authority. The pack has to answer the spec's
queries, in the spec's order, and no others. One comparison catches three faults: nothing
arrived, the wrong questions were answered, or a pack turned up for a spec that asked for none.
A pack that fails it is never rendered into a turn and never recorded as evidence the job used.

## Commands

```bash
pnpm install                 # once, from hermes-sdk-lab/
pnpm --filter 11-evidence-in-the-loop job a    # the pack, over stdio
pnpm --filter 11-evidence-in-the-loop job b    # grounded vs ungrounded (needs the mock)
pnpm --filter 11-evidence-in-the-loop job c    # no pack, no dispatch
pnpm --filter 11-evidence-in-the-loop job d    # the four rules, each broken
pnpm --filter 11-evidence-in-the-loop test
```

Part b also needs the mock Messages API. In another terminal, from this folder:

```bash
pnpm mock                    # http://localhost:8787
```

Parts a and b start exercise 10's MCP server themselves, as a child process on the standard-io
pipe. There is nothing to start by hand and nothing to stop: the server lives as long as the
pipe.

## Measured, 2026-09-30

Versions: `@modelcontextprotocol/client` 2.0.0, `@modelcontextprotocol/server` 2.0.0,
`@anthropic-ai/sdk` 0.113.0, `zod` 4.4.3, `vitest` 3.2.7, Node 22.14.0.

**Part a.** Two queries, one item each, from snapshot `dev-graph-2026-09-09`. The pack renders to
**509 characters** and carries ids `MOD-004, MOD-006`.

**Part b.** The same job, twice, against the mock:

| | model calls | tokens | input tokens per call |
|---|---|---|---|
| grounded | 2 | 494 | 162 then 248 |
| ungrounded | 2 | 236 | 33 then 119 |

The pack costs **129 input tokens on every call**, not once per job: 162 − 33 and 248 − 119 are
both 129. The mock estimates input tokens as `ceil(JSON.stringify(messages).length / 4)`, so
these counts are the mock's arithmetic, not a provider's tokenizer. The shape of the result is
what matters: evidence is charged per call, so `evidenceLimit` is a budget control.

The grounded request body is 1,005 bytes, and `messages[0]` is one `user` message holding the
pack text, a blank line, and the operator's instruction. The pack is not a system prompt and not
a tool result.

**Part c.** Three refusals, `modelCalls: 0` each, and the fake recorded **0** model calls across
all three:

```
no pack at all        : no_evidence - spec asks for evidence on supervisor, trace and no admitted pack arrived
a pack for other qs   : no_evidence - the pack answers [kubernetes] and the spec asks for [supervisor, trace]
a spec that asked none: no_evidence - the pack answers [kubernetes] and the spec asks for [nothing]
```

**Part d.** Each rule refuses with its own path and message:

```
nothing matched          → items: [too_small] Too small: expected array to have >=1 items
two snapshots            → assembledFrom: [custom] a pack must be assembled from one snapshot of the graph
one id twice             → items: [custom] a pack may cite each id once
confirmed on one source  → items.0.provenance.confidence: [custom] confirmed needs at least two sources
```

The last one is lesson 0014's refinement, running here because the pack nests the evidence
schema. The pack did not restate it.

**Tests.** 21 in three files, 197 ms of test time in one run. Exercise 08's 29 tests and exercise
10's 32 tests were re-run green this session, and `pnpm -r typecheck` passes across all eleven
packages.

## Break experiments

1. Point `evidenceQueries` at something the graph does not hold, such as `["kubernetes"]`. Predict
   the outcome and the model-call count before you run part a and then part c.
2. Set `evidenceLimit` to 1 in the grounded spec and run part b again. Predict the change in input
   tokens per call.
3. Delete `pack` from the `runTask` call in part b's grounded run, keep the spec as it is, and
   predict which of the four rules fires. It is none of them.
4. Reorder `evidenceQueries` in the grounded spec to `["trace", "supervisor"]`, and run part b
   without touching anything else. Predict the outcome before you run, then say whether the
   order rule is too strict for a job that would have got the same two items either way.

## One thing this lesson does not do

A resumed job re-assembles its pack. `rebuildResumePoint` rebuilds the first turn from the
instruction alone, so the supervisor renders the freshly assembled pack into the same place. If
the graph moved on between the two runs, the second `evidence_used` event names a different
snapshot, and comparing the two events is how you would notice. Nothing here compares them yet.
