import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

import {
  ACCESS_TOKEN_COOKIE,
  ACCESS_TOKEN_EXP_COOKIE,
  ID_TOKEN_COOKIE,
  REFRESH_TOKEN_COOKIE,
  SESSION_COOKIE,
} from "@/lib/auth/constants";
import { clearAuthCookies, setAuthCookies } from "@/lib/auth/cookies";
import {
  decodeAccessToken,
  readKeycloakConfig,
  refreshKeycloakToken,
} from "@/lib/keycloak/keycloak";
import { parseSessionCookie } from "@/lib/auth/server";
import logger from "@/lib/logger";

const log = logger.child("auth-refresh");

export async function POST(_request: NextRequest) {
  const cookieStore = await cookies();
  const refreshToken = cookieStore.get(REFRESH_TOKEN_COOKIE)?.value;

  if (!refreshToken) {
    log.warn("refresh attempted with no refresh token cookie");
    return NextResponse.json({ ok: false, error: "No refresh token" }, { status: 401 });
  }

  const config = readKeycloakConfig();
  const tokenResponse = await refreshKeycloakToken({ ...config, refreshToken });

  if (!tokenResponse.ok) {
    // Refresh token expired or revoked — clear session and force re-login
    log.warn("refresh token rejected by Keycloak", {
      status: tokenResponse.status,
      error: tokenResponse.payload.error,
    });
    clearAuthCookies(cookieStore);
    return NextResponse.json({ ok: false, error: "Refresh token expired" }, { status: 401 });
  }

  const { access_token, refresh_token, id_token, expires_in, refresh_expires_in } =
    tokenResponse.payload;

  if (!access_token || !refresh_token) {
    log.error("refresh response missing tokens");
    clearAuthCookies(cookieStore);
    return NextResponse.json({ ok: false, error: "Invalid refresh response" }, { status: 401 });
  }

  // Re-extract roles from the new access token
  let roles: string[] = [];
  const decodedAccess = decodeAccessToken(access_token);
  if (!decodedAccess) {
    log.warn("failed to decode new access token after refresh — roles will be empty");
  } else {
    roles = decodedAccess.realm_access?.roles ?? [];
  }

  // Preserve existing session data, update roles from new token
  const existingSession = parseSessionCookie(cookieStore.get(SESSION_COOKIE)?.value);
  if (!existingSession) {
    log.warn("no existing session during refresh — clearing cookies");
    clearAuthCookies(cookieStore);
    return NextResponse.json({ ok: false, error: "No existing session" }, { status: 401 });
  }

  const updatedSession = { ...existingSession, roles };
  const expiresIn = expires_in || 3600;
  const accessTokenExp = Math.floor(Date.now() / 1000) + expiresIn;

  // id_token is not always returned on refresh — retain existing if absent
  const idToken = id_token ?? cookieStore.get(ID_TOKEN_COOKIE)?.value;
  if (!idToken) {
    log.error("no id_token available after refresh");
    clearAuthCookies(cookieStore);
    return NextResponse.json({ ok: false, error: "Missing id_token" }, { status: 401 });
  }

  setAuthCookies(cookieStore, {
    sessionJson: JSON.stringify(updatedSession),
    idToken,
    accessToken: access_token,
    refreshToken: refresh_token,
    accessTokenExp,
    maxAge: refresh_expires_in || expiresIn,
  });

  log.info("token refreshed successfully", { user: updatedSession.email });

  return NextResponse.json({ ok: true });
}
