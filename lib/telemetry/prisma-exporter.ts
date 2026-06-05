import type { ExportResult } from "@opentelemetry/core";
import { ExportResultCode } from "@opentelemetry/core";
import type { ReadableSpan, SpanExporter } from "@opentelemetry/sdk-trace-base";

function hrTimeToMs(hrTime: [number, number]): number {
  return hrTime[0] * 1000 + hrTime[1] / 1_000_000;
}

const KIND_NAMES: Record<number, string> = {
  0: "INTERNAL",
  1: "SERVER",
  2: "CLIENT",
  3: "PRODUCER",
  4: "CONSUMER",
};

const STATUS_NAMES: Record<number, string> = {
  0: "UNSET",
  1: "OK",
  2: "ERROR",
};

export class PrismaSpanExporter implements SpanExporter {
  export(
    spans: ReadableSpan[],
    resultCallback: (result: ExportResult) => void,
  ): void {
    this.exportAsync(spans).then(
      () => resultCallback({ code: ExportResultCode.SUCCESS }),
      () => resultCallback({ code: ExportResultCode.FAILED }),
    );
  }

  private async exportAsync(spans: ReadableSpan[]): Promise<void> {
    const { prisma } = await import("@/lib/prisma");

    await Promise.allSettled(
      spans.map(async (span) => {
        const startMs = hrTimeToMs(span.startTime as [number, number]);
        const endMs = hrTimeToMs(span.endTime as [number, number]);
        const durationMs = Math.max(0, Math.round(endMs - startMs));

        let attributes: string | null = null;
        try {
          const attrs = span.attributes;
          if (attrs && Object.keys(attrs).length > 0) {
            attributes = JSON.stringify(attrs);
          }
        } catch {
          // ignore serialisation errors
        }

        await prisma.otelSpan.create({
          data: {
            traceId: span.spanContext().traceId,
            spanId: span.spanContext().spanId,
            parentSpanId: span.parentSpanContext?.spanId ?? null,
            name: span.name,
            kind: KIND_NAMES[span.kind] ?? "INTERNAL",
            startTime: new Date(startMs),
            endTime: new Date(endMs),
            durationMs,
            statusCode: STATUS_NAMES[span.status.code] ?? "UNSET",
            statusMsg: span.status.message ?? null,
            attributes,
            service:
              (span.resource?.attributes?.["service.name"] as string) ?? null,
          },
        });
      }),
    );
  }

  shutdown(): Promise<void> {
    return Promise.resolve();
  }

  forceFlush(): Promise<void> {
    return Promise.resolve();
  }
}
