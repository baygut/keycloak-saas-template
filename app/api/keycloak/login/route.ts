import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

import { setPostLoginRedirectCookie } from "@/lib/auth/cookies";
import {
  createKeycloakAuthorizationUrl,
  readKeycloakConfig,
} from "@/lib/keycloak/keycloak";

export async function GET(request: NextRequest) {
  const config = readKeycloakConfig();
  const redirectUri = new URL("/api/keycloak/callback", request.url).toString();
  const state = crypto.randomUUID();
  const authorizationUrl = createKeycloakAuthorizationUrl({
    ...config,
    redirectUri,
    state,
  });

  const next = request.nextUrl.searchParams.get("next");
  if (next) {
    const cookieStore = await cookies();
    setPostLoginRedirectCookie(cookieStore, next);
  }

  console.log("[keycloak-login] redirecting to authorization endpoint", {
    authorizationUrl: authorizationUrl.toString(),
    redirectUri,
    state,
    next,
    issuer: `${config.baseUrl}/realms/${config.realm}`,
    clientId: config.clientId,
  });

  return NextResponse.redirect(authorizationUrl);
}
