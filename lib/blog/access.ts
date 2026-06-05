import { BLOG_VISIBILITY } from "@/lib/auth/constants";
import { getSessionPrincipal, isAdmin } from "@/lib/auth/permissions";
import type { SessionUser } from "@/lib/auth/types";
import {
  canDeleteBlogFga,
  canEditBlogFga,
  canShareBlogFga,
  canViewBlogFga,
} from "@/lib/authz/blog";
import { isOpenFgaConfigured } from "@/lib/openfga";

export type BlogRecord = {
  id: string;
  slug: string;
  title: string;
  summary: string;
  content: string;
  visibility: string;
  ownerKey: string;
  ownerName: string;
  createdAt: Date;
  updatedAt: Date;
};

export async function canViewBlog(
  blog: BlogRecord,
  session: SessionUser | null,
): Promise<boolean> {
  if (blog.visibility === BLOG_VISIBILITY.PUBLIC) {
    return true;
  }

  if (!session) {
    return false;
  }

  if (blog.visibility === BLOG_VISIBILITY.USERS_ONLY) {
    return true;
  }

  if (isAdmin(session)) {
    return true;
  }

  const principal = getSessionPrincipal(session);

  if (blog.ownerKey === principal) {
    return true;
  }

  if (!isOpenFgaConfigured()) {
    return false;
  }

  return canViewBlogFga(principal, blog.id);
}

export async function canManageBlog(
  blog: BlogRecord,
  session: SessionUser,
): Promise<boolean> {
  if (isAdmin(session)) {
    return true;
  }

  const principal = getSessionPrincipal(session);

  if (blog.ownerKey === principal) {
    return true;
  }

  if (!isOpenFgaConfigured()) {
    return false;
  }

  return canEditBlogFga(principal, blog.id);
}

export async function canDeleteBlog(
  blog: BlogRecord,
  session: SessionUser,
): Promise<boolean> {
  if (isAdmin(session)) {
    return true;
  }

  const principal = getSessionPrincipal(session);

  if (blog.ownerKey === principal) {
    return true;
  }

  if (!isOpenFgaConfigured()) {
    return false;
  }

  return canDeleteBlogFga(principal, blog.id);
}

export async function canShareBlog(
  blog: BlogRecord,
  session: SessionUser,
): Promise<boolean> {
  if (isAdmin(session)) {
    return true;
  }

  const principal = getSessionPrincipal(session);

  if (blog.ownerKey === principal) {
    return true;
  }

  if (!isOpenFgaConfigured()) {
    return false;
  }

  return canShareBlogFga(principal, blog.id);
}
