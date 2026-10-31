# Lesson 0020 — LangGraph.js, Evaluated

> **Record type:** reconstructed study notes from the committed lesson, not a learner's submitted recall or a graded evaluation.
> **Source:** [Lesson 0020](../lessons/0020-langgraph-js-evaluated.html) · **Lab context:** `13-graph-orchestration`.
> **Recall status:** not assessed. No personal answers or performance claims are inferred.

## Mechanism and implementation evidence

LangGraph.js replaces traversal behind lab 12's `runGraph` signature. An import substitution plus a port test verifies that 74 unchanged tests use the new runner (30 reach `runGraph`). `StateGraph` nodes execute functions; conditional edges still consult Hermes's `findOpenEdge` guards. `MemorySaver` provides framework checkpoints and `interrupt()`/`Command({ resume })` provide framework-native pause/resume.

## Important distinction

A green test suite does not by itself prove the replacement was loaded; the port test checks this. Hermes's own checkpoint is the resume record under the original port, whereas framework-native resume requires the same thread and reruns the interrupted node from its beginning; pre-interrupt side effects may repeat.

## Recall prompts — unanswered

Identify what the framework owns versus Hermes. Why is the guard still applied by the router? Why does step 4 appear twice in a native resume? Which checkpoint does each resume path use?

## Verification boundary

The implementation results and measurements described above are claims documented in the lesson; they were **not independently rerun** while preparing this record. To promote glossary terms or mark comprehension as demonstrated, complete the lesson exercise, answer the recall prompts without notes, and append a dated evaluation with observed evidence. Existing learning assessments must not be inferred from lesson text.
