# Lesson 0024 — Landing the Outputs

> **Record type:** reconstructed study notes from the committed lesson, not a learner's submitted recall or a graded evaluation.
> **Source:** [Lesson 0024](../lessons/0024-landing-the-outputs.html) · **Lab context:** `15-otel / output-landing lab`.
> **Recall status:** not assessed. No personal answers or performance claims are inferred.

## Mechanism and implementation evidence

Each completed job produces a run folder with output, status, and links to its trace and cost report. The landed artifact is derived from the durable trace, allowing a crashed process's finished run to be materialized later. A parked job is not finished and is not landed. Files are atomically renamed into place; the reader-facing file is written last.

## Important distinction

The trace is the evidence of what happened; the artifact is a readable projection of it. Recovery must avoid treating parked jobs as completed or exposing partially written output folders. Atomic renames protect the publication boundary.

## Recall prompts — unanswered

What data is needed to land a job after a crash? Why does a parked run produce no final artifact? What does writing the reader-facing file last guarantee?

## Verification boundary

The implementation results and measurements described above are claims documented in the lesson; they were **not independently rerun** while preparing this record. To promote glossary terms or mark comprehension as demonstrated, complete the lesson exercise, answer the recall prompts without notes, and append a dated evaluation with observed evidence. Existing learning assessments must not be inferred from lesson text.
