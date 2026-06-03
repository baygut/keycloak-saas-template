import { BLOG_VISIBILITY } from "@/lib/auth/constants";
import { getSessionPrincipal, isAdmin } from "@/lib/auth/permissions";
import type { SessionUser } from "@/lib/auth/types";

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

export function canViewBlog(
  blog: BlogRecord,
  session: SessionUser | null,
): boolean {
  if (blog.visibility === BLOG_VISIBILITY.PUBLIC) {
    return true;
  }

  if (!session) {
    return false;
  }

  if (isAdmin(session)) {
    return true;
  }

  return blog.ownerKey === getSessionPrincipal(session);
}

export function canManageBlog(
  blog: BlogRecord,
  session: SessionUser,
): boolean {
  return isAdmin(session) || blog.ownerKey === getSessionPrincipal(session);
}
