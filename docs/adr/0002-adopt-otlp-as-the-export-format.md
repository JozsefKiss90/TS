# ADR 0002 — Adopt OTLP as the export format; keep the trace as the record

- **Status:** accepted, 2026-10-30 (user decision, lesson 0023 session)
- **Scope:** this course workspace's Spec-to-Evidence Loop (labs 14 and 15). It is a course decision,
  not a Hermes OS ADR. Hermes OS's own record (ADR-0001..0021 in the `hermes-os` repo) is unaffected.
- **Answers:** the adopt / wrap / skip decision in `ROADMAP.md` Phase 4, row 0023, and half of the
  Phase 4 exit criterion "decisions made on measurements, not taste".

## Context

Lesson 0022 built spans by hand. Lab 14's `costReport(events, price)` pairs trace lines into one
span per model call and per tool run, with time, tokens and integer micro-dollars. It checks the sums
against `job_ended`. Lab 14 imports no telemetry package.

Lesson 0023 then emitted the same spans through OpenTelemetry JS (lab 15). `exportRun(events, price,
tracer)` calls lab 14's `costReport` and hands each span to a tracer with its recorded start and end
times. An in-memory exporter keeps the spans. `readBack` rebuilds lab 14's span objects from what the
exporter holds, and a test compares the two.

Versions measured: `@opentelemetry/api` 1.9.1, `@opentelemetry/sdk-trace` 2.12.0,
`@opentelemetry/resources` 2.12.0, `@opentelemetry/otlp-transformer` 0.223.0, zod 4.4.3, vitest
3.2.7, tsx 4.23.1, Node 22.14.0. The GenAI semantic conventions were read on 2026-10-30 at
`github.com/open-telemetry/semantic-conventions-genai`.

## The three options

| Option | Meaning |
|---|---|
| Adopt as the export format | OTLP is how Hermes hands spans to any trace viewer. Spans are computed from the trace file after the run and emitted by one export step (lab 15). The loop itself (labs 12 and 14) never imports OpenTelemetry. |
| Wrap behind a port | Hermes defines its own span-sink interface. OpenTelemetry is one adapter behind it. |
| Skip | Lab 14's report stays the only view. No telemetry dependency. |

## Evidence

| Measurement | Source | Bears on |
|---|---|---|
| Read back from the exporter, every span equals lab 14's, field for field, on all seven recordings. The job totals and `agrees` match too. | `export-run.test.ts`, `pnpm job` | The export loses nothing. Adopt is safe. |
| The library supplied span and trace ids, parent links, the `[seconds, nanoseconds]` time format, the processor and exporter, and the OTLP JSON body. | lab 15 code, lesson 0023 §3 | What Adopt buys. |
| Lab 14 still decides which lines make a span, the dollars, the remainder of a cut-off call, and the call where the 80% alert goes. The alert becomes a span event, placed by `costReport`. | `exportRun` calls `costReport`; lesson 0023 §3 | The library takes over no Hermes decision. |
| Every export gets fresh random ids. Two exports of one file share no id. | test "gives every export a fresh trace id" | Ids are not part of the record, so the export cannot replace the trace. |
| The emit side is 147 code lines (`export-run.ts` 90, `conventions.ts` 36, `telemetry.ts` 21). `read-back.ts` (97) exists only for the test. Lab 14's `cost-report.ts` is 183. Comments and blank lines excluded. | measured 2026-10-30 | Adopt is small. |
| Four pinned packages bring five more: 9 new names in `pnpm-lock.yaml`. Three of the five (`api-logs`, `sdk-logs`, `sdk-metrics`) come from `otlp-transformer`, which calls itself "intended for internal use only" and "experimental". | `pnpm-lock.yaml`; the package README | The offline OTLP body has a cost. A live exporter would replace it. |
| With no SDK registered, `@opentelemetry/api`'s tracer records nothing: its span id is sixteen zeros, and the run still reports. | test "with no SDK registered" | The API package already separates calling code from the implementation. |
| Every `gen_ai.*` attribute and every GenAI conventions document has status Development. The export uses 8 `gen_ai.*` names and 22 `hermes.*` names. No convention exists for dollars, a remainder, the Context Pack, or the gate's decision. | the GenAI conventions repository, 2026-10-30 | Names may change. They live in one file, `conventions.ts`. |
| A span started at a recorded time and ended with no time ends at the moment of export. | test "ended with no time ends now" | Replaying a record needs every end time passed. `exportRun` passes all of them. |
| The SDK's default service name is `unknown_service:` plus the Node binary's path. | `pnpm job --otlp`, before the fix | An export must set `service.name`, or it leaks a local path. |
| Adding the packages made lab 13's `@langchain/core` resolve its optional `@opentelemetry/api` peer. Lab 13's 107 tests still pass. | `pnpm-lock.yaml`, lab 13 test run | A workspace-wide side effect, harmless as measured. |
| Hermes OS names Arize Phoenix for traces: tool catalogue "Core v1"; component 12, Trace Recorder, "partially scaffolded"; Phoenix is in the Wave 0 Compose stack. Phoenix's docs say it "accepts traces over the OpenTelemetry protocol (OTLP)". | `hermes_tool_catalogue.md`; `hermes-job-control-plane.md` component 12; `docs/hermes_os/README.md`; Phoenix docs | The viewer Hermes OS names reads OTLP. Skip would need an importer. |
| The spans are already Hermes's own type, `CostReport`, which any other exporter can read. And `@opentelemetry/api` already separates calling code from the SDK: the SDK, its processor and its exporter can each be replaced without touching `exportRun`. | lab 14 `cost-report.ts`; test "with no SDK registered" | A port's purpose, later replacement, is already met twice. Wrap would add a third seam with one implementation. |

Not measured: which attribute names Phoenix displays. Phoenix documents its own OpenInference
conventions, and this session did not check whether it renders `gen_ai.*` names.

## Decision

**Adopt OTLP as the export format.** Hermes exports spans as OTLP, through OpenTelemetry JS, from
one export step that reads the trace file after the run.

**Keep the trace as the record.** The JSON Lines trace stays the one record of what happened. An
export is a view computed from it, made again on demand, and tested equal to lab 14's spans.

## Consequences

- Lab 14 stays library-free. Lab 15 is the only package that imports OpenTelemetry, and it imports lab
  14, never the reverse.
- The loop is not instrumented live. Spans are emitted after the run, with recorded times.
- The `gen_ai.*` names live in `conventions.ts` as strings. A rename upstream is one edit there.
- The offline OTLP body uses `otlp-transformer` for teaching. Sending to Phoenix is planned
  (ROADMAP row 0023) and would use a public exporter package instead, measured when it is added.
- `service.name` is set to `hermes` on every export.

## Revisit when

- The GenAI conventions reach Stable, or rename a name this export uses.
- Hermes needs spans while a job runs, for example to watch a long run in Phoenix. That means live
  instrumentation inside the loop, which this decision does not cover.
- Phoenix is wired to the loop, and its display of `gen_ai.*` names can be checked.
