import { describe, expect, it, vi } from "vitest";

import type { SessionUser } from "@/lib/auth/types";
import type { BlogRecord } from "./access";

vi.mock("@/lib/openfga", () => ({
  isOpenFgaConfigured: vi.fn(),
}));

vi.mock("@/lib/authz/blog", () => ({
  canViewBlogFga: vi.fn(),
  canEditBlogFga: vi.fn(),
  canDeleteBlogFga: vi.fn(),
  canShareBlogFga: vi.fn(),
  revokeBlogAccess: vi.fn(),
}));

vi.mock("@/lib/authz/temporary", () => ({
  getTemporaryExpiry: vi.fn(),
  clearTemporaryAccess: vi.fn(),
}));

import { isOpenFgaConfigured } from "@/lib/openfga";
import {
  canDeleteBlogFga,
  canEditBlogFga,
  canShareBlogFga,
  canViewBlogFga,
  revokeBlogAccess,
} from "@/lib/authz/blog";
import { clearTemporaryAccess, getTemporaryExpiry } from "@/lib/authz/temporary";
import {
  canDeleteBlog,
  canManageBlog,
  canShareBlog,
  canViewBlog,
} from "./access";

function makeSession(overrides: Partial<SessionUser> = {}): SessionUser {
  return { name: "User", sub: "sub-1", roles: [], ...overrides };
}

