import { trace, type Tracer } from "@opentelemetry/api";

const SERVICE_NAME = process.env.SERVICE_NAME ?? "keycloak-saas";

export function getTracer(name?: string): Tracer {
  return trace.getTracer(name ?? SERVICE_NAME);
}

export async function withSpan<T>(
  spanName: string,
  fn: () => Promise<T>,
  tracer?: Tracer,
): Promise<T> {
  return (tracer ?? getTracer()).startActiveSpan(spanName, async (span) => {
    try {
      const result = await fn();
      span.setStatus({ code: 1 }); // SpanStatusCode.OK
      return result;
    } catch (error) {
      span.setStatus({
        code: 2, // SpanStatusCode.ERROR
        message: error instanceof Error ? error.message : String(error),
      });
      throw error;
    } finally {
      span.end();
    }
  });
}
