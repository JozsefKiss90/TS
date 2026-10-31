/**
 * A defect that one gate run cannot see (lesson 0027).
 *
 * The three defects in defects.ts break a task on every run. This one
 * breaks nothing until the loop has run `limit` jobs in this process, then
 * loses the evidence pack on every later job, the way a cache that fills up
 * would. One clean gate run proves nothing about it. Ten consecutive runs
 * find it.
 *
 * It lives apart from DEFECTS because lesson 0025's suite expects each of
 * those to fail a grade on a single pass over the golden tasks.
 */
import type { NamedLoop } from "./loop.js";
import { REAL_LOOP } from "./loop.js";

export const LEAK_LIMIT = 200;

/** A fresh loop with its own job counter. */
export function dropsThePackAfter(limit: number): NamedLoop {
  let jobs = 0;
  return {
    name: `drops-the-pack-after-${limit}`,
    run: (spec, gateway, { pack, ...options }) => {
      jobs += 1;
      return REAL_LOOP.run(spec, gateway, jobs > limit ? options : { ...options, ...(pack ? { pack } : {}) });
    },
  };
}
