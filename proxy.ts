import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import {
  ACCESS_TOKEN_COOKIE,
  ACCESS_TOKEN_EXP_COOKIE,
  AUTH_PATHS,
  ID_TOKEN_COOKIE,
  REFRESH_TOKEN_COOKIE,
  SESSION_COOKIE,
} from "@/lib/auth/constants";
import { parseSessionCookie } from "@/lib/auth/server";
import {
  decodeAccessToken,
  readKeycloakConfig,
  refreshKeycloakToken,
} from "@/lib/keycloak/keycloak";
import logger from "@/lib/logger";

const log = logger.child("proxy");

const PROTECTED_PREFIXES = ["/dashboard"];
const PROACTIVE_REFRESH_SECONDS = 30;

function isProtectedBlogPath(pathname: string): boolean {
  if (pathname === "/blog/new") return true;
  return /^\/blog\/[^/]+\/edit$/.test(pathname);
}

function cookieOptions(maxAge: number) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    maxAge,
    path: "/",
  };
}

async function tryRefresh(
  request: NextRequest,
  response: NextResponse,
): Promise<{ success: boolean; response: NextResponse }> {
  const refreshToken = request.cookies.get(REFRESH_TOKEN_COOKIE)?.value;
  if (!refreshToken) {
    log.warn("proactive refresh: no refresh token cookie");
    return { success: false, response };
  }

  let config;
  try {
    config = readKeycloakConfig();
  } catch {
    log.error("proactive refresh: failed to read keycloak config");
    return { success: false, response };
  }

  const tokenResponse = await refreshKeycloakToken({ ...config, refreshToken });

  if (!tokenResponse.ok) {
    log.warn("proactive refresh: Keycloak rejected refresh token", {
      status: tokenResponse.status,
      error: tokenResponse.payload.error,
    });
    return { success: false, response };
  }

  const {
    access_token,
    refresh_token,
    id_token,
    expires_in,
    refresh_expires_in,
  } = tokenResponse.payload;

  if (!access_token || !refresh_token) {
    log.error("proactive refresh: missing tokens in response");
    return { success: false, response };
  }

  let roles: string[] = [];
  const decodedAccess = decodeAccessToken(access_token);
  if (!decodedAccess) {
    log.warn(
      "proactive refresh: failed to decode new access token — roles empty",
    );
  } else {
    roles = decodedAccess.realm_access?.roles ?? [];
  }

  const existingSession = parseSessionCookie(
    request.cookies.get(SESSION_COOKIE)?.value ?? null,
  );
  if (!existingSession) {
    return { success: false, response };
  }

  const updatedSession = { ...existingSession, roles };
  const expiresIn = expires_in || 3600;
  const accessTokenExp = Math.floor(Date.now() / 1000) + expiresIn;
  const maxAge = refresh_expires_in || expiresIn;
  const idToken = id_token ?? request.cookies.get(ID_TOKEN_COOKIE)?.value;

  if (!idToken) {
    log.error("proactive refresh: no id_token available after refresh");
    return { success: false, response };
  }

  const opts = cookieOptions(maxAge);
  response.cookies.set(SESSION_COOKIE, JSON.stringify(updatedSession), opts);
  response.cookies.set(ID_TOKEN_COOKIE, idToken, opts);
  response.cookies.set(ACCESS_TOKEN_COOKIE, access_token, opts);
  response.cookies.set(REFRESH_TOKEN_COOKIE, refresh_token, opts);
  response.cookies.set(ACCESS_TOKEN_EXP_COOKIE, String(accessTokenExp), opts);

  log.info("proactive refresh: tokens rotated", { user: updatedSession.email });
  return { success: true, response };
}

export async function proxy(request: NextRequest) {
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

  // Proactive refresh: rotate tokens if access token expires within threshold
  const expRaw = request.cookies.get(ACCESS_TOKEN_EXP_COOKIE)?.value;
  const exp = expRaw ? parseInt(expRaw, 10) : null;
  const nowSeconds = Math.floor(Date.now() / 1000);
  let baseResponse = NextResponse.next();
  baseResponse.headers.set("x-pathname", pathname);

  const shouldRefresh =
    exp !== null && exp - nowSeconds <= PROACTIVE_REFRESH_SECONDS;

  if (shouldRefresh) {
    log.info("proactive refresh: access token near expiry", {
      expiresIn: exp - nowSeconds,
    });
    const refreshResult = await tryRefresh(request, baseResponse);
    if (!refreshResult.success) {
      // Refresh failed — redirect to login
      const loginUrl = new URL(AUTH_PATHS.LOGIN, request.url);
      loginUrl.searchParams.set("next", pathname);
      return NextResponse.redirect(loginUrl);
    }
    baseResponse = refreshResult.response;
  }

  // Role-based access checks (read from request cookies — post-refresh
  // cookies are on the response but the session roles were updated in memory above)
  const effectiveSession =
    exp !== null && exp - nowSeconds <= PROACTIVE_REFRESH_SECONDS
      ? (parseSessionCookie(
          baseResponse.cookies.get(SESSION_COOKIE)?.value ?? null,
        ) ?? session)
      : session;

  // 1. Admin-only routes
  const isAdminRoute =
    pathname.startsWith("/dashboard/users") ||
    pathname.startsWith("/dashboard/blogs") ||
    pathname.startsWith("/dashboard/logs") ||
    pathname.startsWith("/dashboard/analytics");

  if (isAdminRoute) {
    if (!effectiveSession.roles.includes("admin")) {
      const forbiddenUrl = new URL("/forbidden", request.url);
      forbiddenUrl.searchParams.set("message", "missing required role");
      forbiddenUrl.searchParams.set("required", "admin");
      if (effectiveSession.roles.length) {
        forbiddenUrl.searchParams.set(
          "roles",
          effectiveSession.roles.join(","),
        );
      }
      forbiddenUrl.searchParams.set("next", pathname);
      return NextResponse.redirect(forbiddenUrl);
    }
  }

  // 2. User-restricted routes (profile, blogs access)
  const isUserRestrictedRoute =
    pathname.startsWith("/dashboard/profile") ||
    pathname.startsWith("/dashboard/my-blogs") ||
    isProtectedBlogPath(pathname);

  if (isUserRestrictedRoute) {
    const hasUserAccess =
      effectiveSession.roles.includes("user") ||
      effectiveSession.roles.includes("admin");
    if (!hasUserAccess) {
      const forbiddenUrl = new URL("/forbidden", request.url);
      forbiddenUrl.searchParams.set(
        "message",
        "user_restricted resource requires user or admin role",
      );
      forbiddenUrl.searchParams.set("required", "user,admin");
      if (effectiveSession.roles.length) {
        forbiddenUrl.searchParams.set(
          "roles",
          effectiveSession.roles.join(","),
        );
      }
      forbiddenUrl.searchParams.set("next", pathname);
      return NextResponse.redirect(forbiddenUrl);
    }
  }

  return baseResponse;
}

export const config = {
  matcher: ["/dashboard/:path*", "/blog/new", "/blog/:slug/edit"],
};
