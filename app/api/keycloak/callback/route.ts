import { NextRequest, NextResponse } from "next/server";

import { exchangeKeycloakCode, readKeycloakConfig } from "@/lib/keycloak";

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const query = Object.fromEntries(url.searchParams.entries());

  console.log("[keycloak-callback] query parameters received", query);

  const error = url.searchParams.get("error");
  const errorDescription = url.searchParams.get("error_description");

  if (error) {
    console.error("[keycloak-callback] authorization error", {
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
    console.error("[keycloak-callback] missing authorization code", query);

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

  console.log("[keycloak-callback] token exchange response", {
    ok: tokenResponse.ok,
    status: tokenResponse.status,
    tokenEndpoint: tokenResponse.tokenEndpoint,
    payload: tokenResponse.payload,
  });

  return NextResponse.json({
    ok: tokenResponse.ok,
    stage: "token-exchange",
    query,
    tokenResponse,
  });
}
