import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

import {
  setOAuthNonceCookie,
  setOAuthStateCookie,
  setPostLoginRedirectCookie,
} from "@/lib/auth/cookies";
import {
  createKeycloakAuthorizationUrl,
  readKeycloakConfig,
} from "@/lib/keycloak/keycloak";
import logger from "@/lib/logger";

const log = logger.child("keycloak-login");

function buildRedirectUri(request: NextRequest): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  const base = appUrl ?? request.url;
  return new URL("/api/keycloak/callback", base).toString();
}

export async function GET(request: NextRequest) {
  const config = readKeycloakConfig();
  const redirectUri = buildRedirectUri(request);
  const state = crypto.randomUUID();
  const nonce = crypto.randomUUID();

  const authorizationUrl = createKeycloakAuthorizationUrl({
    ...config,
    redirectUri,
    state,
    nonce,
  });

  const cookieStore = await cookies();
  setOAuthStateCookie(cookieStore, state);
  setOAuthNonceCookie(cookieStore, nonce);

  const next = request.nextUrl.searchParams.get("next");
  if (next) {
    setPostLoginRedirectCookie(cookieStore, next);
  }

  log.info("redirecting to authorization endpoint", {
    redirectUri,
    issuer: `${config.baseUrl}/realms/${config.realm}`,
    clientId: config.clientId,
  });

  return NextResponse.redirect(authorizationUrl);
}
