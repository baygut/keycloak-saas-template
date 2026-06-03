"use server";

import { revalidatePath } from "next/cache";

import { requireSession } from "@/lib/auth/server";
import type { ActionResult } from "@/lib/auth/types";
import { canManageBlog } from "@/lib/blog/access";
import { deleteBlogBySlug, getBlogBySlug } from "@/lib/blog/repository";
import logger from "@/lib/logger";

const log = logger.child("delete-blog");

export async function deleteBlogAction(
  slug: string,
): Promise<ActionResult<{ slug: string }>> {
  try {
    const session = await requireSession();
    const existing = await getBlogBySlug(slug);

    if (!existing) {
      return { ok: false, error: "Blog not found", code: "NOT_FOUND" };
    }

    if (!canManageBlog(existing, session)) {
      return { ok: false, error: "Forbidden", code: "FORBIDDEN" };
    }

    const removed = await deleteBlogBySlug(slug);

    if (!removed) {
      return { ok: false, error: "Blog not found", code: "NOT_FOUND" };
    }

    log.info("blog deleted", { slug });
    revalidatePath("/blog");

    return { ok: true, data: { slug } };
  } catch {
    return { ok: false, error: "Unauthorized", code: "UNAUTHORIZED" };
  }
}
