/**
 * The seeded fake (lesson 0026): a ModelGateway that replays one of
 * several recordings, chosen by a seed.
 *
 * Lab 07's fake replays one script, so every trial of a task is the same
 * run. Real models vary. This adapter brings variation back in a form a
 * test can control: the task file lists recorded variants with weights,
 * and the seed picks one. The choice depends on the seed and nothing else,
 * so a trial that failed can be run again, exactly, from its seed.
 *
 * The variation is chosen, never sampled from a model. A weight of 9 to 1
 * IS the failure rate, written down before the run.
 */
import type { GatewayResult, ModelCall, ModelGateway } from "../../07-tool-loop/src/gateway.js";
import { FakeModelGateway } from "../../07-tool-loop/src/fake-gateway.js";

/**
 * mulberry32: a small seeded generator that returns a number in [0, 1).
 * One seed, one number. Math.random takes no seed, so it cannot be used.
 */
function draw(seed: number): number {
  let t = (seed + 0x6d2b79f5) | 0;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

/** The index a seed chooses, where each index's chance is its weight over the total. */
export function pickVariant(weights: number[], seed: number): number {
  if (weights.length === 0 || weights.some((w) => !Number.isInteger(w) || w < 1)) {
    throw new Error("every weight must be a whole number of 1 or more, and there must be one");
  }
  if (!Number.isSafeInteger(seed)) throw new Error(`seed ${seed} is not a whole number`);
  const total = weights.reduce((sum, w) => sum + w, 0);
  let point = draw(seed) * total;
  for (const [i, w] of weights.entries()) {
    if (point < w) return i;
    point -= w;
  }
  return weights.length - 1;
}

/** One recording the fake may replay, and its weight. */
export interface Variant {
  /** The recording's path, as the task file wrote it. */
  recording: string;
  weight: number;
  script: GatewayResult[];
}

export class SeededFakeGateway implements ModelGateway {
  /** The recording this seed chose, by path. The trial scorecard prints it. */
  readonly variant: string;

  private readonly fake: FakeModelGateway;

  constructor(variants: Variant[], seed: number) {
    const chosen = variants[pickVariant(variants.map((v) => v.weight), seed)];
    if (chosen === undefined) throw new Error("no variants");
    this.variant = chosen.recording;
    this.fake = new FakeModelGateway(chosen.script);
  }

  complete(call: ModelCall, options?: { signal?: AbortSignal }): Promise<GatewayResult> {
    return this.fake.complete(call, options);
  }
}
