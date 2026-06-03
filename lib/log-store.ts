import type { LogLevel, LogMeta } from "@/lib/logger";
import { prisma } from "@/lib/prisma";

export type LogEntry = {
  ts: string;
  level: LogLevel;
  service?: string;
  prefix?: string;
  msg: string;
  meta?: LogMeta;
};

export type StoredLogEvent = {
  id: string;
  ts: string;
  level: LogLevel;
  service: string | null;
  prefix: string | null;
  msg: string;
  meta: LogMeta;
  createdAt: string;
};

function serializeMeta(meta: LogMeta) {
  if (meta === undefined) {
    return null;
  }

  try {
    return JSON.stringify(meta);
  } catch {
    return JSON.stringify({ error: "Failed to serialize log meta" });
  }
}

function parseMeta(value: string | null): LogMeta {
  if (!value) {
    return undefined;
  }

  try {
    return JSON.parse(value) as LogMeta;
  } catch {
    return { raw: value };
  }
}

export async function persistLogEntry(entry: LogEntry): Promise<void> {
  await prisma.logEvent.create({
    data: {
      ts: new Date(entry.ts),
      level: entry.level,
      service: entry.service ?? null,
      prefix: entry.prefix ?? null,
      msg: entry.msg,
      meta: serializeMeta(entry.meta),
    },
  });
}

export async function listRecentLogEvents(
  limit = 50,
): Promise<StoredLogEvent[]> {
  const rows = await prisma.logEvent.findMany({
    orderBy: { ts: "desc" },
    take: Math.min(Math.max(limit, 1), 200),
  });

  return rows.map((row) => ({
    id: row.id,
    ts: row.ts.toISOString(),
    level: row.level as LogLevel,
    service: row.service,
    prefix: row.prefix,
    msg: row.msg,
    meta: parseMeta(row.meta),
    createdAt: row.createdAt.toISOString(),
  }));
}
