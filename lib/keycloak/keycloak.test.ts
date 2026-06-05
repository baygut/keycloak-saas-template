import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

import {
  readKeycloakConfig,
  getKeycloakAdminConsoleUsersUrl,
  createKeycloakAuthorizationUrl,
  createKeycloakLogoutUrl,
  createKeycloakRegistrationUrl,
  decodeIdToken,
  exchangeKeycloakCode,
} from "./keycloak";

const KC_BASE_URL = "http://localhost:8080";
const KC_REALM = "myrealm";
const KC_CLIENT_ID = "my-nextjs-client";

beforeEach(() => {
  vi.stubEnv("KEYCLOAK_URL", KC_BASE_URL);
  vi.stubEnv("KEYCLOAK_REALM", KC_REALM);
  vi.stubEnv("KEYCLOAK_CLIENT_ID", KC_CLIENT_ID);
  vi.stubEnv(
    "KEYCLOAK_CLIENT_SECRET",
    "replace_with_your_keycloak_client_secret",
  );
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

describe("readKeycloakConfig", () => {
  it("returns config from env", () => {
    const config = readKeycloakConfig();

    expect(config).toEqual({
      baseUrl: KC_BASE_URL,
      realm: KC_REALM,
      clientId: KC_CLIENT_ID,
      clientSecret: "replace_with_your_keycloak_client_secret",
    });
  });

  it("throws when required env vars are missing", () => {
    delete process.env.KEYCLOAK_URL;

    expect(() => readKeycloakConfig()).toThrow(
      "Missing required Keycloak environment variables.",
    );
  });
});

describe("getKeycloakAdminConsoleUsersUrl", () => {
  it("builds admin console url correctly", () => {
    const url = getKeycloakAdminConsoleUsersUrl();

    expect(url).toBe(
      `${KC_BASE_URL}/admin/master/console/#/${KC_REALM}/users`,
    );
  });
});

describe("createKeycloakAuthorizationUrl", () => {
  it("builds auth url with correct params", () => {
    const url = createKeycloakAuthorizationUrl({
      baseUrl: KC_BASE_URL,
      realm: KC_REALM,
      clientId: KC_CLIENT_ID,
      redirectUri: "https://app/callback",
      state: "abc123",
      nonce: "nonce123",
    });

    expect(url.toString()).toContain(
      "/realms/myrealm/protocol/openid-connect/auth",
    );

    expect(url.searchParams.get("client_id")).toBe("my-nextjs-client");
    expect(url.searchParams.get("redirect_uri")).toBe("https://app/callback");
    expect(url.searchParams.get("state")).toBe("abc123");
    expect(url.searchParams.get("response_type")).toBe("code");
    expect(url.searchParams.get("scope")).toBe("openid profile email");
  });
});

describe("createKeycloakLogoutUrl", () => {
  it("builds logout url with id_token_hint", () => {
    const url = createKeycloakLogoutUrl({
      baseUrl: KC_BASE_URL,
      realm: KC_REALM,
      clientId: KC_CLIENT_ID,
      postLogoutRedirectUri: "https://app",
      idTokenHint: "token123",
    });

    expect(url.searchParams.get("client_id")).toBe("my-nextjs-client");
    expect(url.searchParams.get("post_logout_redirect_uri")).toBe(
      "https://app",
    );
    expect(url.searchParams.get("id_token_hint")).toBe("token123");
  });

  it("works without id_token_hint", () => {
    const url = createKeycloakLogoutUrl({
      baseUrl: KC_BASE_URL,
      realm: KC_REALM,
      clientId: KC_CLIENT_ID,
      postLogoutRedirectUri: "https://app",
    });

    expect(url.searchParams.has("id_token_hint")).toBe(false);
  });
});

describe("createKeycloakRegistrationUrl", () => {
  it("builds registration url", () => {
    const url = createKeycloakRegistrationUrl({
      baseUrl: KC_BASE_URL,
      realm: KC_REALM,
      clientId: KC_CLIENT_ID,
      redirectUri: "https://app/callback",
      state: "xyz",
    });

    expect(url.toString()).toContain("registrations");
    expect(url.searchParams.get("state")).toBe("xyz");
  });
});

describe("decodeIdToken", () => {
  it("decodes valid JWT payload", () => {
    const payload = {
      sub: "user-123",
      email: "test@example.com",
    };

    const base64 = Buffer.from(JSON.stringify(payload)).toString("base64url");

    const token = `header.${base64}.signature`;

    const decoded = decodeIdToken(token);

    expect(decoded).toEqual(payload);
  });

  it("returns null for invalid token", () => {
    expect(decodeIdToken("invalid.token")).toBeNull();
  });
});

describe("exchangeKeycloakCode", () => {
  it("returns token response on success", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        access_token: "access123",
        refresh_token: "refresh123",
      }),
    });

    const result = await exchangeKeycloakCode({
      baseUrl: KC_BASE_URL,
      realm: KC_REALM,
      clientId: KC_CLIENT_ID,
      clientSecret: "secret",
      code: "auth-code",
      redirectUri: "https://app/callback",
    });

    expect(result.ok).toBe(true);
    expect(result.status).toBe(200);
    expect(result.payload.access_token).toBe("access123");
  });

  it("handles error response", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      json: async () => ({
        error: "invalid_grant",
        error_description: "Bad code",
      }),
    });

    const result = await exchangeKeycloakCode({
      baseUrl: KC_BASE_URL,
      realm: KC_REALM,
      clientId: KC_CLIENT_ID,
      code: "bad-code",
      redirectUri: "https://app/callback",
    });

    expect(result.ok).toBe(false);
    expect(result.status).toBe(400);
    expect(result.payload.error).toBe("invalid_grant");
  });
});
