import { beforeEach, describe, expect, it, vi } from "vitest";

import type { SessionUser } from "@/lib/auth/types";

vi.mock("next/headers", () => ({
  cookies: vi.fn(),
  headers: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  redirect: vi.fn().mockImplementation((url: string) => {
    throw Object.assign(new Error(`REDIRECT:${url}`), {
      digest: `NEXT_REDIRECT;replace;${url}`,
    });
  }),
  unstable_rethrow: vi.fn(),
}));

vi.mock("@/lib/auth/forbidden-response", () => ({
  redirectToForbidden: vi.fn().mockImplementation(() => {
    throw Object.assign(new Error("FORBIDDEN"), { digest: "FORBIDDEN" });
  }),
}));

vi.mock("@/lib/auth/access-log", () => ({
  logAccessDenied: vi.fn(),
}));

import { cookies, headers } from "next/headers";
import { redirectToForbidden } from "@/lib/auth/forbidden-response";
import {
  parseSessionCookie,
  requireRole,
  requireSession,
  requireUserResourceAccess,
} from "./server";

function makeSession(overrides: Partial<SessionUser> = {}): SessionUser {
  return { name: "Test User", sub: "sub-1", roles: [], ...overrides };
}

function mockCookies(session: SessionUser | null) {
  vi.mocked(cookies).mockResolvedValue({
    get: vi.fn().mockReturnValue(
      session
        ? { name: "session_token", value: JSON.stringify(session) }
        : undefined,
    ),
  } as never);
}

function mockHeaders(pathname?: string) {
  vi.mocked(headers).mockResolvedValue({
    get: vi.fn().mockReturnValue(pathname ?? null),
  } as never);
}

describe("parseSessionCookie", () => {
  it("returns null for null input", () => {
    expect(parseSessionCookie(null)).toBeNull();
  });

  it("returns null for undefined input", () => {
    expect(parseSessionCookie(undefined)).toBeNull();
  });

  it("returns null for invalid JSON", () => {
    expect(parseSessionCookie("not-json")).toBeNull();
  });

  it("returns null when required fields are missing", () => {
    expect(parseSessionCookie(JSON.stringify({ name: "Alice" }))).toBeNull();
  });

  it("parses a valid session cookie", () => {
    const session = makeSession({ roles: ["user"] });
    expect(parseSessionCookie(JSON.stringify(session))).toEqual(session);
  });

  it("filters non-string entries from roles", () => {
    const raw = JSON.stringify({ name: "X", sub: "y", roles: ["admin", 42, null] });
    expect(parseSessionCookie(raw)?.roles).toEqual(["admin"]);
  });

  it("defaults to empty roles when roles field is absent", () => {
    const raw = JSON.stringify({ name: "X", sub: "y" });
    expect(parseSessionCookie(raw)?.roles).toEqual([]);
  });

  it("includes optional username and email when present", () => {
    const raw = JSON.stringify({
      name: "X",
      sub: "y",
      username: "alice",
      email: "a@b.com",
      roles: [],
    });
    const result = parseSessionCookie(raw);
    expect(result?.username).toBe("alice");
    expect(result?.email).toBe("a@b.com");
  });
});

describe("requireSession", () => {
  it("returns session when authenticated", async () => {
    const session = makeSession({ roles: ["user"] });
    mockCookies(session);
    await expect(requireSession()).resolves.toEqual(session);
  });

  it("redirects to login when not authenticated", async () => {
    mockCookies(null);
    await expect(requireSession()).rejects.toThrow("REDIRECT");
  });
});

describe("requireRole", () => {
  beforeEach(() => {
    mockHeaders("/dashboard/logs");
  });

  it("returns session when user has the required role", async () => {
    const session = makeSession({ roles: ["admin"] });
    mockCookies(session);
    await expect(requireRole("admin")).resolves.toEqual(session);
  });

  it("calls redirectToForbidden when user lacks the required role", async () => {
    const session = makeSession({ roles: ["user"] });
    mockCookies(session);
    await expect(requireRole("admin")).rejects.toThrow("FORBIDDEN");
    expect(redirectToForbidden).toHaveBeenCalledOnce();
  });

  it("redirects to login when not authenticated", async () => {
    mockCookies(null);
    await expect(requireRole("admin")).rejects.toThrow("REDIRECT");
  });
});

describe("requireUserResourceAccess", () => {
  beforeEach(() => {
    mockHeaders("/dashboard/profile");
  });

  it("allows user role", async () => {
    const session = makeSession({ roles: ["user"] });
    mockCookies(session);
    await expect(requireUserResourceAccess()).resolves.toEqual(session);
  });

  it("allows admin role", async () => {
    const session = makeSession({ roles: ["admin"] });
    mockCookies(session);
    await expect(requireUserResourceAccess()).resolves.toEqual(session);
  });

  it("calls redirectToForbidden when session has no qualifying role", async () => {
    const session = makeSession({ roles: [] });
    mockCookies(session);
    await expect(requireUserResourceAccess()).rejects.toThrow("FORBIDDEN");
    expect(redirectToForbidden).toHaveBeenCalledOnce();
  });
});
