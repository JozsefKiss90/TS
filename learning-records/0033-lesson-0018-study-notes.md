# Lesson 0018 — The Loop Walks the Graph

> **Record type:** reconstructed study notes from the committed lesson, not a learner's submitted recall or a graded evaluation.
> **Source:** [Lesson 0018](../lessons/0018-the-loop-walks-the-graph.html) · **Lab context:** `12-workflow-graph`.
> **Recall status:** not assessed. No personal answers or performance claims are inferred.

## Mechanism and implementation evidence

A handler does one node's work and returns `to`, `state` and `event`, but cannot make the move. `runGraph(graph, guards, handlers, from, ctx)` runs a handler, asks `findOpenEdge`, writes a checkpoint, and moves; a missing edge is a typed refusal with no checkpoint. Nine scenarios match lab 07's supervisor. Part E removes `tool_ran > calling`: refusal at step 5, one of two fake calls made, checkpoint at step 4, no `job_ended`. 57 tests.

## Important distinction

The trace is appended: what happened. The checkpoint is replaced each step: where the run is. Killed while a held call waited, the trace resume made 3 calls and 110 tokens; the checkpoint resume kept the pending ask and made 2 calls and 80 tokens. Neither holds an in-flight call, and a tool that already ran runs again.

## Recall prompts — unanswered

What does a handler return, and what may it not decide? What does a refusal cost and leave behind? Name one thing only the checkpoint resume recovers, and one neither recovers.

## Verification boundary

The implementation results and measurements described above are claims documented in the lesson; they were **not independently rerun** while preparing this record. To promote glossary terms or mark comprehension as demonstrated, complete the lesson exercise, answer the recall prompts without notes, and append a dated evaluation with observed evidence. Existing learning assessments must not be inferred from lesson text.
