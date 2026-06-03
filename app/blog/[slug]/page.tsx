import Link from "next/link";
import { notFound } from "next/navigation";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { BlogDeleteButton } from "@/components/blog-delete-button";
import { VisibilityBadge } from "@/components/blog/visibility-badge";
import { accessDeniedPanel } from "@/lib/auth/forbidden-response";
import { getSession } from "@/lib/auth/server";
import { canManageBlog, canViewBlog } from "@/lib/blog/access";
import { getBlogBySlug } from "@/lib/blog/repository";
import { formatDate } from "@/lib/format";

type BlogDetailPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: BlogDetailPageProps) {
  const { slug } = await params;
  const blog = await getBlogBySlug(slug);

  if (!blog) {
    return { title: "Blog not found" };
  }

  return {
    title: blog.title,
    description: blog.summary,
  };
}

export default async function BlogDetailPage({ params }: BlogDetailPageProps) {
  const { slug } = await params;
  const session = await getSession();
  const blog = await getBlogBySlug(slug);

  if (!blog) {
    notFound();
  }

  if (!canViewBlog(blog, session)) {
    return accessDeniedPanel({
      session,
      message: "You do not have permission to view this blog post.",
      returnTo: `/blog/${slug}`,
      context: {
        reason: "blog view denied",
        route: `/blog/${slug}`,
      },
    });
  }

  const canEdit = session ? canManageBlog(blog, session) : false;

  return (
    <div className="container max-w-3xl py-8">
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-2">
              <CardTitle className="text-3xl">{blog.title}</CardTitle>
              <p className="text-sm text-muted-foreground">
                By {blog.ownerName} · Updated {formatDate(blog.updatedAt)}
              </p>
            </div>
            {session ? (
              <VisibilityBadge blog={blog} session={session} />
            ) : (
              <span className="shrink-0 border px-2 py-1 text-xs uppercase tracking-wider text-muted-foreground">
                Public
              </span>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-sm text-muted-foreground border-l-2 border-primary pl-4">
            {blog.summary}
          </p>

          <div className="prose prose-invert max-w-none text-sm leading-7 text-muted-foreground whitespace-pre-wrap">
            {blog.content}
          </div>
        </CardContent>
        <CardFooter className="flex flex-wrap gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/blog">← Back to blogs</Link>
          </Button>
          {canEdit ? (
            <>
              <Button variant="ghost" asChild>
                <Link href={`/blog/${blog.slug}/edit`}>Edit</Link>
              </Button>
              <BlogDeleteButton slug={blog.slug} />
            </>
          ) : null}
        </CardFooter>
      </Card>
    </div>
  );
}

export async function generateStaticParams() {
  try {
    const { prisma } = await import("@/lib/prisma");
    const { BLOG_VISIBILITY } = await import("@/lib/auth/constants");
    const publicBlogs = (await prisma.blog.findMany({
      where: { visibility: BLOG_VISIBILITY.PUBLIC },
      select: { slug: true },
    })) as { slug: string }[];

    return publicBlogs.map((blog) => ({ slug: blog.slug }));
  } catch {
    return [];
  }
}
