/**
 * The approval queue, written before it exists (lesson 0019).
 *
 * The queue is not a new record. It is the set of checkpoints standing at
 * `awaiting_approval` with no verdict yet. Answering one writes the
 * operator's verdict into the checkpoint's state, and the result is a
 * checkpoint again, admitted through the same parse. A checkpoint that is
 * not waiting cannot be answered, and one already answered cannot be
 * answered twice.
 *
 * Both functions are pure. Where the checkpoints come from, and where an
 * answered one goes, is the wiring's business.
 */
import { describe, expect, it } from "vitest";
import { admitCheckpoint, type JobCheckpoint } from "../src/checkpoint.js";
import { initialState } from "../src/job-state.js";
import { answerParked, parkedJobs } from "../src/queue.js";
import { spec } from "./helpers.js";

const call = { id: "toolu_1", name: "graph_health", input: { graph: "atlas" } };

function checkpointAt(node: string, overrides: Partial<JobCheckpoint["state"]> = {}): JobCheckpoint {
  const state = { ...initialState(spec()), modelCalls: 1, tokensSpent: 30, ...overrides };
  return { job: `job at ${node}`, step: 4, node, state };
}

const waiting = (): JobCheckpoint => checkpointAt("awaiting_approval", { pending: [call], gate: "hold" });

describe("the queue", () => {
  it("is the checkpoints at awaiting_approval with no verdict, in the order given", () => {
    const answered = checkpointAt("awaiting_approval", { pending: [call], gate: "hold", verdict: "approved" });
    const landed = checkpointAt("landed");
    const queue = parkedJobs([landed, waiting(), answered, waiting()]);
    expect(queue.map((c) => c.job)).toEqual(["job at awaiting_approval", "job at awaiting_approval"]);
    expect(queue.every((c) => c.state.verdict === null)).toBe(true);
  });

  it("is empty when no job waits", () => {
    expect(parkedJobs([checkpointAt("landed"), checkpointAt("calling")])).toEqual([]);
  });
});

describe("answering a parked job", () => {
  it("writes the verdict into the state and leaves everything else as it was", () => {
    const before = waiting();
    const result = answerParked(before, "approved");
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.checkpoint).toEqual({ ...before, state: { ...before.state, verdict: "approved" } });
    // The answered checkpoint still passes the boundary it will cross on disk.
    expect(admitCheckpoint(JSON.parse(JSON.stringify(result.checkpoint))).admitted).toBe(true);
    // The input was not mutated.
    expect(before.state.verdict).toBeNull();
  });

  it("accepts denied as well", () => {
    const result = answerParked(waiting(), "denied");
    expect(result).toMatchObject({ ok: true, checkpoint: { state: { verdict: "denied" } } });
  });

  it("refuses a checkpoint that is not at awaiting_approval", () => {
    expect(answerParked(checkpointAt("calling"), "approved")).toEqual({
      ok: false,
      reason: "the job stands at calling, not at awaiting_approval",
    });
  });

  it("refuses a checkpoint that already holds a verdict", () => {
    const answered = checkpointAt("awaiting_approval", { pending: [call], gate: "hold", verdict: "denied" });
    expect(answerParked(answered, "approved")).toEqual({
      ok: false,
      reason: "the job was already answered: denied",
    });
  });

  it("refuses a checkpoint with nothing pending", () => {
    expect(answerParked(checkpointAt("awaiting_approval", { gate: "hold" }), "approved")).toEqual({
      ok: false,
      reason: "the job has no pending tool call to answer",
    });
  });
});
