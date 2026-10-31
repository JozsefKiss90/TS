# Lesson 0025 — Golden Tasks

> **Record type:** reconstructed study notes from the committed lesson, not a learner's submitted recall or a graded evaluation.
> **Source:** [Lesson 0025](../lessons/0025-golden-tasks.html) · **Lab context:** `16-benchmark`.
> **Recall status:** not assessed. No personal answers or performance claims are inferred.

## Mechanism and implementation evidence

A golden task records the TaskSpec, replay fixture, expected ending, and named graders before running the loop. A grader evaluates the resulting artifact, trace and task, rather than inspecting internal loop implementation. A task passes only when every applicable grader passes. The lesson's four tasks produce 13 passing checks with the real loop; intentionally planted defects cause specific named graders to fail.

## Important distinction

The expected outcome may correctly be a failure or refusal. Recorded replies make the model side repeatable, and a deliberately failing mutation establishes that the grader can detect the targeted defect. A green baseline without a mutation check is weaker evidence.

## Recall prompts — unanswered

Define a golden task and grader. Why is a correct refusal a passing task? Explain what a planted defect demonstrates and what it does not.

## Verification boundary

The implementation results and measurements described above are claims documented in the lesson; they were **not independently rerun** while preparing this record. To promote glossary terms or mark comprehension as demonstrated, complete the lesson exercise, answer the recall prompts without notes, and append a dated evaluation with observed evidence. Existing learning assessments must not be inferred from lesson text.
