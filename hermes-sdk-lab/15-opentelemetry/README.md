# Exercise 15 — OpenTelemetry, evaluated

Lesson: [0023 — OpenTelemetry, Evaluated](../../lessons/0023-opentelemetry-evaluated.html)

Scenario step **S7 (the durable record)**. Lab 14 built spans by hand. This exercise emits the same
spans through OpenTelemetry JS into an in-memory exporter, reads them back, and tests them equal to
lab 14's, field for field, on all seven recorded runs. The decision that follows is
[ADR 0002](../../docs/adr/0002-adopt-otlp-as-the-export-format.md): adopt OTLP as the export format,
and keep the trace as the record.

No model, no mock, no network. The spans are emitted after the run, with the recorded times. The OTLP
body is built and printed, never sent.

Nothing is copied. `exportRun` calls lab 14's `costReport`, so lab 14 still decides what a step is.
Lab 14 imports nothing from here.

## What lives here

| File | What it is |
|---|---|
| `src/export-run.ts` | `exportRun(events, price, tracer)`: one job span, one span per step, recorded times, the alert as a span event |
| `src/conventions.ts` | every attribute name, `gen_ai.*` (status Development) and `hermes.*`, in one place |
| `src/telemetry.ts` | the SDK setup: provider, simple processor, in-memory exporter, `service.name`; and `otlpJson`, the OTLP/HTTP JSON body |
| `src/read-back.ts` | `readBack(spans)`: rebuilds lab 14's span objects from the exporter alone, for the comparison |
| `src/main.ts` | `pnpm job` (all seven, compared) and `pnpm job --otlp <file>` (the body, printed) |
| `tests/export-run.test.ts` | 26 tests: 25 written before the code, and one written before the `service.name` fix. After review, the round trip was widened to the job's fields and the alert, seen red first |

## Commands

```bash
pnpm install                                   # once, from hermes-sdk-lab/
pnpm --filter 15-opentelemetry job             # all seven recorded runs, through the exporter and back
pnpm --filter 15-opentelemetry job --otlp ../07-tool-loop/traces/audit-atlas.jsonl
pnpm --filter 15-opentelemetry test
```

`pnpm job` exits 0 when all seven read back equal, 1 when any differs.

## Measured, 2026-10-30

Versions, all exact: `@opentelemetry/api` 1.9.1, `@opentelemetry/sdk-trace` 2.12.0,
`@opentelemetry/resources` 2.12.0, `@opentelemetry/otlp-transformer` 0.223.0 (and, through them,
`@opentelemetry/core` 2.12.0 and `@opentelemetry/semantic-conventions` 1.44.0), `zod` 4.4.3, `vitest`
3.2.7, `tsx` 4.23.1, Node 22.14.0. `@opentelemetry/api` 1.10.0 was ten days old and was not taken, and
`sdk-trace` 2.12.0 accepts api below 1.10.0.

`sdk-trace-base` 2.12.0, the package most guides name, is now a thin layer over the newer
`@opentelemetry/sdk-trace`. This lab depends on `sdk-trace` directly. Its constructor takes
`new SimpleSpanProcessor({ exporter })`, an options object.

```
audit-atlas.jsonl
  spans exported   4 (1 job + 3 steps), trace e57a222c07446c7d4c12b35c1a6adca2
  equal to lab 14  yes, field for field
  OTLP JSON        3733 bytes, from a 1268-byte trace file
...
tight-deadline-resume.jsonl
  spans exported   2 (1 job + 1 step), trace 43b03ad1d39d628427f95d6fafe56eb7
  equal to lab 14  yes, field for field
  OTLP JSON        2199 bytes, from a 777-byte trace file
...
all seven equal
```

Trace ids are random and change on every run. The OTLP body, measured as the serializer's bytes,
is about three times the size of the trace file it was computed from. A real exporter would send
it as `POST /v1/traces` with `Content-Type: application/json`.

One model span in the OTLP body, abridged:

```json
{
  "traceId": "256de65370160eb0e30ea16c626a6be2",
  "spanId": "e53920c837086560",
  "parentSpanId": "01a46e860d005c7e",
  "name": "chat claude-opus-4-8",
  "kind": 3,
  "startTimeUnixNano": "1788134444286000000",
  "endTimeUnixNano": "1788134445940000000",
  "attributes": [
    { "key": "gen_ai.operation.name", "value": { "stringValue": "chat" } },
    { "key": "gen_ai.usage.input_tokens", "value": { "intValue": 23 } },
    { "key": "hermes.cost.micro_usd", "value": { "intValue": 1165 } }
  ]
}
```

`kind: 3` is `CLIENT`. The times are the trace's `at` values with six zeros added.

**What moved into the library, and what did not:**

| Layer | Moved? | Where it lives now |
|---|---|---|
| span and trace ids | yes | the SDK's random id generator, new on every export |
| parent links | yes | the context passed to `startSpan` |
| time format | yes | `[seconds, nanoseconds]` in the SDK, nanosecond strings in OTLP |
| export | yes | processor, exporter, and the OTLP body |
| which lines make a step | no | lab 14's `costReport` |
| dollars, the remainder, the alert's call | no | lab 14's `costReport`; the alert becomes a span event |
| the record | no | the JSON Lines trace file |

**Packages:** the four pinned above bring five more, 9 new names in `pnpm-lock.yaml`. Three of the
five (`api-logs`, `sdk-logs`, `sdk-metrics`) come from `otlp-transformer`. Adding them made lab 13's
`@langchain/core` resolve its optional `@opentelemetry/api` peer. Lab 13's 107 tests still pass.

**Code lines,** comments and blanks excluded: `export-run.ts` 90, `conventions.ts` 36,
`telemetry.ts` 21, so the emit side is 147. `read-back.ts` is 97 and exists for the test.

**Mutations of `export-run.ts`, each restored and checked with `cmp`:**

| Mutation | Tests failing |
|---|---|
| steps end with `end()`, no time | 8 (seven read-backs, and the alert's time) |
| steps get no parent context | 7 (one root per run expected, seven roots found) |
| a cut-off call gets `gen_ai.usage.input_tokens: 0` | 3 (the two cut-off runs, and the named test) |
| start times rounded down to the second | 7 (seven read-backs) |

## Break it

1. In `conventions.ts`, rename `gen_ai.usage.input_tokens` to `gen_ai.usage.prompt_tokens`, an
   older name. Expected: 1 test fails, the one that names the string. The round trip still passes,
   because `readBack` reads the same constant.
2. In `telemetry.ts`, swap `SimpleSpanProcessor` for `BatchSpanProcessor`. Expected: 23 tests fail.
   A batch processor holds spans until `forceFlush()`, so the exporter is empty when the test reads it.
3. In `exportRun`, end one step with `end()` and no time. Expected: 8 tests fail. A span with a given
   start and no given end ends at `Date.now()`.

## Not done here, on purpose

- **No live instrumentation.** The loop (labs 12 and 14) does not import OpenTelemetry. Spans are
  emitted after the run, from the trace. ADR 0002 records why.
- **Nothing is sent.** No OTLP exporter package, no collector, no Phoenix. The body is built with
  `otlp-transformer`, which calls itself "intended for internal use only" and "experimental".
- **No `@opentelemetry/semantic-conventions/incubating` import.** Every `gen_ai.*` name is status
  Development, so the names are strings in `conventions.ts`, checked by a test.
- **Not checked:** which attribute names Phoenix displays. Phoenix documents its own OpenInference
  names.
- **The recorded traces are not committed,** as in labs 12 to 14. A fresh clone re-records them first.
