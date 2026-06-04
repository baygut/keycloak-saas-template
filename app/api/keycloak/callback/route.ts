import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

import {
  exchangeKeycloakCode,
  readKeycloakConfig,
  decodeIdToken,
} from "@/lib/keycloak/keycloak";
import {
  clearPostLoginRedirectCookie,
  sanitizePostLoginPath,
  setAuthCookies,
} from "@/lib/auth/cookies";
import { POST_LOGIN_REDIRECT_COOKIE } from "@/lib/auth/constants";
import logger from "@/lib/logger";

const log = logger.child("keycloak-callback");

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const query = Object.fromEntries(url.searchParams.entries());

  log.debug("query parameters received", query);

  const error = url.searchParams.get("error");
  const errorDescription = url.searchParams.get("error_description");

  if (error) {
    log.error("authorization error", {
      error,
      errorDescription,
      query,
    });

    return NextResponse.json(
      {
        ok: false,
        stage: "authorization",
        error,
        errorDescription,
        query,
      },
      { status: 400 },
    );
  }

  const code = url.searchParams.get("code");

  if (!code) {
    log.error("missing authorization code", query);

    return NextResponse.json(
      {
        ok: false,
        stage: "authorization",
        error: "Missing code query parameter",
        query,
      },
      { status: 400 },
    );
  }

  const config = readKeycloakConfig();
  const redirectUri = new URL("/api/keycloak/callback", request.url).toString();
  const tokenResponse = await exchangeKeycloakCode({
    ...config,
    code,
    redirectUri,
  });

  log.info("token exchange response", {
    ok: tokenResponse.ok,
    status: tokenResponse.status,
    tokenEndpoint: tokenResponse.tokenEndpoint,
  });

  if (!tokenResponse.ok || !tokenResponse.payload.id_token) {
    log.error("token exchange failed", tokenResponse);
    return NextResponse.json(
      {
        ok: false,
        stage: "token-exchange",
        error: tokenResponse.payload.error || "Token exchange failed",
        errorDescription:
          tokenResponse.payload.error_description ||
          "Invalid credentials or code",
      },
      { status: tokenResponse.status || 400 },
    );
  }

  const decoded = decodeIdToken(tokenResponse.payload.id_token);
  if (!decoded) {
    log.error("failed to decode id_token");
    return NextResponse.json(
      {
        ok: false,
        stage: "token-decoding",
        error: "Failed to decode ID token",
      },
      { status: 500 },
    );
  }

  // Keycloak puts authorization roles in the Access Token by default, not the ID Token
  const decodedAccess = tokenResponse.payload.access_token
    ? decodeIdToken(tokenResponse.payload.access_token)
    : null;

  const roles =
    (decodedAccess?.realm_access as { roles?: string[] })?.roles || [];

  const sessionData = {
    name: decoded.name || decoded.preferred_username || "User",
    email: decoded.email,
    username: decoded.preferred_username,
    sub: decoded.sub,
    roles,
  };

  const cookieStore = await cookies();
  setAuthCookies(cookieStore, {
    sessionJson: JSON.stringify(sessionData),
    idToken: tokenResponse.payload.id_token,
    maxAge: tokenResponse.payload.expires_in || 3600,
  });

  log.info("session created successfully", {
    user: sessionData.email,
    name: sessionData.name,
  });

  const postLoginPath = sanitizePostLoginPath(
    cookieStore.get(POST_LOGIN_REDIRECT_COOKIE)?.value,
  );
  clearPostLoginRedirectCookie(cookieStore);

  const destination = postLoginPath ?? "/";
  return NextResponse.redirect(new URL(destination, request.url));
}
