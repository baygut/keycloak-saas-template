import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { AUTH_PATHS, SESSION_COOKIE } from "@/lib/auth/constants";
import { parseSessionCookie } from "@/lib/auth/server";

const PROTECTED_PREFIXES = ["/dashboard"];

function isProtectedBlogPath(pathname: string): boolean {
  if (pathname === "/blog") {
    return true;
  }

  if (pathname === "/blog/new") {
    return true;
  }

  const editMatch = /^\/blog\/[^/]+\/edit$/.test(pathname);
  return editMatch;
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const needsAuth =
    PROTECTED_PREFIXES.some((prefix) => pathname.startsWith(prefix)) ||
    isProtectedBlogPath(pathname);

  if (!needsAuth) {
    return NextResponse.next();
  }

  const session = parseSessionCookie(
    request.cookies.get(SESSION_COOKIE)?.value ?? null,
  );

  if (!session) {
    const loginUrl = new URL(AUTH_PATHS.LOGIN, request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 1. Admin-only routes
  const isAdminRoute =
    pathname.startsWith("/dashboard/users") ||
    pathname.startsWith("/dashboard/blogs") ||
    pathname.startsWith("/dashboard/logs");

  if (isAdminRoute) {
    const hasAdmin = session.roles.includes("admin");
    if (!hasAdmin) {
      const forbiddenUrl = new URL("/forbidden", request.url);
      forbiddenUrl.searchParams.set("message", "missing required role");
      forbiddenUrl.searchParams.set("required", "admin");
      if (session.roles.length) {
        forbiddenUrl.searchParams.set("roles", session.roles.join(","));
      }
      forbiddenUrl.searchParams.set("next", pathname);
      return NextResponse.redirect(forbiddenUrl);
    }
  }

  // 2. User-restricted routes (profile, blogs access)
  const isUserRestrictedRoute =
    pathname.startsWith("/dashboard/profile") ||
    isProtectedBlogPath(pathname);

  if (isUserRestrictedRoute) {
    const hasUserAccess = session.roles.includes("user") || session.roles.includes("admin");
    if (!hasUserAccess) {
      const forbiddenUrl = new URL("/forbidden", request.url);
      forbiddenUrl.searchParams.set("message", "user_restricted resource requires user or admin role");
      forbiddenUrl.searchParams.set("required", "user,admin");
      if (session.roles.length) {
        forbiddenUrl.searchParams.set("roles", session.roles.join(","));
      }
      forbiddenUrl.searchParams.set("next", pathname);
      return NextResponse.redirect(forbiddenUrl);
    }
  }

  const response = NextResponse.next();
  response.headers.set("x-pathname", pathname);
  return response;
}

export const config = {
  matcher: ["/dashboard/:path*", "/blog", "/blog/new", "/blog/:slug/edit"],
};
