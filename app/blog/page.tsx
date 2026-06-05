import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getSession } from "@/lib/auth/server";
import { listAccessibleBlogs } from "@/lib/blog/repository";
import { formatDate } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function PublicBlogListPage() {
  const session = await getSession();
  const blogs = await listAccessibleBlogs(session);

  return (
    <div className="container py-8 space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Blogs</CardTitle>
          <CardDescription>
            {session
              ? "Public and members-only posts."
              : "Public posts. Sign in to see members-only content."}
          </CardDescription>
        </CardHeader>
      </Card>

      {blogs.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            No blog posts available yet.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          {blogs.map((blog) => (
            <Card key={blog.id}>
              <CardHeader>
                <div className="space-y-2">
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">
                    {blog.ownerName}
                  </p>
                  <CardTitle className="text-xl">{blog.title}</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">{blog.summary}</p>
                <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                  <span>Updated {formatDate(blog.updatedAt)}</span>
                  <Button
                    variant="link"
                    size="sm"
                    className="h-auto p-0"
                    asChild
                  >
                    <Link href={`/blog/${blog.slug}`}>Read more</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
