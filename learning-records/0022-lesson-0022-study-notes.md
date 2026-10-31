# Lesson 0022 — What the Run Cost

> **Record type:** reconstructed study notes from the committed lesson, not a learner's submitted recall or a graded evaluation.
> **Source:** [Lesson 0022](../lessons/0022-what-the-run-cost.html) · **Lab context:** `14-observability`.
> **Recall status:** not assessed. No personal answers or performance claims are inferred.

## Mechanism and implementation evidence

Trace events are paired into spans with start/end times, token counts and dollar estimates. Cost reporting reconciles step sums with the job's terminal totals and reports disagreement explicitly. Where cancellation leaves token usage incomplete, the residual is labeled estimated and priced as an upper bound. The 80% budget alert is attributed to the first call whose cumulative spend crosses the threshold.

## Important distinction

A span is derived from the durable trace rather than replacing it. Measured and estimated accounting must not be mixed without labels. An alert's call index is reconstructed from cumulative totals, not guessed from a final sum.

## Recall prompts — unanswered

Describe how trace events form spans. What prevents a misleading cost report when totals disagree? How is partial generation charged, and where is the 80% warning located?

## Verification boundary

The implementation results and measurements described above are claims documented in the lesson; they were **not independently rerun** while preparing this record. To promote glossary terms or mark comprehension as demonstrated, complete the lesson exercise, answer the recall prompts without notes, and append a dated evaluation with observed evidence. Existing learning assessments must not be inferred from lesson text.
