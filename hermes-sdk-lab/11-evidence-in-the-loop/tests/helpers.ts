/** Shared by the lesson-0016 suites: one admitted spec, with overrides. */
import { admitTaskSpec, type TaskSpec, type TaskSpecInput } from "../../07-tool-loop/src/task-spec.js";

const BASE: TaskSpecInput = {
  title: "Audit the atlas graph",
  owner: "themis",
  instruction: "Summarize the atlas graph health check in three bullet points.",
  costCeilingTokens: 2000,
  allowedTools: ["graph_health"],
  outputPath: "vault/audits/atlas.md",
};

/** Admits a spec through the real gate, so a test never hand-builds one. */
export function spec(overrides: Partial<TaskSpecInput> = {}): TaskSpec {
  const admission = admitTaskSpec({ ...BASE, ...overrides });
  if (!admission.admitted) throw new Error(admission.rejections.join("; "));
  return admission.spec;
}
