import { ROLE_GROUPS, ROLES, type AppRole } from "@/lib/auth/constants";
import type { SessionUser } from "@/lib/auth/types";

export function hasRole(session: SessionUser, role: AppRole): boolean {
  return session.roles.includes(role);
}

export function hasAnyRole(
  session: SessionUser,
  roles: readonly AppRole[],
): boolean {
  return roles.some((role) => session.roles.includes(role));
}

export function isAdmin(session: SessionUser): boolean {
  return hasRole(session, ROLES.ADMIN);
}

export function canAccessUserResource(session: SessionUser): boolean {
  return hasAnyRole(session, ROLE_GROUPS.USER_ACCESS);
}

export function getSessionPrincipal(session: SessionUser): string {
  return session.username || session.email || session.sub;
}
