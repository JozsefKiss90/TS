# Lesson 0019 — Interruption Is a State

> **Record type:** reconstructed study notes from the committed lesson, not a learner's submitted recall or a graded evaluation.
> **Source:** [Lesson 0019](../lessons/0019-interruption-is-a-state.html) · **Lab context:** `12-workflow-graph`.
> **Recall status:** not assessed. No personal answers or performance claims are inferred.

## Mechanism and implementation evidence

A handler can park rather than request a graph move. Parking writes no new checkpoint or event. The approval queue is derived from checkpoints at the approval node without a verdict; it is not an independent source of truth. One process writes the decision into durable state; the next process resumes and emits the corresponding event.

## Important distinction

A process ending is not the same as a job ending. The workflow node remains the position of a paused job. Resume must identify the job and verdict without replaying a tool or duplicating a side effect.

## Recall prompts — unanswered

Explain the difference between a park, a transition, and a terminal job. Derive the approval queue from checkpoints. Trace when a verdict becomes state and when it becomes an event.

## Verification boundary

The implementation results and measurements described above are claims documented in the lesson; they were **not independently rerun** while preparing this record. To promote glossary terms or mark comprehension as demonstrated, complete the lesson exercise, answer the recall prompts without notes, and append a dated evaluation with observed evidence. Existing learning assessments must not be inferred from lesson text.
