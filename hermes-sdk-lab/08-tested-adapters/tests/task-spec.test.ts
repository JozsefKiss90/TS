/**
 * The admission gate, tested as a pure function: JSON-shaped values in,
 * proof or refusal out. No model, no clock, no file — the gate never
 * needed any of them, which is why these tests need no doubles at all.
 */
import { describe, expect, it } from "vitest";
import { admitTaskSpec } from "../../07-tool-loop/src/task-spec.js";

const valid = {
  title: "Audit the atlas graph",
  owner: "themis",
  instruction: "Audit the atlas graph and summarize its health.",
  costCeilingTokens: 2000,
  outputPath: "artifacts/audit-atlas.md",
};

describe("admitTaskSpec", () => {
  it("admits a minimal spec and fills every default", () => {
    const admission = admitTaskSpec(valid);

    expect(admission.admitted).toBe(true);
    if (!admission.admitted) return;
    expect(admission.spec.maxTokens).toBe(1024);
    expect(admission.spec.maxModelCalls).toBe(4);
    expect(admission.spec.deadlineMs).toBe(60_000);
    // The safe default for a permission list grants nothing.
    expect(admission.spec.allowedTools).toEqual([]);
    expect(admission.spec.approvalRequired).toEqual([]);
  });

  it("refuses a per-call cap above the whole job's ceiling", () => {
    const admission = admitTaskSpec({ ...valid, maxTokens: 100, costCeilingTokens: 50 });

    expect(admission.admitted).toBe(false);
    if (admission.admitted) return;
    expect(admission.rejections.join(" ")).toContain("maxTokens");
  });

  it("refuses approval rules for a tool the job never permitted", () => {
    const admission = admitTaskSpec({ ...valid, approvalRequired: ["graph_writeback"] });

    expect(admission.admitted).toBe(false);
    if (admission.admitted) return;
    expect(admission.rejections.join(" ")).toContain("approvalRequired");
  });

  it("refuses a value that is not an object at all", () => {
    const admission = admitTaskSpec("run the audit");

    expect(admission.admitted).toBe(false);
  });
});
