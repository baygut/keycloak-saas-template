import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { VisibilityBadge } from "@/components/blog/visibility-badge";
import { isAdmin, getSessionPrincipal } from "@/lib/auth/permissions";
import { NewBlogButton } from "@/components/blog/new-blog-button";
import { requireUserResourceAccess } from "@/lib/auth/server";
import { canManageBlog } from "@/lib/blog/access";
import { listBlogsForViewer } from "@/lib/blog/repository";
import { formatDate } from "@/lib/format";

export default async function BlogIndexPage() {
  const session = await requireUserResourceAccess();
  const blogs = await listBlogsForViewer(session);
  const principal = getSessionPrincipal(session);

  const blogsWithEdit = await Promise.all(
    blogs.map(async (blog) => ({
      blog,
      canEdit: await canManageBlog(blog, session),
    })),
  );

  return (
    <div className="container py-8 space-y-8">
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="space-y-2">
              <CardTitle>Your blogs</CardTitle>
              <CardDescription>
                {isAdmin(session)
                  ? "Admin users can inspect and manage every blog in the database."
                  : `Only blogs owned by ${principal} are shown here.`}
              </CardDescription>
            </div>
            <NewBlogButton />
          </div>
        </CardHeader>
      </Card>

      {blogs.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            No blogs are available for this account yet.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          {blogsWithEdit.map(({ blog, canEdit }) => (
              <Card key={blog.id}>
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-2">
                      <p className="text-xs uppercase tracking-wider text-muted-foreground">
                        {blog.ownerName}
                      </p>
                      <CardTitle className="text-xl">{blog.title}</CardTitle>
                    </div>
                    <VisibilityBadge blog={blog} session={session} />
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    {blog.summary}
                  </p>

                  <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                    <span>Updated {formatDate(blog.updatedAt)}</span>
                    <Button variant="link" size="sm" className="h-auto p-0" asChild>
                      <Link href={`/blog/${blog.slug}`}>Open</Link>
                    </Button>
                    {canEdit ? (
                      <Button variant="link" size="sm" className="h-auto p-0" asChild>
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
