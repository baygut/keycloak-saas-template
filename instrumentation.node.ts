import { NodeSDK } from "@opentelemetry/sdk-node";
import { SimpleSpanProcessor } from "@opentelemetry/sdk-trace-base";
import { resourceFromAttributes } from "@opentelemetry/resources";
import { ATTR_SERVICE_NAME } from "@opentelemetry/semantic-conventions";

import { PrismaSpanExporter } from "@/lib/telemetry/prisma-exporter";

const sdk = new NodeSDK({
  resource: resourceFromAttributes({
    [ATTR_SERVICE_NAME]: process.env.SERVICE_NAME ?? "keycloak-saas",
  }),
  spanProcessors: [new SimpleSpanProcessor(new PrismaSpanExporter())],
});

sdk.start();
