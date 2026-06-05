import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { VisibilityBadge } from "@/components/blog/visibility-badge";
import { NewBlogButton } from "@/components/blog/new-blog-button";
import { getSessionPrincipal } from "@/lib/auth/permissions";
import { requireUserResourceAccess } from "@/lib/auth/server";
import { canManageBlog } from "@/lib/blog/access";
import { getBlogViewCounts } from "@/lib/analytics/events";
import { listBlogsForViewer } from "@/lib/blog/repository";
import { formatDate } from "@/lib/format";

export default async function MyBlogsPage() {
  const session = await requireUserResourceAccess();
  const principal = getSessionPrincipal(session);

  const allBlogs = await listBlogsForViewer(session);
  const ownBlogs = allBlogs.filter((b) => b.ownerKey === principal);

  const viewCounts = await getBlogViewCounts(ownBlogs.map((b) => b.id));

  const blogsWithEdit = await Promise.all(
    ownBlogs.map(async (blog) => ({
      blog,
      canEdit: await canManageBlog(blog, session),
    })),
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">My Blogs</h1>
          <p className="text-sm text-muted-foreground">
            Your blog posts and their performance.
          </p>
        </div>
        <NewBlogButton />
      </div>

      {blogsWithEdit.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            You haven&apos;t published any blogs yet.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          {blogsWithEdit.map(({ blog, canEdit }) => (
            <Card key={blog.id}>
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-2">
                    <CardTitle className="text-xl">{blog.title}</CardTitle>
                    <CardDescription>{blog.summary}</CardDescription>
                  </div>
                  <VisibilityBadge blog={blog} session={session} />
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                  <span>Updated {formatDate(blog.updatedAt)}</span>
                  {viewCounts.has(blog.id) ? (
                    <span>{viewCounts.get(blog.id)} views</span>
                  ) : (
                    <span>0 views</span>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/blog/${blog.slug}`}>View</Link>
                  </Button>
                  {canEdit ? (
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/blog/${blog.slug}/edit`}>Edit</Link>
                    </Button>
                  ) : null}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
