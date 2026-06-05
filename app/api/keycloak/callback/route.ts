import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

import {
  exchangeKeycloakCode,
  readKeycloakConfig,
  decodeIdToken,
  decodeAccessToken,
} from "@/lib/keycloak/keycloak";
import {
  clearOAuthCookies,
  clearPostLoginRedirectCookie,
  sanitizePostLoginPath,
  setAuthCookies,
} from "@/lib/auth/cookies";
import {
  OAUTH_NONCE_COOKIE,
  OAUTH_STATE_COOKIE,
  POST_LOGIN_REDIRECT_COOKIE,
} from "@/lib/auth/constants";
import logger from "@/lib/logger";

const log = logger.child("keycloak-callback");

function buildRedirectUri(request: NextRequest): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  const base = appUrl ?? request.url;
  return new URL("/api/keycloak/callback", base).toString();
}

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const cookieStore = await cookies();

  const error = url.searchParams.get("error");
  const errorDescription = url.searchParams.get("error_description");

  if (error) {
    log.error("authorization error from Keycloak", { error, errorDescription });
    return NextResponse.json(
      { ok: false, stage: "authorization", error, errorDescription },
      { status: 400 },
    );
  }

  const code = url.searchParams.get("code");
  if (!code) {
    log.error("missing authorization code");
    return NextResponse.json(
      { ok: false, stage: "authorization", error: "Missing code query parameter" },
      { status: 400 },
    );
  }

  // CSRF: validate state
  const returnedState = url.searchParams.get("state");
  const storedState = cookieStore.get(OAUTH_STATE_COOKIE)?.value;
  if (!returnedState || !storedState || returnedState !== storedState) {
    log.error("state mismatch — possible CSRF attack", {
      returnedState,
      hasStoredState: !!storedState,
    });
    return NextResponse.json(
      { ok: false, stage: "csrf", error: "State mismatch" },
      { status: 400 },
    );
  }

  const storedNonce = cookieStore.get(OAUTH_NONCE_COOKIE)?.value;

  const config = readKeycloakConfig();
  const redirectUri = buildRedirectUri(request);
  const tokenResponse = await exchangeKeycloakCode({ ...config, code, redirectUri });

  log.info("token exchange response", {
    ok: tokenResponse.ok,
    status: tokenResponse.status,
    tokenEndpoint: tokenResponse.tokenEndpoint,
  });

  if (
    !tokenResponse.ok ||
    !tokenResponse.payload.id_token ||
    !tokenResponse.payload.access_token ||
    !tokenResponse.payload.refresh_token
  ) {
    log.error("token exchange failed", tokenResponse);
    return NextResponse.json(
      {
        ok: false,
        stage: "token-exchange",
        error: tokenResponse.payload.error || "Token exchange failed",
        errorDescription:
          tokenResponse.payload.error_description || "Invalid credentials or code",
      },
      { status: tokenResponse.status || 400 },
    );
  }

  // Clear OAuth cookies now that we've consumed them
  clearOAuthCookies(cookieStore);

  const decoded = decodeIdToken(tokenResponse.payload.id_token);
  if (!decoded) {
    log.error("failed to decode id_token");
    return NextResponse.json(
      { ok: false, stage: "token-decoding", error: "Failed to decode ID token" },
      { status: 500 },
    );
  }

  // Nonce validation
  if (!storedNonce || decoded.nonce !== storedNonce) {
    log.error("nonce mismatch — possible replay attack", {
      hasStoredNonce: !!storedNonce,
      hasTokenNonce: !!decoded.nonce,
    });
    return NextResponse.json(
      { ok: false, stage: "nonce", error: "Nonce mismatch" },
      { status: 400 },
    );
  }

  // Keycloak puts authorization roles in the Access Token, not the ID Token
  let roles: string[] = [];
  if (tokenResponse.payload.access_token) {
    const decodedAccess = decodeAccessToken(tokenResponse.payload.access_token);
    if (!decodedAccess) {
      log.warn("failed to decode access token — roles will be empty");
    } else {
      roles = decodedAccess.realm_access?.roles ?? [];
    }
  } else {
    log.warn("no access token in token response — roles will be empty");
  }

  const sessionData = {
    name: decoded.name || decoded.preferred_username || "User",
    email: decoded.email,
    username: decoded.preferred_username,
    sub: decoded.sub,
    roles,
  };

  const expiresIn = tokenResponse.payload.expires_in || 3600;
  const accessTokenExp = Math.floor(Date.now() / 1000) + expiresIn;

  setAuthCookies(cookieStore, {
    sessionJson: JSON.stringify(sessionData),
    idToken: tokenResponse.payload.id_token,
    accessToken: tokenResponse.payload.access_token!,
    refreshToken: tokenResponse.payload.refresh_token!,
    accessTokenExp,
    maxAge: tokenResponse.payload.refresh_expires_in || expiresIn,
  });

  log.info("session created successfully", {
    user: sessionData.email,
    name: sessionData.name,
    roles: sessionData.roles,
  });

  const postLoginPath = sanitizePostLoginPath(
    cookieStore.get(POST_LOGIN_REDIRECT_COOKIE)?.value,
  );
  clearPostLoginRedirectCookie(cookieStore);

  const destination = postLoginPath ?? "/";
  return NextResponse.redirect(new URL(destination, request.url));
}
