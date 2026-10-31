# Lesson 0027 — The Regression Gate

> **Record type:** reconstructed study notes from the committed lesson, not a learner's submitted recall or a graded evaluation.
> **Source:** [Lesson 0027](../lessons/0027-the-regression-gate.html) · **Lab context:** `16-benchmark`.
> **Recall status:** not assessed. No personal answers or performance claims are inferred.

## Mechanism and implementation evidence

`benchmarkHash` fixes the benchmark task file and referenced recordings, normalizing CRLF to LF. A strict Zod-validated, clock-free baseline retains failed seeds and grader names. The pure gate rejects changed benchmark hashes, task sets, trial counts, and any failure at a task/seed/grader combination not present in the baseline. It reports fixed failures separately. Baseline promotion requires an accepted ADR naming the hash and ten consecutive clean, byte-identical runs.

## Important distinction

Equal overall pass counts can conceal a regression when one seed is fixed and another breaks. Hashing the input prevents comparing scores from different benchmarks. The ten-run promotion rule tests reproducible seeded code and inter-run state leakage; it does not establish live-model reliability. The lesson records accepted ADR 0003 for benchmark-v1.

## Recall prompts — unanswered

Why refuse a changed fixture before running? How can pass counts remain equal while the gate refuses? What do ten clean seeded runs prove—and what do they not prove?

## Verification boundary

The implementation results and measurements described above are claims documented in the lesson; they were **not independently rerun** while preparing this record. To promote glossary terms or mark comprehension as demonstrated, complete the lesson exercise, answer the recall prompts without notes, and append a dated evaluation with observed evidence. Existing learning assessments must not be inferred from lesson text.
