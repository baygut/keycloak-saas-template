import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BLOG_VISIBILITY } from "@/lib/auth/constants";
import type { BlogRecord } from "@/lib/blog/access";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";

type AdminBlogsPanelProps = {
  blogs: BlogRecord[];
  fullPage?: boolean;
};

export function AdminBlogsPanel({ blogs, fullPage = false }: AdminBlogsPanelProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-2 overflow-y-auto",
        fullPage ? "max-h-[min(70vh,48rem)]" : "max-h-[320px]",
      )}
    >
      {blogs.length === 0 ? (
        <p className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
          No blogs in the database yet.
        </p>
      ) : (
        blogs.map((blog) => (
          <div
            key={blog.id}
            className="flex flex-col gap-3 rounded-md border border-border bg-muted/30 p-3 text-sm sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="min-w-0 flex-1 space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="truncate font-medium">{blog.title}</p>
                <Badge
                  variant={
                    blog.visibility === BLOG_VISIBILITY.PUBLIC
                      ? "secondary"
                      : "outline"
                  }
                >
                  {blog.visibility === BLOG_VISIBILITY.PUBLIC
                    ? "Public"
                    : "Private"}
                </Badge>
              </div>
              <p className="truncate text-xs text-muted-foreground">
                {blog.summary || "No summary"}
              </p>
              <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
                <span>Owner: {blog.ownerName}</span>
                <span className="font-mono text-[10px]">{blog.ownerKey}</span>
                <span>Updated {formatDate(blog.updatedAt)}</span>
              </div>
            </div>
            <div className="flex shrink-0 flex-wrap gap-2">
              <Button variant="outline" size="sm" asChild>
                <Link href={`/blog/${blog.slug}`}>View</Link>
              </Button>
              <Button variant="secondary" size="sm" asChild>
                <Link href={`/blog/${blog.slug}/edit`}>Edit</Link>
              </Button>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
