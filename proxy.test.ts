import { NextRequest } from "next/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/auth/server", () => ({
  parseSessionCookie: vi.fn(),
}));

vi.mock("@/lib/keycloak/keycloak", () => ({
  readKeycloakConfig: vi.fn().mockReturnValue({
    baseUrl: "http://localhost:8080",
    realm: "myrealm",
    clientId: "client",
    clientSecret: "secret",
  }),
  refreshKeycloakToken: vi.fn(),
  decodeAccessToken: vi.fn(),
}));

vi.mock("@/lib/logger", () => ({
  default: {
    child: vi.fn().mockReturnValue({
      debug: vi.fn(),
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
    }),
  },
}));

import { parseSessionCookie } from "@/lib/auth/server";
import {
  decodeAccessToken,
  refreshKeycloakToken,
} from "@/lib/keycloak/keycloak";
import { proxy } from "./proxy";
import type { SessionUser } from "@/lib/auth/types";

function makeSession(overrides: Partial<SessionUser> = {}): SessionUser {
  return { name: "User", sub: "sub-1", roles: [], ...overrides };
}

function req(path: string, cookies: Record<string, string> = {}) {
  const cookieHeader = Object.entries(cookies)
    .map(([k, v]) => `${k}=${v}`)
    .join("; ");
  return new NextRequest(`http://localhost${path}`, {
    headers: cookieHeader ? { cookie: cookieHeader } : {},
  });
}

describe("proxy — non-protected paths", () => {
  it("passes through requests to public pages", async () => {
    vi.mocked(parseSessionCookie).mockReturnValue(null);
    const response = await proxy(req("/"));
    expect(response.status).toBe(200);
  });

  it("passes through requests to signed-out page", async () => {
    const response = await proxy(req("/signed-out"));
    expect(response.status).toBe(200);
  });
});

describe("proxy — unauthenticated access", () => {
  it("redirects to login for /dashboard", async () => {
    vi.mocked(parseSessionCookie).mockReturnValue(null);
    const response = await proxy(req("/dashboard"));
    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toContain("/api/keycloak/login");
  });

  it("redirects to login for /dashboard/logs", async () => {
    vi.mocked(parseSessionCookie).mockReturnValue(null);
    const response = await proxy(req("/dashboard/logs"));
    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toContain("next=%2Fdashboard%2Flogs");
  });

  it("allows unauthenticated access to /blog (public listing)", async () => {
    vi.mocked(parseSessionCookie).mockReturnValue(null);
    const response = await proxy(req("/blog"));
    expect(response.status).toBe(200);
  });

  it("redirects to login for /blog/new", async () => {
    vi.mocked(parseSessionCookie).mockReturnValue(null);
    const response = await proxy(req("/blog/new"));
    expect(response.status).toBe(307);
  });

  it("redirects to login for /blog/:slug/edit", async () => {
    vi.mocked(parseSessionCookie).mockReturnValue(null);
    const response = await proxy(req("/blog/my-post/edit"));
    expect(response.status).toBe(307);
  });
});

describe("proxy — admin route authorization", () => {
  it("allows admin session on /dashboard/logs", async () => {
    vi.mocked(parseSessionCookie).mockReturnValue(
      makeSession({ roles: ["admin"] }),
    );
    const response = await proxy(req("/dashboard/logs", { session_token: "x" }));
    expect(response.status).toBe(200);
  });

  it("allows admin session on /dashboard/blogs", async () => {
    vi.mocked(parseSessionCookie).mockReturnValue(
      makeSession({ roles: ["admin"] }),
    );
    const response = await proxy(req("/dashboard/blogs", { session_token: "x" }));
    expect(response.status).toBe(200);
  });

  it("redirects user-role session to /forbidden on admin routes", async () => {
    vi.mocked(parseSessionCookie).mockReturnValue(
      makeSession({ roles: ["user"] }),
    );
    const response = await proxy(req("/dashboard/logs", { session_token: "x" }));
    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toContain("/forbidden");
  });

  it("redirects no-role session to /forbidden on admin routes", async () => {
    vi.mocked(parseSessionCookie).mockReturnValue(makeSession({ roles: [] }));
    const response = await proxy(
      req("/dashboard/users", { session_token: "x" }),
    );
    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toContain("/forbidden");
  });
});

describe("proxy — user-restricted route authorization", () => {
  it("allows user-role session on /dashboard/profile", async () => {
    vi.mocked(parseSessionCookie).mockReturnValue(
      makeSession({ roles: ["user"] }),
    );
    const response = await proxy(
      req("/dashboard/profile", { session_token: "x" }),
    );
    expect(response.status).toBe(200);
  });

  it("allows admin-role session on /dashboard/profile", async () => {
    vi.mocked(parseSessionCookie).mockReturnValue(
      makeSession({ roles: ["admin"] }),
    );
    const response = await proxy(
      req("/dashboard/profile", { session_token: "x" }),
    );
    expect(response.status).toBe(200);
  });

  it("redirects no-role session to /forbidden on user-restricted routes", async () => {
    vi.mocked(parseSessionCookie).mockReturnValue(makeSession({ roles: [] }));
    const response = await proxy(
      req("/dashboard/profile", { session_token: "x" }),
    );
    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toContain("/forbidden");
  });

  it("allows user-role session on /blog", async () => {
    vi.mocked(parseSessionCookie).mockReturnValue(
      makeSession({ roles: ["user"] }),
    );
    const response = await proxy(req("/blog", { session_token: "x" }));
    expect(response.status).toBe(200);
  });
});

describe("proxy — proactive token refresh", () => {
  const nowSeconds = Math.floor(Date.now() / 1000);
  const nearExpiry = String(nowSeconds + 10);

  it("redirects to login when refresh token cookie is absent", async () => {
    vi.mocked(parseSessionCookie).mockReturnValue(
      makeSession({ roles: ["user"] }),
    );
    const response = await proxy(
      req("/dashboard/profile", {
        session_token: "x",
        access_token_exp: nearExpiry,
      }),
    );
    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toContain("/api/keycloak/login");
  });

  it("redirects to login when Keycloak rejects the refresh token", async () => {
    vi.mocked(parseSessionCookie).mockReturnValue(
      makeSession({ roles: ["user"] }),
    );
    vi.mocked(refreshKeycloakToken).mockResolvedValue({
      ok: false,
      status: 401,
      payload: { error: "invalid_grant" },
    } as never);

    const response = await proxy(
      req("/dashboard/profile", {
        session_token: "x",
        refresh_token: "old-refresh",
        access_token_exp: nearExpiry,
      }),
    );
    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toContain("/api/keycloak/login");
  });

  it("rotates cookies and continues when refresh succeeds", async () => {
    const session = makeSession({ roles: ["user"] });
    vi.mocked(parseSessionCookie).mockReturnValue(session);
    vi.mocked(refreshKeycloakToken).mockResolvedValue({
      ok: true,
      status: 200,
      payload: {
        access_token: "new-access",
        refresh_token: "new-refresh",
        id_token: "new-id",
        expires_in: 300,
        refresh_expires_in: 1800,
      },
    } as never);
    vi.mocked(decodeAccessToken).mockReturnValue({
      realm_access: { roles: ["user"] },
    } as never);

    const response = await proxy(
      req("/dashboard/profile", {
        session_token: "x",
        refresh_token: "old-refresh",
        kc_id_token: "old-id",
        access_token_exp: nearExpiry,
      }),
    );
    expect(response.status).toBe(200);
    const setCookies = response.headers.getSetCookie?.() ?? [];
    expect(setCookies.some((c) => c.startsWith("access_token=new-access"))).toBe(true);
  });
});
