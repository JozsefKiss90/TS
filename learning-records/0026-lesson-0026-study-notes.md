# Lesson 0026 — Many Runs, One Verdict

> **Record type:** reconstructed study notes from the committed lesson, not a learner's submitted recall or a graded evaluation.
> **Source:** [Lesson 0026](../lessons/0026-many-runs-one-verdict.html) · **Lab context:** `16-benchmark`.
> **Recall status:** not assessed. No personal answers or performance claims are inferred.

## Mechanism and implementation evidence

One trial is one graded execution, not proof of reliability. A seed chooses between pre-recorded gateway variants with weights defined in the task file. A scorecard records seed, chosen recording, failed graders, pass rate and pass^k. At n=20, audit passed 19 trials and pass^4 was 0.8. Across 4,000 planted-distribution trials, 3,614 passed (90.3%). A failed seed can be rerun with the same reply recording.

## Important distinction

Pass rate answers how often an individual run passes; pass^k answers the probability/empirical share that k selected runs all pass. The finite-sample calculation without replacement is different from simply raising the estimated pass rate to k. The seeded fake's variation is designed, not evidence of a live model's failure distribution.

## Recall prompts — unanswered

Compute 19/20 and C(19,4)/C(20,4). Why can ten trials misleadingly show 100%? What must be held fixed when replaying seed 4?

## Verification boundary

The implementation results and measurements described above are claims documented in the lesson; they were **not independently rerun** while preparing this record. To promote glossary terms or mark comprehension as demonstrated, complete the lesson exercise, answer the recall prompts without notes, and append a dated evaluation with observed evidence. Existing learning assessments must not be inferred from lesson text.
