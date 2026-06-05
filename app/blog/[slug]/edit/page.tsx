import Link from "next/link";
import dynamic from "next/dynamic";

import { BlogForm } from "@/components/blog-form";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { BLOG_VISIBILITY, type BlogVisibility } from "@/lib/auth/constants";
import { notFound } from "next/navigation";

import { accessDeniedPanel } from "@/lib/auth/forbidden-response";
import { requireUserResourceAccess } from "@/lib/auth/server";
import { canManageBlog, canShareBlog } from "@/lib/blog/access";
import { getBlogBySlug } from "@/lib/blog/repository";

const BlogSharePanel = dynamic(
  () =>
    import("@/components/blog/blog-share-panel").then(
      (mod) => mod.BlogSharePanel,
    ),
  { loading: () => <Skeleton className="h-48 w-full rounded-xl" /> },
);

type EditBlogPageProps = {
  params: Promise<{ slug: string }>;
};

export default async function EditBlogPage({ params }: EditBlogPageProps) {
  const session = await requireUserResourceAccess();
  const { slug } = await params;
  const blog = await getBlogBySlug(slug);

  if (!blog) {
    notFound();
  }

  if (!(await canManageBlog(blog, session))) {
    return accessDeniedPanel({
      session,
      message: "You do not have permission to edit this blog post.",
      returnTo: `/blog/${slug}/edit`,
      context: {
        reason: "blog edit denied",
        route: `/blog/${slug}/edit`,
      },
    });
  }

  const visibility: BlogVisibility =
    blog.visibility === BLOG_VISIBILITY.PUBLIC
      ? BLOG_VISIBILITY.PUBLIC
      : blog.visibility === BLOG_VISIBILITY.USERS_ONLY
        ? BLOG_VISIBILITY.USERS_ONLY
        : BLOG_VISIBILITY.PRIVATE;

  const canManageSharing = await canShareBlog(blog, session);

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6">
      <Button variant="ghost" size="sm" className="-ml-2 w-fit" asChild>
        <Link href={`/blog/${blog.slug}`}>← Back to post</Link>
      </Button>

      <Card>
        <CardHeader>
          <CardTitle>Edit blog</CardTitle>
          <CardDescription>
            Update the title, summary, content, and visibility for this post.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <BlogForm
            mode="edit"
            slug={blog.slug}
            actionLabel="Save changes"
            initialValues={{
              title: blog.title,
              summary: blog.summary,
              content: blog.content,
              visibility,
            }}
          />
        </CardContent>
      </Card>

      {canManageSharing ? (
        <BlogSharePanel slug={blog.slug} ownerKey={blog.ownerKey} />
      ) : null}
    </div>
  );
}
