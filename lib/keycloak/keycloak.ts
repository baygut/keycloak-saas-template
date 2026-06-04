type KeycloakConfig = {
  baseUrl: string;
  realm: string;
  clientId: string;
  clientSecret?: string;
};

export type KeycloakTokenResponse = {
  access_token?: string;
  expires_in?: number;
  id_token?: string;
  refresh_token?: string;
  refresh_expires_in?: number;
  scope?: string;
  session_state?: string;
  token_type?: string;
  error?: string;
  error_description?: string;
  [key: string]: unknown;
};

export function readKeycloakConfig(): KeycloakConfig {
  const baseUrl = process.env.KEYCLOAK_URL;
  const realm = process.env.KEYCLOAK_REALM;
  const clientId = process.env.KEYCLOAK_CLIENT_ID;
  const clientSecret = process.env.KEYCLOAK_CLIENT_SECRET;

  if (!baseUrl || !realm || !clientId) {
    throw new Error("Missing required Keycloak environment variables.");
  }

  return {
    baseUrl,
    realm,
    clientId,
    ...(clientSecret ? { clientSecret } : {}),
  };
}

/** Keycloak Admin Console — Users list for the configured realm. */
export function getKeycloakAdminConsoleUsersUrl(): string {
  const { baseUrl, realm } = readKeycloakConfig();
  const normalizedBase = baseUrl.replace(/\/$/, "");
  return `${normalizedBase}/admin/master/console/#/${realm}/users`;
}

export function createKeycloakAuthorizationUrl({
  baseUrl,
  realm,
  clientId,
  redirectUri,
  state,
}: KeycloakConfig & {
  redirectUri: string;
  state: string;
}) {
  const url = new URL(
    `${baseUrl}/realms/${realm}/protocol/openid-connect/auth`,
  );

  url.searchParams.set("client_id", clientId);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", "openid profile email");
  url.searchParams.set("state", state);

  return url;
}

export function createKeycloakLogoutUrl({
  baseUrl,
  realm,
  clientId,
  postLogoutRedirectUri,
  idTokenHint,
}: KeycloakConfig & {
  postLogoutRedirectUri: string;
  idTokenHint?: string;
}) {
  const url = new URL(
    `${baseUrl}/realms/${realm}/protocol/openid-connect/logout`,
  );

  url.searchParams.set("client_id", clientId);
  url.searchParams.set("post_logout_redirect_uri", postLogoutRedirectUri);

  if (idTokenHint) {
    url.searchParams.set("id_token_hint", idTokenHint);
  }

  return url;
}

export function createKeycloakRegistrationUrl({
  baseUrl,
  realm,
  clientId,
  redirectUri,
  state,
}: KeycloakConfig & {
  redirectUri: string;
  state: string;
}) {
  const url = new URL(
    `${baseUrl}/realms/${realm}/protocol/openid-connect/registrations`,
  );

  url.searchParams.set("client_id", clientId);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", "openid profile email");
  url.searchParams.set("state", state);

  return url;
}

export type DecodedIdToken = {
  sub: string;
  email?: string;
  email_verified?: boolean;
  name?: string;
  preferred_username?: string;
  given_name?: string;
  family_name?: string;
  [key: string]: unknown;
};

export function decodeIdToken(token: string): DecodedIdToken | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const payload = parts[1];
    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = Buffer.from(base64, "base64").toString("utf8");
    return JSON.parse(jsonPayload) as DecodedIdToken;
  } catch (error) {
    console.error("[keycloak-utils] failed to decode ID token", error);
    return null;
  }
}


export async function exchangeKeycloakCode({
  baseUrl,
  realm,
  clientId,
  clientSecret,
  code,
  redirectUri,
}: KeycloakConfig & {
  code: string;
  redirectUri: string;
}) {
  const tokenEndpoint = `${baseUrl}/realms/${realm}/protocol/openid-connect/token`;
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    client_id: clientId,
    code,
    redirect_uri: redirectUri,
  });

  if (clientSecret) {
    body.set("client_secret", clientSecret);
  }

  const response = await fetch(tokenEndpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
    cache: "no-store",
  });

  const payload = (await response.json()) as KeycloakTokenResponse;

  return {
    ok: response.ok,
    status: response.status,
    tokenEndpoint,
    payload,
  };
}
