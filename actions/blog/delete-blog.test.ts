import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/auth/server", () => ({
  requireSession: vi.fn(),
}));

vi.mock("@/lib/blog/repository", () => ({
  getBlogBySlug: vi.fn(),
  deleteBlogBySlug: vi.fn(),
}));

vi.mock("@/lib/blog/access", () => ({
  canDeleteBlog: vi.fn(),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
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

import { revalidatePath } from "next/cache";
import { requireSession } from "@/lib/auth/server";
import { deleteBlogBySlug, getBlogBySlug } from "@/lib/blog/repository";
import { canDeleteBlog } from "@/lib/blog/access";
import { deleteBlogAction } from "./delete-blog";
import type { SessionUser } from "@/lib/auth/types";
import type { BlogRecord } from "@/lib/blog/access";

function makeSession(overrides: Partial<SessionUser> = {}): SessionUser {
  return { name: "User", sub: "sub-1", roles: ["user"], ...overrides };
}

function makeBlog(overrides: Partial<BlogRecord> = {}): BlogRecord {
  return {
    id: "blog-1",
    slug: "my-post",
    title: "Title",
    summary: "Summary",
    content: "Content",
    visibility: "private",
    ownerKey: "alice",
    ownerName: "Alice",
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

describe("deleteBlogAction", () => {
  it("returns UNAUTHORIZED when session check throws", async () => {
    vi.mocked(requireSession).mockRejectedValue(new Error("no session"));
    const result = await deleteBlogAction("my-post");
    expect(result).toEqual({
      ok: false,
      error: "Unauthorized",
      code: "UNAUTHORIZED",
    });
  });

  it("returns NOT_FOUND when blog does not exist", async () => {
    vi.mocked(requireSession).mockResolvedValue(makeSession());
    vi.mocked(getBlogBySlug).mockResolvedValue(null);

    const result = await deleteBlogAction("missing-post");
    expect(result).toEqual({
      ok: false,
      error: "Blog not found",
      code: "NOT_FOUND",
    });
  });

  it("returns FORBIDDEN when user cannot delete the blog", async () => {
    vi.mocked(requireSession).mockResolvedValue(makeSession());
    vi.mocked(getBlogBySlug).mockResolvedValue(makeBlog());
    vi.mocked(canDeleteBlog).mockResolvedValue(false);

    const result = await deleteBlogAction("my-post");
    expect(result).toEqual({ ok: false, error: "Forbidden", code: "FORBIDDEN" });
  });

  it("deletes the blog and returns slug on success", async () => {
    vi.mocked(requireSession).mockResolvedValue(makeSession());
    vi.mocked(getBlogBySlug).mockResolvedValue(makeBlog());
    vi.mocked(canDeleteBlog).mockResolvedValue(true);
    vi.mocked(deleteBlogBySlug).mockResolvedValue(true);

    const result = await deleteBlogAction("my-post");
    expect(result).toEqual({ ok: true, data: { slug: "my-post" } });
  });

  it("revalidates /blog path on success", async () => {
    vi.mocked(requireSession).mockResolvedValue(makeSession());
    vi.mocked(getBlogBySlug).mockResolvedValue(makeBlog());
    vi.mocked(canDeleteBlog).mockResolvedValue(true);
    vi.mocked(deleteBlogBySlug).mockResolvedValue(true);

    await deleteBlogAction("my-post");
    expect(revalidatePath).toHaveBeenCalledWith("/blog");
  });

  it("returns NOT_FOUND when deleteBlogBySlug returns false", async () => {
    vi.mocked(requireSession).mockResolvedValue(makeSession());
    vi.mocked(getBlogBySlug).mockResolvedValue(makeBlog());
    vi.mocked(canDeleteBlog).mockResolvedValue(true);
    vi.mocked(deleteBlogBySlug).mockResolvedValue(false);

    const result = await deleteBlogAction("my-post");
    expect(result).toEqual({
      ok: false,
      error: "Blog not found",
      code: "NOT_FOUND",
    });
  });
});
