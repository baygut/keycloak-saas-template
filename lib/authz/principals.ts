/** OpenFGA user object id from an app principal (Keycloak username, email, or sub). */
export function toFgaUser(principal: string): string {
  return `user:${principal}`;
}

/** OpenFGA blog object id from the Prisma blog primary key. */
export function toFgaBlog(blogId: string): string {
  return `blog:${blogId}`;
}

export function parseFgaUser(user: string): string | null {
  if (!user.startsWith("user:")) {
    return null;
  }
  return user.slice("user:".length);
}

export const BLOG_SHARE_RELATIONS = ["viewer", "editor", "admin"] as const;

export type BlogShareRelation = (typeof BLOG_SHARE_RELATIONS)[number];

export function isBlogShareRelation(
  relation: string,
): relation is BlogShareRelation {
  return (BLOG_SHARE_RELATIONS as readonly string[]).includes(relation);
}
