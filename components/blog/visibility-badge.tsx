import { BLOG_VISIBILITY } from "@/lib/auth/constants";
import { isAdmin } from "@/lib/auth/permissions";
import { getSessionPrincipal } from "@/lib/auth/permissions";
import type { SessionUser } from "@/lib/auth/types";
import type { BlogRecord } from "@/lib/blog/access";

type VisibilityBadgeProps = {
  blog: BlogRecord;
  session: SessionUser;
};

export function VisibilityBadge({ blog, session }: VisibilityBadgeProps) {
  const principal = getSessionPrincipal(session);
  const tags: string[] = [];

  const visibilityLabel =
    blog.visibility === BLOG_VISIBILITY.PUBLIC
      ? "Public"
      : blog.visibility === BLOG_VISIBILITY.USERS_ONLY
        ? "Users only"
        : "Private";
  tags.push(visibilityLabel);

  if (blog.ownerKey === principal) {
    tags.push("Own");
  } else if (isAdmin(session)) {
    tags.push("Admin view");
  }

  return (
    <div className="flex flex-wrap gap-1">
      {tags.map((tag) => (
        <span
          key={tag}
          className="shrink-0 border border-slate-700 px-2 py-1 text-[10px] uppercase tracking-widest text-slate-400"
        >
          {tag}
        </span>
      ))}
    </div>
  );
}
