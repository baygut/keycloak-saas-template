import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

import { setOAuthStateCookie } from "@/lib/auth/cookies";
import {
  createKeycloakRegistrationUrl,
  readKeycloakConfig,
} from "@/lib/keycloak/keycloak";
import logger from "@/lib/logger";

const log = logger.child("keycloak-register");

function buildRedirectUri(request: NextRequest): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  const base = appUrl ?? request.url;
  return new URL("/api/keycloak/callback", base).toString();
}

export async function GET(request: NextRequest) {
  const config = readKeycloakConfig();
  const redirectUri = buildRedirectUri(request);
  const state = crypto.randomUUID();

  const registrationUrl = createKeycloakRegistrationUrl({
    ...config,
    redirectUri,
    state,
  });

  const cookieStore = await cookies();
  setOAuthStateCookie(cookieStore, state);

  log.info("redirecting to registration endpoint", {
    redirectUri,
    issuer: `${config.baseUrl}/realms/${config.realm}`,
    clientId: config.clientId,
  });

  return NextResponse.redirect(registrationUrl);
}
