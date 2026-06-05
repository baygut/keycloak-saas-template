import { requireRole } from "@/lib/auth/server";
import { ROLES } from "@/lib/auth/constants";
import type { SessionUser } from "@/lib/auth/types";
import { listRecentLogEvents, listLogEventsCursor } from "@/lib/log-store";
import logger from "@/lib/logger";

const log = logger.child("admin-logs");

export type AdminLogEvent = {
  id: string;
  level: string;
  prefix: string | null;
  service: string | null;
  message: string;
  meta?: Record<string, unknown>;
  time: string;
};

export async function getAdminRecentLogEvents(
  session?: SessionUser,
): Promise<AdminLogEvent[]> {
  const admin = session ?? (await requireRole(ROLES.ADMIN));
  const recentEvents = await listRecentLogEvents(50);

  log.info("admin log events fetched", {
    admin: admin.username ?? admin.sub,
    eventCount: recentEvents.length,
  });

  return recentEvents.map((event) => ({
    id: event.id,
    level: event.level,
    prefix: event.prefix,
    service: event.service,
    message: event.msg,
    meta: event.meta,
    time: event.ts,
  }));
}

export async function getAdminLogEventsCursor(options: {
  cursor?: string;
  limit?: number;
}): Promise<{ events: AdminLogEvent[]; nextCursor: string | null }> {
  const { events, nextCursor } = await listLogEventsCursor(options);

  return {
    events: events.map((event) => ({
      id: event.id,
      level: event.level,
      prefix: event.prefix,
      service: event.service,
      message: event.msg,
      meta: event.meta,
      time: event.ts,
    })),
    nextCursor,
  };
}
