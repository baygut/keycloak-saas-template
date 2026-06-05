import { BLOG_VISIBILITY } from "@/lib/auth/constants";
import {
  canAccessUserResource,
  getSessionPrincipal,
  isAdmin,
} from "@/lib/auth/permissions";
import type { SessionUser } from "@/lib/auth/types";
import {
  canDeleteBlogFga,
  canEditBlogFga,
  canShareBlogFga,
  canViewBlogFga,
  revokeBlogAccess,
} from "@/lib/authz/blog";
import { clearTemporaryAccess, getTemporaryExpiry } from "@/lib/authz/temporary";
import { isOpenFgaConfigured } from "@/lib/openfga";

async function evictIfExpired(blogId: string, principal: string): Promise<boolean> {
  const expiry = await getTemporaryExpiry(blogId, principal);
  if (!expiry || expiry > new Date()) return false;
  await Promise.all([
    revokeBlogAccess(blogId, principal),
    clearTemporaryAccess(blogId, principal),
  ]);
  return true;
}

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

  if (await evictIfExpired(blog.id, principal)) {
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

  if (await evictIfExpired(blog.id, principal)) {
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

  if (await evictIfExpired(blog.id, principal)) {
    return false;
  }

  return canDeleteBlogFga(principal, blog.id);
}

export function canViewBlogAnalytics(
  blog: BlogRecord,
  session: SessionUser,
): boolean {
  return (
    blog.ownerKey === getSessionPrincipal(session) &&
    canAccessUserResource(session)
  );
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

  if (await evictIfExpired(blog.id, principal)) {
    return false;
  }

  return canShareBlogFga(principal, blog.id);
}
