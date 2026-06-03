import { NextRequest, NextResponse } from "next/server";

import {
  createKeycloakRegistrationUrl,
  readKeycloakConfig,
} from "@/lib/keycloak";

export function GET(request: NextRequest) {
  const config = readKeycloakConfig();
  const redirectUri = new URL("/api/keycloak/callback", request.url).toString();
  const state = crypto.randomUUID();
  const registrationUrl = createKeycloakRegistrationUrl({
    ...config,
    redirectUri,
    state,
  });

  console.log("[keycloak-register] redirecting to registration endpoint", {
    registrationUrl: registrationUrl.toString(),
    redirectUri,
    state,
    issuer: `${config.baseUrl}/realms/${config.realm}`,
    clientId: config.clientId,
  });

  return NextResponse.redirect(registrationUrl);
}
