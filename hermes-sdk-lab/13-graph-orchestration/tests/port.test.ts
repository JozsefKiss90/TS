/**
 * The swap is real (lesson 0020).
 *
 * vitest.config.ts replaces lab 12's interpreter with the LangGraph runner
 * for every file that imports it. Lab 12's 74 tests then run here
 * unchanged. A green run proves something only if the swap happened, so
 * this file checks it from both sides: the module lab 12's files import
 * is the runner, and a job started through lab 12's own `startJob` is
 * counted by the runner.
 */
import { describe, expect, it } from "vitest";
import { FakeModelGateway } from "../../07-tool-loop/src/fake-gateway.js";
import { startJob } from "../../12-workflow-graph/src/handlers.js";
import * as lab12 from "../../12-workflow-graph/src/interpreter.js";
import { loadGraph } from "../../12-workflow-graph/src/load-graph.js";
import { done, wantsTool } from "../../12-workflow-graph/src/scripted-replies.js";
import { spec } from "../../12-workflow-graph/tests/helpers.js";
import * as runner from "../src/langgraph-runner.js";

const graph = loadGraph(new URL("../../12-workflow-graph/graphs/job-lifecycle.json", import.meta.url));

describe("lab 12's interpreter, as lab 12's files import it", () => {
  it("is the LangGraph runner", () => {
    expect(lab12.runGraph).toBe(runner.runGraph);
    expect((lab12 as unknown as Record<string, unknown>).ENGINE).toBe("langgraph");
  });

  it("drives lab 12's startJob, and the runner counts the run", async () => {
    const before = runner.frameworkRuns();
    const result = await startJob(graph, spec(), new FakeModelGateway([wantsTool, done]));
    expect(result).toMatchObject({ ok: true, report: { outcome: "landed", modelCalls: 2 } });
    expect(runner.frameworkRuns()).toBe(before + 1);
  });
});
