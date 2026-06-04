import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";

import { redirectToForbidden } from "@/lib/auth/forbidden-response";
import {
  AUTH_PATHS,
  ROLE_GROUPS,
  SESSION_COOKIE,
  type AppRole,
} from "@/lib/auth/constants";
import {
  canAccessUserResource,
  hasAnyRole,
  hasRole,
} from "@/lib/auth/permissions";
import { PROTECTED_RESOURCES } from "@/lib/auth/resources";
import type { SafeSessionUser, SessionUser } from "@/lib/auth/types";

async function currentPathname(): Promise<string | undefined> {
  const headerList = await headers();
  return (
    headerList.get("x-pathname") ??
    headerList.get("next-url") ??
    headerList.get("referer") ??
    undefined
  );
}

function deny(
  session: SessionUser,
  context: Parameters<typeof redirectToForbidden>[1],
): never {
  redirectToForbidden(session, context);
}

export function parseSessionCookie(value?: string | null): SessionUser | null {
  if (!value) {
    return null;
  }

  try {
    const parsed = JSON.parse(value) as Partial<SessionUser>;

    if (
      !parsed ||
      typeof parsed !== "object" ||
      typeof parsed.name !== "string" ||
      typeof parsed.sub !== "string"
    ) {
      return null;
    }

    return {
      name: parsed.name,
      email: typeof parsed.email === "string" ? parsed.email : undefined,
      username:
        typeof parsed.username === "string" ? parsed.username : undefined,
      roles: Array.isArray(parsed.roles)
        ? parsed.roles.filter(
            (role): role is string => typeof role === "string",
          )
        : [],
      sub: parsed.sub,
    };
  } catch {
    return null;
  }
}

export async function getSession(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  return parseSessionCookie(cookieStore.get(SESSION_COOKIE)?.value ?? null);
}

export async function requireSession(): Promise<SessionUser> {
  const session = await getSession();

  if (!session) {
    redirect(AUTH_PATHS.LOGIN);
  }

  return session;
}

export async function requireRole(role: AppRole): Promise<SessionUser> {
  const session = await requireSession();
  const route = await currentPathname();

  if (!hasRole(session, role)) {
    deny(session, {
      reason: "missing required role",
      resource: PROTECTED_RESOURCES.ADMIN,
      requiredRoles: [role],
      route,
      returnTo: route,
    });
  }

  return session;
}

export async function requireAnyRole(
  roles: readonly AppRole[],
): Promise<SessionUser> {
  const session = await requireSession();
  const route = await currentPathname();

  if (!hasAnyRole(session, roles)) {
    deny(session, {
      reason: "missing one of required roles",
      requiredRoles: [...roles],
      route,
      returnTo: route,
    });
  }

  return session;
}

export async function requireUserResourceAccess(): Promise<SessionUser> {
  const session = await requireSession();
  const route = await currentPathname();

  if (!canAccessUserResource(session)) {
    deny(session, {
      reason: "user_restricted resource requires user or admin role",
      resource: PROTECTED_RESOURCES.USER,
      requiredRoles: [...ROLE_GROUPS.USER_ACCESS],
      route,
      returnTo: route,
    });
  }

  return session;
}

export function getSafeSessionUser(session: SessionUser): SafeSessionUser {
  return {
    name: session.name,
    email: session.email,
    username: session.username,
    roles: session.roles,
    sub: session.sub,
  };
}

export { ROLE_GROUPS };
