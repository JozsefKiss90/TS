# Lesson 0017 — Thinking in State Graphs

> **Record type:** reconstructed study notes from the committed lesson, not a learner's submitted recall or a graded evaluation.
> **Source:** [Lesson 0017](../lessons/0017-thinking-in-state-graphs.html) · **Lab context:** `12-workflow-graph`.
> **Recall status:** not assessed. No personal answers or performance claims are inferred.

## Mechanism and implementation evidence

Each of the supervisor's eight trace event kinds enters one state, giving 13 states, 26 edges and 6 guards in `graphs/job-lifecycle.json`. `admitWorkflowGraph(raw: unknown)` applies a strict shape and four rules: declared start, edges join declared nodes, cited guards declared, no edge leaves a terminal. A guard is a name in the file and a function in `guards.ts` that reads the event being left. `walk(graph, guards, events)` holds node and path, and refuses with a line number. Six recordings walk legal and complete; 32 tests.

## Important distinction

Recordings take 10 of the 26 edges; the other 16 come from the code. The graph describes the supervisor and does not drive it yet. The strict shape refuses a `claims` or `events` key, so the graph, the knowledge graph and the trace stay apart.

## Recall prompts — unanswered

How do you read a state and an edge out of the supervisor? Why is a guard a name in one place and a body in another? What does the walker hold, and refuse to hold?

## Verification boundary

The implementation results and measurements described above are claims documented in the lesson; they were **not independently rerun** while preparing this record. To promote glossary terms or mark comprehension as demonstrated, complete the lesson exercise, answer the recall prompts without notes, and append a dated evaluation with observed evidence. Existing learning assessments must not be inferred from lesson text.
