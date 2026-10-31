# Lesson 0021 — The Spec Decides the Graph

> **Record type:** reconstructed study notes from the committed lesson, not a learner's submitted recall or a graded evaluation.
> **Source:** [Lesson 0021](../lessons/0021-the-spec-decides-the-graph.html) · **Lab context:** `12-workflow-graph / 13-graph-orchestration`.
> **Recall status:** not assessed. No personal answers or performance claims are inferred.

## Mechanism and implementation evidence

A validated TaskSpec prunes the complete workflow graph into a per-job graph before execution. The job-specific graph omits unreachable nodes and edges: an empty approval list removes the approval wait, while required evidence removes the bypass route. A move absent from the graph is rejected before a handler acts. The trace identifies the graph under which the run proceeded.

## Important distinction

The static graph describes possible transitions; the compiled job graph describes those admissible for this specific work. A guard rejects a move conditionally; a missing edge makes the transition unavailable by construction. The course records a skip decision for LangGraph.js because it primarily displaced traversal and did not eliminate Hermes's supervision requirements.

## Recall prompts — unanswered

Show how allowed approvals and evidence requirements alter graph reachability. Distinguish a missing edge from a failing guard. Explain the adopt/wrap/skip decision using test evidence.

## Verification boundary

The implementation results and measurements described above are claims documented in the lesson; they were **not independently rerun** while preparing this record. To promote glossary terms or mark comprehension as demonstrated, complete the lesson exercise, answer the recall prompts without notes, and append a dated evaluation with observed evidence. Existing learning assessments must not be inferred from lesson text.
