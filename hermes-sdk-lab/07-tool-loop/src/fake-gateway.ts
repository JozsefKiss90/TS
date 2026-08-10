/**
 * The FAKE — the port's second implementation.
 *
 * Carried forward from exercise 06, with one line added. It still compiles
 * against the rewritten port, because it never inspected a ModelCall: it
 * records one and answers from a script.
 *
 * The added line is the spread on line 30. The supervisor mutates its
 * transcript in place, so recording the object would record an alias, and
 * every entry would show the FINAL conversation. A snapshot per call is
 * what makes `calls[n].transcript.length` an honest instrument.
 *
 * Not a mock server: exercise 01's mock doubles the API at the WIRE (a real
 * HTTP process on port 8787). The fake doubles the model at the PORT —
 * in-process, no socket, no serialization, no latency.
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
    // The transcript is mutated in place by the supervisor, so a snapshot
    // is the only honest record of what THIS iteration sent.
    this.calls.push({ ...call, transcript: [...call.transcript] });

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
