# Lesson 0023 — OpenTelemetry, Evaluated

> **Record type:** reconstructed study notes from the committed lesson, not a learner's submitted recall or a graded evaluation.
> **Source:** [Lesson 0023](../lessons/0023-opentelemetry-evaluated.html) · **Lab context:** `15-otel`.
> **Recall status:** not assessed. No personal answers or performance claims are inferred.

## Mechanism and implementation evidence

A Tracer emits spans and an exporter receives them. The lab maps the previous lesson's seven recorded runs to OTLP while preserving the trace-derived span information. Parent links, span identifiers, timestamps, and export formatting are handled by the library. Explicit replay start/end times are needed for equality with the recorded history.

## Important distinction

OpenTelemetry handles telemetry mechanics, not which policy events Hermes emits or how the run is supervised. The durable JSONL trace remains authoritative; OTLP is the chosen export representation. Attribute conventions may evolve, so their version and mapping require attention.

## Recall prompts — unanswered

Separate Tracer, span and exporter. Why pass recorded timestamps into replay? Which responsibilities are adopted and which remain Hermes policy?

## Verification boundary

The implementation results and measurements described above are claims documented in the lesson; they were **not independently rerun** while preparing this record. To promote glossary terms or mark comprehension as demonstrated, complete the lesson exercise, answer the recall prompts without notes, and append a dated evaluation with observed evidence. Existing learning assessments must not be inferred from lesson text.
