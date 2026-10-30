/**
 * Three planted defects (lesson 0025). Each is the real loop with one
 * change, the kind of bug a refactor of the loop could introduce.
 *
 * They change what the loop reads, not lab 12's source, so lab 12 stays
 * untouched and the defect is visible in one line. The lesson's footer
 * records a source mutation too, made by hand and restored.
 */
import { REAL_LOOP, type NamedLoop } from "./loop.js";

const real = REAL_LOOP.run;

export const DEFECTS = {
  /** The loop forgets which tools need an operator, so a held tool runs at once. */
  "ignores-approval-list": {
    name: "ignores-approval-list",
    run: (spec, gateway, options) => real({ ...spec, approvalRequired: [] }, gateway, options),
  },
  /** The loop reads the call cap wrong and allows ten calls. */
  "ignores-call-cap": {
    name: "ignores-call-cap",
    run: (spec, gateway, options) => real({ ...spec, maxModelCalls: 10 }, gateway, options),
  },
  /** The loop loses the evidence pack on the way to dispatch. */
  "drops-the-pack": {
    name: "drops-the-pack",
    run: (spec, gateway, { pack: _dropped, ...options }) => real(spec, gateway, options),
  },
} satisfies Record<string, NamedLoop>;

export type DefectName = keyof typeof DEFECTS;

export const isDefect = (name: string): name is DefectName => Object.hasOwn(DEFECTS, name);
