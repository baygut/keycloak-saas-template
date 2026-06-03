"use server";

import { revalidatePath } from "next/cache";

import type { BlogVisibility } from "@/lib/auth/constants";
import { BLOG_VISIBILITY } from "@/lib/auth/constants";
import { requireSession } from "@/lib/auth/server";
import type { ActionResult } from "@/lib/auth/types";
import { canManageBlog } from "@/lib/blog/access";
import { getBlogBySlug, updateBlog } from "@/lib/blog/repository";
import logger from "@/lib/logger";

const log = logger.child("update-blog");

export type UpdateBlogInput = {
  slug: string;
  title: string;
  summary: string;
  content: string;
  visibility?: BlogVisibility;
};

export async function updateBlogAction(
  input: UpdateBlogInput,
): Promise<ActionResult<{ slug: string }>> {
  try {
    const session = await requireSession();
    const existing = await getBlogBySlug(input.slug);

    if (!existing) {
      return { ok: false, error: "Blog not found", code: "NOT_FOUND" };
    }

    if (!(await canManageBlog(existing, session))) {
      return { ok: false, error: "Forbidden", code: "FORBIDDEN" };
    }

    const title = input.title?.trim();
    const summary = input.summary?.trim();
    const content = input.content?.trim();

    if (!title || !summary || !content) {
      return {
        ok: false,
        error: "Title, summary, and content are required",
      };
    }

    const visibility =
      input.visibility === BLOG_VISIBILITY.PUBLIC
        ? BLOG_VISIBILITY.PUBLIC
        : BLOG_VISIBILITY.PRIVATE;

    const updated = await updateBlog(session, input.slug, {
      title,
      summary,
      content,
      visibility,
    });

    if (!updated) {
      return { ok: false, error: "Blog not found", code: "NOT_FOUND" };
    }

    log.info("blog updated", { slug: updated.slug });
    revalidatePath("/blog");
    revalidatePath(`/blog/${updated.slug}`);

    return { ok: true, data: { slug: updated.slug } };
  } catch {
    return { ok: false, error: "Unauthorized", code: "UNAUTHORIZED" };
  }
}
