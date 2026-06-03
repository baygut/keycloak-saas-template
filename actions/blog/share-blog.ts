"use server";

import { revalidatePath } from "next/cache";

import { requireSession } from "@/lib/auth/server";
import { getSessionPrincipal } from "@/lib/auth/permissions";
import type { ActionResult } from "@/lib/auth/types";
import {
  grantBlogAccess,
  listBlogCollaborators,
  revokeBlogAccess,
} from "@/lib/authz/blog";
import type { BlogShareRelation } from "@/lib/authz/principals";
import { isBlogShareRelation } from "@/lib/authz/principals";
import { canShareBlog } from "@/lib/blog/access";
import { getBlogBySlug } from "@/lib/blog/repository";
import { isOpenFgaConfigured } from "@/lib/openfga";
import logger from "@/lib/logger";

export type BlogCollaboratorDto = {
  principal: string;
  relation: BlogShareRelation;
};

export async function listBlogSharesAction(
  slug: string,
): Promise<ActionResult<{ collaborators: BlogCollaboratorDto[] }>> {
  try {
    const session = await requireSession();
    const blog = await getBlogBySlug(slug);

    if (!blog) {
      return { ok: false, error: "Blog not found", code: "NOT_FOUND" };
    }

    if (!(await canShareBlog(blog, session))) {
      return { ok: false, error: "Forbidden", code: "FORBIDDEN" };
    }

    if (!isOpenFgaConfigured()) {
      return {
        ok: false,
        error: "OpenFGA is not configured on the server",
        code: "FORBIDDEN",
      };
    }

    const collaborators = await listBlogCollaborators(blog.id);
    return { ok: true, data: { collaborators } };
  } catch {
    return { ok: false, error: "Unauthorized", code: "UNAUTHORIZED" };
  }
}

export async function grantBlogAccessAction(input: {
  slug: string;
  principal: string;
  relation: string;
}): Promise<ActionResult<{ principal: string; relation: BlogShareRelation }>> {
  try {
    const session = await requireSession();
    const blog = await getBlogBySlug(input.slug);

    if (!blog) {
      return { ok: false, error: "Blog not found", code: "NOT_FOUND" };
    }

    if (!(await canShareBlog(blog, session))) {
      return { ok: false, error: "Forbidden", code: "FORBIDDEN" };
    }

    if (!isOpenFgaConfigured()) {
      return {
        ok: false,
        error: "OpenFGA is not configured on the server",
        code: "FORBIDDEN",
      };
    }

    const targetPrincipal = input.principal.trim();

    if (!targetPrincipal) {
      return { ok: false, error: "Username is required" };
    }

    if (!isBlogShareRelation(input.relation)) {
      return { ok: false, error: "Invalid access level" };
    }

    const actorPrincipal = getSessionPrincipal(session);

    if (targetPrincipal === actorPrincipal) {
      return { ok: false, error: "You cannot share a post with yourself" };
    }

    if (targetPrincipal === blog.ownerKey) {
      return { ok: false, error: "The owner already has full access" };
    }

    await grantBlogAccess(blog.id, targetPrincipal, input.relation);

    revalidatePath(`/blog/${blog.slug}`);
    revalidatePath(`/blog/${blog.slug}/edit`);
    revalidatePath("/blog");

    return {
      ok: true,
      data: { principal: targetPrincipal, relation: input.relation },
    };
  } catch (error) {
    logger.error("Error granting blog access", { error });
    return { ok: false, error: "Unauthorized", code: "UNAUTHORIZED" };
  }
}

export async function revokeBlogAccessAction(input: {
  slug: string;
  principal: string;
}): Promise<ActionResult<{ principal: string }>> {
  try {
    const session = await requireSession();
    const blog = await getBlogBySlug(input.slug);

    if (!blog) {
      return { ok: false, error: "Blog not found", code: "NOT_FOUND" };
    }

    if (!(await canShareBlog(blog, session))) {
      return { ok: false, error: "Forbidden", code: "FORBIDDEN" };
    }

    if (!isOpenFgaConfigured()) {
      return {
        ok: false,
        error: "OpenFGA is not configured on the server",
        code: "FORBIDDEN",
      };
    }

    const targetPrincipal = input.principal.trim();

    if (!targetPrincipal) {
      return { ok: false, error: "Username is required" };
    }

    await revokeBlogAccess(blog.id, targetPrincipal);

    revalidatePath(`/blog/${blog.slug}`);
    revalidatePath(`/blog/${blog.slug}/edit`);
    revalidatePath("/blog");

    return { ok: true, data: { principal: targetPrincipal } };
  } catch (error) {
    logger.error("Error revoking blog access", { error });
    return { ok: false, error: "Unauthorized", code: "UNAUTHORIZED" };
  }
}
