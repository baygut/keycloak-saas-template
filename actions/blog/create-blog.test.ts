import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/auth/server", () => ({
  requireAnyRole: vi.fn(),
}));

vi.mock("@/lib/blog/repository", () => ({
  createBlog: vi.fn(),
}));

vi.mock("@/lib/auth/access-log", () => ({
  logAccessDenied: vi.fn(),
}));

vi.mock("@/lib/auth/navigation-errors", () => ({
  rethrowNavigationErrors: vi.fn(),
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
import { requireAnyRole } from "@/lib/auth/server";
import { createBlog } from "@/lib/blog/repository";
import { createBlogAction } from "./create-blog";
import type { SessionUser } from "@/lib/auth/types";
import type { BlogRecord } from "@/lib/blog/access";

function makeSession(overrides: Partial<SessionUser> = {}): SessionUser {
  return { name: "User", sub: "sub-1", roles: ["user"], ...overrides };
}

function makeBlog(overrides: Partial<BlogRecord> = {}): BlogRecord {
  return {
    id: "blog-1",
    slug: "test-post",
    title: "Test",
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

const validInput = {
  title: "Hello World",
  summary: "A summary",
  content: "Some content",
};

describe("createBlogAction", () => {
  it("returns UNAUTHORIZED when session check throws", async () => {
    vi.mocked(requireAnyRole).mockRejectedValue(new Error("no session"));
    const result = await createBlogAction(validInput);
    expect(result).toEqual({
      ok: false,
      error: "Unauthorized",
      code: "UNAUTHORIZED",
    });
  });

  it("returns error when required fields are missing", async () => {
    vi.mocked(requireAnyRole).mockResolvedValue(makeSession());
    const result = await createBlogAction({ title: "", summary: "", content: "" });
    expect(result.ok).toBe(false);
    expect((result as { error: string }).error).toMatch(/required/i);
  });

  it("returns error when title is blank", async () => {
    vi.mocked(requireAnyRole).mockResolvedValue(makeSession());
    const result = await createBlogAction({
      title: "  ",
      summary: "s",
      content: "c",
    });
    expect(result.ok).toBe(false);
  });

  it("creates a private blog and returns slug on success", async () => {
    vi.mocked(requireAnyRole).mockResolvedValue(makeSession());
    vi.mocked(createBlog).mockResolvedValue(makeBlog({ slug: "hello-world" }));

    const result = await createBlogAction(validInput);
    expect(result).toEqual({ ok: true, data: { slug: "hello-world" } });
    expect(createBlog).toHaveBeenCalledWith(
      expect.any(Object),
      expect.objectContaining({ visibility: "private" }),
    );
  });

  it("creates a public blog when visibility is public", async () => {
    vi.mocked(requireAnyRole).mockResolvedValue(makeSession());
    vi.mocked(createBlog).mockResolvedValue(
      makeBlog({ slug: "public-post", visibility: "public" }),
    );

    const result = await createBlogAction({ ...validInput, visibility: "public" });
    expect(result.ok).toBe(true);
    expect(createBlog).toHaveBeenCalledWith(
      expect.any(Object),
      expect.objectContaining({ visibility: "public" }),
    );
  });

  it("revalidates blog paths on success", async () => {
    vi.mocked(requireAnyRole).mockResolvedValue(makeSession());
    vi.mocked(createBlog).mockResolvedValue(makeBlog({ slug: "new-post" }));

    await createBlogAction(validInput);
    expect(revalidatePath).toHaveBeenCalledWith("/blog");
    expect(revalidatePath).toHaveBeenCalledWith("/blog/new-post");
  });
});
