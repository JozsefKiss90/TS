/**
 * The swap (lesson 0020).
 *
 * Lab 12's test files run here byte for byte. One module is replaced on
 * the way in: wherever any file imports lab 12's `src/interpreter.ts`,
 * this plugin hands it `src/langgraph-runner.ts` instead. That covers
 * lab 12's tests, which import `runGraph` directly, and lab 12's
 * handlers.ts, which `startJob` and `resumeJob` drive through.
 *
 * `runGraph`'s signature is the port. If the framework can stand behind
 * it, lab 12's 74 tests cannot tell the difference. tests/port.test.ts
 * proves the swap happened, so a green run is not lab 12 testing itself.
 */
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig, type Plugin } from "vitest/config";

const here = dirname(fileURLToPath(import.meta.url));
const LAB_12_INTERPRETER = resolve(here, "../12-workflow-graph/src/interpreter");
const RUNNER = resolve(here, "src/langgraph-runner.ts");

function swapTheInterpreter(): Plugin {
  return {
    name: "swap-the-interpreter",
    enforce: "pre",
    resolveId(source, importer) {
      if (importer === undefined || !source.startsWith(".")) return null;
      const target = resolve(dirname(importer), source).replace(/\.(js|ts)$/, "");
      return target === LAB_12_INTERPRETER ? RUNNER : null;
    },
  };
}

export default defineConfig({
  plugins: [swapTheInterpreter()],
  test: {
    include: ["tests/**/*.test.ts", "../12-workflow-graph/tests/**/*.test.ts"],
  },
});
