/**
 * A recorded fixture (lesson 0025): the replies one recorded run received,
 * replayed to the fake gateway.
 *
 * A reply line in the trace carries everything a ModelReply holds: text,
 * tool calls, stop reason, both token counts and the request id. So a
 * trace the loop wrote yesterday is a script the fake can play today, and
 * no reply is typed by hand.
 */
import type { GatewayResult } from "../../07-tool-loop/src/gateway.js";
import type { TraceEvent } from "../../07-tool-loop/src/trace.js";

export function fixtureFromTrace(events: TraceEvent[]): GatewayResult[] {
  return events.flatMap((e): GatewayResult[] =>
    e.kind === "reply"
      ? [
          {
            ok: true,
            reply: {
              text: e.text,
              calls: e.calls,
              stop: e.stop,
              usage: { inputTokens: e.inputTokens, outputTokens: e.outputTokens },
              requestId: e.requestId,
            },
          },
        ]
      : [],
  );
}