function makeBlog(overrides: Partial<BlogRecord> = {}): BlogRecord {
  return {
    id: "blog-1",
    slug: "test-post",
    title: "Test",
    summary: "Summary",
    content: "Content",
    visibility: "private",
    ownerKey: "owner-user",
    ownerName: "Owner",
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

describe("canViewBlog", () => {
  it("allows public blogs regardless of session", async () => {
    const blog = makeBlog({ visibility: "public" });
    expect(await canViewBlog(blog, null)).toBe(true);
  });

  it("denies private blog when not authenticated", async () => {
    const blog = makeBlog({ visibility: "private" });
    expect(await canViewBlog(blog, null)).toBe(false);
  });

  it("allows admin to view any private blog", async () => {
    const blog = makeBlog({ visibility: "private" });
    const session = makeSession({ roles: ["admin"] });
    expect(await canViewBlog(blog, session)).toBe(true);
  });

  it("allows owner to view their own private blog", async () => {
    const blog = makeBlog({ visibility: "private", ownerKey: "alice" });
    const session = makeSession({ username: "alice" });
    expect(await canViewBlog(blog, session)).toBe(true);
  });

  it("denies non-owner when OpenFGA is not configured", async () => {
    vi.mocked(isOpenFgaConfigured).mockReturnValue(false);
    const blog = makeBlog({ visibility: "private", ownerKey: "owner" });
    const session = makeSession({ username: "other-user" });
    expect(await canViewBlog(blog, session)).toBe(false);
  });

  it("delegates to FGA for non-owner when OpenFGA is configured", async () => {
    vi.mocked(isOpenFgaConfigured).mockReturnValue(true);
    vi.mocked(canViewBlogFga).mockResolvedValue(true);
    const blog = makeBlog({ visibility: "private", ownerKey: "owner" });
    const session = makeSession({ username: "shared-user" });
    expect(await canViewBlog(blog, session)).toBe(true);
    expect(canViewBlogFga).toHaveBeenCalledWith("shared-user", "blog-1");
  });

  it("denies when FGA check returns false", async () => {
    vi.mocked(isOpenFgaConfigured).mockReturnValue(true);
    vi.mocked(canViewBlogFga).mockResolvedValue(false);
    const blog = makeBlog({ visibility: "private", ownerKey: "owner" });
    const session = makeSession({ username: "nobody" });
    expect(await canViewBlog(blog, session)).toBe(false);
  });
});

describe("canManageBlog", () => {
  it("allows admin regardless of ownership", async () => {
    const blog = makeBlog({ ownerKey: "someone-else" });
    const session = makeSession({ roles: ["admin"] });
    expect(await canManageBlog(blog, session)).toBe(true);
  });

  it("allows owner", async () => {
    const blog = makeBlog({ ownerKey: "alice" });
    const session = makeSession({ username: "alice" });
    expect(await canManageBlog(blog, session)).toBe(true);
  });

  it("denies non-owner when OpenFGA is not configured", async () => {
    vi.mocked(isOpenFgaConfigured).mockReturnValue(false);
    const blog = makeBlog({ ownerKey: "owner" });
    const session = makeSession({ username: "other" });
    expect(await canManageBlog(blog, session)).toBe(false);
  });

  it("delegates to FGA edit check for non-owner", async () => {
    vi.mocked(isOpenFgaConfigured).mockReturnValue(true);
    vi.mocked(canEditBlogFga).mockResolvedValue(true);
    const blog = makeBlog({ ownerKey: "owner" });
    const session = makeSession({ username: "editor" });
    expect(await canManageBlog(blog, session)).toBe(true);
    expect(canEditBlogFga).toHaveBeenCalledWith("editor", "blog-1");
  });
});

describe("canDeleteBlog", () => {
  it("allows admin", async () => {
    const blog = makeBlog({ ownerKey: "other" });
    const session = makeSession({ roles: ["admin"] });
    expect(await canDeleteBlog(blog, session)).toBe(true);
  });

  it("allows owner", async () => {
    const blog = makeBlog({ ownerKey: "alice" });
    const session = makeSession({ username: "alice" });
    expect(await canDeleteBlog(blog, session)).toBe(true);
  });

  it("denies non-owner when OpenFGA is not configured", async () => {
    vi.mocked(isOpenFgaConfigured).mockReturnValue(false);
    const blog = makeBlog({ ownerKey: "owner" });
    const session = makeSession({ username: "other" });
    expect(await canDeleteBlog(blog, session)).toBe(false);
  });

  it("delegates to FGA delete check for non-owner", async () => {
    vi.mocked(isOpenFgaConfigured).mockReturnValue(true);
    vi.mocked(canDeleteBlogFga).mockResolvedValue(false);
    const blog = makeBlog({ ownerKey: "owner" });
    const session = makeSession({ username: "viewer" });
    expect(await canDeleteBlog(blog, session)).toBe(false);
    expect(canDeleteBlogFga).toHaveBeenCalledWith("viewer", "blog-1");
  });
});

describe("canShareBlog", () => {
  it("allows admin", async () => {
    const blog = makeBlog({ ownerKey: "other" });
    const session = makeSession({ roles: ["admin"] });
    expect(await canShareBlog(blog, session)).toBe(true);
  });

  it("allows owner", async () => {
    const blog = makeBlog({ ownerKey: "alice" });
    const session = makeSession({ username: "alice" });
    expect(await canShareBlog(blog, session)).toBe(true);
  });

  it("denies non-owner when OpenFGA is not configured", async () => {
    vi.mocked(isOpenFgaConfigured).mockReturnValue(false);
    const blog = makeBlog({ ownerKey: "owner" });
    const session = makeSession({ username: "other" });
    expect(await canShareBlog(blog, session)).toBe(false);
  });

  it("delegates to FGA share check for non-owner", async () => {
    vi.mocked(isOpenFgaConfigured).mockReturnValue(true);
    vi.mocked(canShareBlogFga).mockResolvedValue(true);
    const blog = makeBlog({ ownerKey: "owner" });
    const session = makeSession({ username: "blog-admin" });
    expect(await canShareBlog(blog, session)).toBe(true);
    expect(canShareBlogFga).toHaveBeenCalledWith("blog-admin", "blog-1");
  });
});

describe("temporary access expiry", () => {
  it("denies and evicts when access has expired", async () => {
    vi.mocked(isOpenFgaConfigured).mockReturnValue(true);
    vi.mocked(getTemporaryExpiry).mockResolvedValue(new Date("2020-01-01"));
    vi.mocked(revokeBlogAccess).mockResolvedValue(undefined);
    vi.mocked(clearTemporaryAccess).mockResolvedValue(undefined);

    const blog = makeBlog({ visibility: "private", ownerKey: "owner" });
    const session = makeSession({ username: "shared-user" });

    expect(await canViewBlog(blog, session)).toBe(false);
    expect(revokeBlogAccess).toHaveBeenCalledWith("blog-1", "shared-user");
    expect(clearTemporaryAccess).toHaveBeenCalledWith("blog-1", "shared-user");
    expect(canViewBlogFga).not.toHaveBeenCalled();
  });

  it("allows when access has not yet expired", async () => {
    vi.mocked(isOpenFgaConfigured).mockReturnValue(true);
    vi.mocked(getTemporaryExpiry).mockResolvedValue(new Date("2099-01-01"));
    vi.mocked(canViewBlogFga).mockResolvedValue(true);

    const blog = makeBlog({ visibility: "private", ownerKey: "owner" });
    const session = makeSession({ username: "shared-user" });

    expect(await canViewBlog(blog, session)).toBe(true);
    expect(revokeBlogAccess).not.toHaveBeenCalled();
    expect(canViewBlogFga).toHaveBeenCalledWith("shared-user", "blog-1");
  });

  it("allows when no temporary record exists (permanent access)", async () => {
    vi.mocked(isOpenFgaConfigured).mockReturnValue(true);
    vi.mocked(getTemporaryExpiry).mockResolvedValue(null);
    vi.mocked(canViewBlogFga).mockResolvedValue(true);

    const blog = makeBlog({ visibility: "private", ownerKey: "owner" });
    const session = makeSession({ username: "shared-user" });

    expect(await canViewBlog(blog, session)).toBe(true);
    expect(revokeBlogAccess).not.toHaveBeenCalled();
  });
});
