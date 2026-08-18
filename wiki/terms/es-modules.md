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

JavaScript's standard module system: `import` and `export` with fixed, analyzable meaning. Node's older CommonJS system resolves `require` calls at runtime. `"type": "module"` in `package.json` tells Node to treat the package's files as ES modules. The tsconfig option `module: "nodenext"` makes TypeScript resolve imports the way Node will. The compiler and the runtime then agree about every import.

**In [[lesson-0002-raw-http-against-a-mock|lesson 0002]]:** every exercise package sets `"type": "module"`. The flag `verbatimModuleSyntax` makes imports state what survives [[type-erasure]]. A type-only import must say `import type`, because the type will not exist at runtime.

**Why it matters for Hermes:** SDKs ship separate ESM and CommonJS builds. A resolution mismatch works in the editor and fails at runtime. Hermes standardizes on ESM with `nodenext` resolution, so an import means one thing.

**Related:** [[type-erasure]] · [[strict-mode]] · [[sdk]]
