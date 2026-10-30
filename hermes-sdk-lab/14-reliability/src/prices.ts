/**
 * The price table (lesson 0022). Pinned, not fetched.
 *
 * Source: the claude-api skill's model table, "cached: 2026-10-06", read
 * in-session on 2026-10-30. Anthropic first-party API rates, in US dollars
 * per million tokens: claude-opus-4-8 $5 input / $25 output; claude-opus-5-5
 * $4 / $20. Prices change, so a report states which table priced it.
 *
 * Stored as integer micro-dollars per token ($5 per million tokens is 5
 * micro-dollars per token). Integer sums are exact: the per-step totals can
 * be compared with `===`, which floating-point dollars would not allow.
 *
 * The trace records no model id. Lab 07's main.ts names claude-opus-4-8 as
 * MODEL, and the mock behind the recordings pretends to be it, so that is
 * the default. Which model to price is the caller's claim, not the trace's.
 */
export interface ModelPrice {
  model: string;
  inputMicroUsd: number;
  outputMicroUsd: number;
}

export const PRICES = {
  "claude-opus-4-8": { model: "claude-opus-4-8", inputMicroUsd: 5, outputMicroUsd: 25 },
  "claude-opus-5-5": { model: "claude-opus-5-5", inputMicroUsd: 4, outputMicroUsd: 20 },
} as const satisfies Record<string, ModelPrice>;

export type PricedModel = keyof typeof PRICES;

export const DEFAULT_MODEL: PricedModel = "claude-opus-4-8";

export const PRICES_AS_OF = "2026-10-06";

/** Narrows a command-line string to a model the table can price. */
export function isPricedModel(model: string): model is PricedModel {
  return Object.hasOwn(PRICES, model);
}
