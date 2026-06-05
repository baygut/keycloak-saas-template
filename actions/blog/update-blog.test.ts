import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/auth/server", () => ({
  requireSession: vi.fn(),
}));

vi.mock("@/lib/blog/repository", () => ({
  getBlogBySlug: vi.fn(),
  updateBlog: vi.fn(),
}));

vi.mock("@/lib/blog/access", () => ({
  canManageBlog: vi.fn(),
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
import { getBlogBySlug, updateBlog } from "@/lib/blog/repository";
import { canManageBlog } from "@/lib/blog/access";
import { updateBlogAction } from "./update-blog";
import type { SessionUser } from "@/lib/auth/types";
import type { BlogRecord } from "@/lib/blog/access";

function makeSession(overrides: Partial<SessionUser> = {}): SessionUser {
  return { name: "User", sub: "sub-1", roles: ["user"], ...overrides };
}

function makeBlog(overrides: Partial<BlogRecord> = {}): BlogRecord {
  return {
    id: "blog-1",
    slug: "existing-post",
    title: "Old Title",
    summary: "Old Summary",
    content: "Old Content",
    visibility: "private",
    ownerKey: "alice",
    ownerName: "Alice",
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

const validInput = {
  slug: "existing-post",
  title: "New Title",
  summary: "New Summary",
  content: "New Content",
};

describe("updateBlogAction", () => {
  it("returns UNAUTHORIZED when session check throws", async () => {
    vi.mocked(requireSession).mockRejectedValue(new Error("no session"));
    const result = await updateBlogAction(validInput);
    expect(result).toEqual({
      ok: false,
      error: "Unauthorized",
      code: "UNAUTHORIZED",
    });
  });

  it("returns NOT_FOUND when blog does not exist", async () => {
    vi.mocked(requireSession).mockResolvedValue(makeSession());
    vi.mocked(getBlogBySlug).mockResolvedValue(null);

    const result = await updateBlogAction(validInput);
    expect(result).toEqual({
      ok: false,
      error: "Blog not found",
      code: "NOT_FOUND",
    });
  });

  it("returns FORBIDDEN when user cannot manage the blog", async () => {
    vi.mocked(requireSession).mockResolvedValue(makeSession());
    vi.mocked(getBlogBySlug).mockResolvedValue(makeBlog());
    vi.mocked(canManageBlog).mockResolvedValue(false);

    const result = await updateBlogAction(validInput);
    expect(result).toEqual({ ok: false, error: "Forbidden", code: "FORBIDDEN" });
  });

  it("returns error when required fields are blank", async () => {
    vi.mocked(requireSession).mockResolvedValue(makeSession());
    vi.mocked(getBlogBySlug).mockResolvedValue(makeBlog());
    vi.mocked(canManageBlog).mockResolvedValue(true);

    const result = await updateBlogAction({
      ...validInput,
      title: "",
      summary: "",
      content: "",
    });
    expect(result.ok).toBe(false);
    expect((result as { error: string }).error).toMatch(/required/i);
  });

  it("updates the blog and returns new slug on success", async () => {
    const session = makeSession();
    vi.mocked(requireSession).mockResolvedValue(session);
    vi.mocked(getBlogBySlug).mockResolvedValue(makeBlog());
    vi.mocked(canManageBlog).mockResolvedValue(true);
    vi.mocked(updateBlog).mockResolvedValue(
      makeBlog({ slug: "existing-post", title: "New Title" }),
    );

    const result = await updateBlogAction(validInput);
    expect(result).toEqual({ ok: true, data: { slug: "existing-post" } });
  });

  it("revalidates blog paths on success", async () => {
    vi.mocked(requireSession).mockResolvedValue(makeSession());
    vi.mocked(getBlogBySlug).mockResolvedValue(makeBlog());
    vi.mocked(canManageBlog).mockResolvedValue(true);
    vi.mocked(updateBlog).mockResolvedValue(makeBlog({ slug: "existing-post" }));

    await updateBlogAction(validInput);
    expect(revalidatePath).toHaveBeenCalledWith("/blog");
    expect(revalidatePath).toHaveBeenCalledWith("/blog/existing-post");
  });

  it("returns NOT_FOUND when updateBlog returns null", async () => {
    vi.mocked(requireSession).mockResolvedValue(makeSession());
    vi.mocked(getBlogBySlug).mockResolvedValue(makeBlog());
    vi.mocked(canManageBlog).mockResolvedValue(true);
    vi.mocked(updateBlog).mockResolvedValue(null);

    const result = await updateBlogAction(validInput);
    expect(result).toEqual({
      ok: false,
      error: "Blog not found",
      code: "NOT_FOUND",
    });
  });
});
