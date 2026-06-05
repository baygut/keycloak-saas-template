import { describe, it, expect } from "vitest";

import {
  canAccessUserResource,
  getSessionPrincipal,
  hasAnyRole,
  hasRole,
  isAdmin,
} from "./permissions";
import type { SessionUser } from "@/lib/auth/types";

function makeSession(overrides: Partial<SessionUser> = {}): SessionUser {
  return { name: "Test User", sub: "sub-1", roles: [], ...overrides };
}

describe("hasRole", () => {
  it("returns true when session has the role", () => {
    expect(hasRole(makeSession({ roles: ["admin"] }), "admin")).toBe(true);
  });

  it("returns false when session lacks the role", () => {
    expect(hasRole(makeSession({ roles: ["user"] }), "admin")).toBe(false);
  });

  it("returns false with empty roles", () => {
    expect(hasRole(makeSession(), "admin")).toBe(false);
  });
});

describe("hasAnyRole", () => {
  it("returns true when at least one role matches", () => {
    expect(
      hasAnyRole(makeSession({ roles: ["user"] }), ["user", "admin"]),
    ).toBe(true);
  });

  it("returns true when admin is in the list", () => {
    expect(
      hasAnyRole(makeSession({ roles: ["admin"] }), ["user", "admin"]),
    ).toBe(true);
  });

  it("returns false when no roles match", () => {
    expect(hasAnyRole(makeSession(), ["user", "admin"])).toBe(false);
  });

  it("returns false with an unrelated role", () => {
    expect(
      hasAnyRole(makeSession({ roles: ["guest"] }), ["user", "admin"]),
    ).toBe(false);
  });
});

describe("isAdmin", () => {
  it("returns true for admin role", () => {
    expect(isAdmin(makeSession({ roles: ["admin"] }))).toBe(true);
  });

  it("returns false for user role", () => {
    expect(isAdmin(makeSession({ roles: ["user"] }))).toBe(false);
  });

  it("returns false with no roles", () => {
    expect(isAdmin(makeSession())).toBe(false);
  });
});

describe("canAccessUserResource", () => {
  it("allows user role", () => {
    expect(canAccessUserResource(makeSession({ roles: ["user"] }))).toBe(true);
  });

  it("allows admin role", () => {
    expect(canAccessUserResource(makeSession({ roles: ["admin"] }))).toBe(true);
  });

  it("denies unknown role", () => {
    expect(canAccessUserResource(makeSession({ roles: ["guest"] }))).toBe(
      false,
    );
  });

  it("denies with no roles", () => {
    expect(canAccessUserResource(makeSession())).toBe(false);
  });
});

describe("getSessionPrincipal", () => {
  it("prefers username over email and sub", () => {
    expect(
      getSessionPrincipal(
        makeSession({ username: "alice", email: "a@b.com", sub: "sub-1" }),
      ),
    ).toBe("alice");
  });

  it("falls back to email when username is absent", () => {
    expect(
      getSessionPrincipal(makeSession({ email: "a@b.com", sub: "sub-1" })),
    ).toBe("a@b.com");
  });

  it("falls back to sub when neither username nor email is set", () => {
    expect(getSessionPrincipal(makeSession({ sub: "sub-abc" }))).toBe(
      "sub-abc",
    );
  });
});
