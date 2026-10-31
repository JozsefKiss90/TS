---
term: interrupt()
aliases:
  - interrupt
  - Command({ resume })
type: glossary-term
lesson: ""
first_used: "0020"
phase: 3
category: sdk-layer
status: introduced
introduced: 2026-10-22
tags:
  - glossary
  - sdk-layer
---

# interrupt()

The [[langgraph-js|LangGraph.js]] function a node calls to pause the run until an answer arrives.

```ts
// @langchain/langgraph 1.4.21, dist/interrupt.d.ts
declare function interrupt<I = unknown, R = any>(value: I, options?: InterruptOptions): R;
```

A later `invoke(new Command({ resume: answer }))` on the same [[thread]] continues the run. The paused node runs again from its first line, and this time `interrupt()` returns the answer. The return type defaults to `any`, because the signature cannot know what an operator will send. The `responseSchema` option makes the framework parse the answer with Zod first.

`interrupt()` refuses to run without a [[checkpointer]], because a paused run has to be kept somewhere.

**First used in [[lesson-0020-langgraph-js-evaluated|lesson 0020]]:** part b pauses the audit at step 4 and resumes it with `"approved"`. Lab 12's checkpoint steps read 1, 2, 3, 4, 4, 5, 6, 7, 8, because the node reruns and saves its arrival again. Part c sends `"maybe"`, and the parse refuses it.

**Why it matters for Hermes:** a side effect before the pause would repeat on resume. Lab 12's [[parked-run]] resumes from its own [[checkpoint]] instead, from any process.

*A reference note: a literal code identifier, used in lessons with no definition. It carries no `lesson` id for that reason.*

**Related:** [[parked-run]] · [[checkpointer]] · [[thread]] · [[approval-queue]] · [[langgraph-js]]
