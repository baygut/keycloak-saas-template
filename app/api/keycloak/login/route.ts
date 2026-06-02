import { NextRequest, NextResponse } from "next/server";

import {
  createKeycloakAuthorizationUrl,
  readKeycloakConfig,
} from "@/lib/keycloak";

export function GET(request: NextRequest) {
  const config = readKeycloakConfig();
  const redirectUri = new URL("/api/keycloak/callback", request.url).toString();
  const state = crypto.randomUUID();
  const authorizationUrl = createKeycloakAuthorizationUrl({
    ...config,
    redirectUri,
    state,
  });

  console.log("[keycloak-login] redirecting to authorization endpoint", {
    authorizationUrl: authorizationUrl.toString(),
    redirectUri,
    state,
    issuer: `${config.baseUrl}/realms/${config.realm}`,
    clientId: config.clientId,
  });

  return NextResponse.redirect(authorizationUrl);
}
