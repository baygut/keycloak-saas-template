import type { SessionUser } from "@/lib/auth/types";
import type { ProtectedResourceId } from "@/lib/auth/resources";
import logger from "@/lib/logger";

const log = logger.child("access");

export type AccessDenialContext = {
  resource?: ProtectedResourceId;
  requiredRoles?: readonly string[];
  route?: string;
  reason: string;
};

export function logAccessDenied(
  session: SessionUser | null,
  context: AccessDenialContext,
) {
  log.warn("access denied", {
    reason: context.reason,
    resource: context.resource,
    requiredRoles: context.requiredRoles,
    route: context.route,
    sub: session?.sub,
    username: session?.username,
    roles: session?.roles ?? [],
  });
}
