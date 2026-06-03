"use server";

import { revalidatePath } from "next/cache";

import type { BlogVisibility } from "@/lib/auth/constants";
import { BLOG_VISIBILITY, ROLE_GROUPS } from "@/lib/auth/constants";
import { requireAnyRole } from "@/lib/auth/server";
import type { ActionResult } from "@/lib/auth/types";
import type { BlogRecord } from "@/lib/blog/access";
import { createBlog } from "@/lib/blog/repository";
import { logAccessDenied } from "@/lib/auth/access-log";
import { rethrowNavigationErrors } from "@/lib/auth/navigation-errors";
import { PROTECTED_RESOURCES } from "@/lib/auth/resources";
import logger from "@/lib/logger";

const log = logger.child("create-blog");

export type CreateBlogInput = {
  title: string;
  summary: string;
  content: string;
  visibility?: BlogVisibility;
};

export async function createBlogAction(
  input: CreateBlogInput,
): Promise<ActionResult<{ slug: string }>> {
  try {
    const session = await requireAnyRole(ROLE_GROUPS.USER_ACCESS);
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

    const blog: BlogRecord = await createBlog(session, {
      title,
      summary,
      content,
      visibility,
    });

    log.info("blog created", { slug: blog.slug, owner: blog.ownerKey });
    revalidatePath("/blog");
    revalidatePath(`/blog/${blog.slug}`);

    return { ok: true, data: { slug: blog.slug } };
  } catch (error) {
    rethrowNavigationErrors(error);
    logAccessDenied(null, {
      reason: "createBlogAction failed",
      resource: PROTECTED_RESOURCES.USER,
      requiredRoles: [...ROLE_GROUPS.USER_ACCESS],
    });
    return { ok: false, error: "Unauthorized", code: "UNAUTHORIZED" };
  }
}
