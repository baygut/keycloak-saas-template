/**
 * @deprecated Import from `@/lib/auth/server` and `@/lib/auth/permissions` instead.
 */
export type { SessionUser } from "@/lib/auth/types";
export {
  getSession,
  getSession as getSessionFromCookies,
  parseSessionCookie,
} from "@/lib/auth/server";
export {
  getSessionPrincipal,
  isAdmin as isAdminSession,
} from "@/lib/auth/permissions";
