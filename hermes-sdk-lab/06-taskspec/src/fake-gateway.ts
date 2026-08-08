/**
 * The FAKE — the port's second implementation.
 *
 * Carried forward from exercise 05, complete. Part B uses one property
 * of it that the lesson turns into a measurement: `calls` records every
 * request the domain made, so an empty `calls` array is PROOF that a
 * rejected TaskSpec never reached a model.
 *
 * Not a mock server: exercise 01's mock doubles the API at the WIRE
 * (a real HTTP process on port 8787). The fake doubles the model at the
 * PORT — in-process, no socket, no serialization, no latency. The
 * supervisor cannot tell the difference, because all it ever knew was
 * the ModelGateway signature.
 *
 * A fake is a REAL implementation of the contract, just a trivial one:
 * it answers from a script you wrote, and records what the domain asked.
 */
import type { GatewayResult, ModelCall, ModelGateway } from "./gateway.js";

export class FakeModelGateway implements ModelGateway {
  readonly calls: ModelCall[] = [];

  private readonly script: GatewayResult[];

  constructor(script: GatewayResult[]) {
    this.script = [...script];
  }

  async complete(
    call: ModelCall,
    options?: { signal?: AbortSignal },
  ): Promise<GatewayResult> {
    this.calls.push(call);

    if (options?.signal?.aborted) {
      return {
        ok: false,
        failure: { kind: "aborted" },
      };
    }

    const result = this.script.shift();

    if (result === undefined) {
      throw new Error("FakeModelGateway script exhausted");
    }

    return result;
  }
}