---
term: ES modules
aliases:
  - ESM
  - type module
type: glossary-term
lesson: "0002"
phase: 0
category: sdk-layer
status: introduced
introduced: 2026-07-23
tags:
  - glossary
  - sdk-layer
---

# ES modules

JavaScript's standard module system — `import` / `export` with static, analyzable semantics — as opposed to Node's legacy CommonJS (`require`). `"type": "module"` in `package.json` tells Node to treat the package's files as ES modules; the tsconfig option `module: "nodenext"` makes TypeScript resolve imports exactly the way Node will at runtime, so compiler and runtime cannot disagree about what an import means.

**In [[lesson-0002-raw-http-against-a-mock|lesson 0002]]:** every exercise package sets `"type": "module"`, and `verbatimModuleSyntax` forces imports to be honest about [[type-erasure]] — a type-only import must say `import type`, because it will not exist at runtime.

**Why it matters for Hermes:** SDKs ship separate ESM and CommonJS builds, and module-resolution mismatches are a classic source of "works in the editor, fails at runtime" bugs. Hermes standardizes on ESM with `nodenext` resolution so there is exactly one answer to what an import does.

**Related:** [[type-erasure]] · [[strict-mode]] · [[sdk]]
