/**
 * The SDK setup (lesson 0023): a tracer whose spans land in memory.
 *
 * Nothing here opens a socket. The in-memory exporter keeps every ended
 * span in an array, and the JSON serializer builds the OTLP body a real
 * exporter would send, without sending it. That keeps the lab offline and
 * still shows the bytes that would cross the network.
 *
 * `@opentelemetry/otlp-transformer` says of itself "intended for internal
 * use only" and "experimental". It is used here to see the wire format,
 * not as something the loop would depend on.
 */
import type { Tracer } from "@opentelemetry/api";
import { JsonTraceSerializer } from "@opentelemetry/otlp-transformer";
import { resourceFromAttributes } from "@opentelemetry/resources";
import { InMemorySpanExporter, SimpleSpanProcessor, TracerProvider, type ReadableSpan } from "@opentelemetry/sdk-trace";

/** The instrumentation scope's name: OTLP groups spans under it. */
export const SCOPE = "hermes";

/**
 * Without this, the SDK's default resource names the service
 * "unknown_service:" plus the Node binary's path, which puts a path from
 * this machine into every export.
 */
export const SERVICE = resourceFromAttributes({ "service.name": "hermes" });

export interface Telemetry {
  tracer: Tracer;
  exporter: InMemorySpanExporter;
  shutdown(): Promise<void>;
}

/**
 * A provider with one processor and one exporter. The simple processor
 * exports each span the moment it ends, so getFinishedSpans() is complete
 * as soon as exportRun returns. A batch processor would need forceFlush().
 */
export function inMemoryTelemetry(): Telemetry {
  const exporter = new InMemorySpanExporter();
  const provider = new TracerProvider({ resource: SERVICE, spanProcessors: [new SimpleSpanProcessor({ exporter })] });
  return { tracer: provider.getTracer(SCOPE), exporter, shutdown: () => provider.shutdown() };
}

/**
 * The OTLP/HTTP JSON request body for these spans: the bytes an exporter
 * would send with POST /v1/traces and Content-Type: application/json.
 */
export function otlpBody(spans: ReadableSpan[]): Uint8Array {
  const bytes = JsonTraceSerializer.serializeRequest(spans);
  if (bytes === undefined) throw new Error("the serializer returned nothing");
  return bytes;
}

/** The same body, parsed back to an object. */
export function otlpJson(spans: ReadableSpan[]): unknown {
  return JSON.parse(new TextDecoder().decode(otlpBody(spans)));
}
