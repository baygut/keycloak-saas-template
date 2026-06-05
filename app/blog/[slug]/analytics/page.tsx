import { Suspense } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { notFound } from "next/navigation";

import { accessDeniedPanel } from "@/lib/auth/forbidden-response";
import { getSessionPrincipal } from "@/lib/auth/permissions";
import { requireUserResourceAccess } from "@/lib/auth/server";
import { canViewBlogAnalytics } from "@/lib/blog/access";
import { getBlogBySlug } from "@/lib/blog/repository";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

function BlogAnalyticsSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardContent className="pt-6 flex flex-col gap-2">
          <Skeleton className="h-10 w-16" />
          <Skeleton className="h-4 w-48" />
        </CardContent>
      </Card>
      <div className="grid gap-6 lg:grid-cols-2">
        {[0, 1].map((i) => (
          <Card key={i}>
            <CardHeader className="flex flex-col gap-2">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              {Array.from({ length: 5 }).map((_, j) => (
                <div key={j} className="flex items-center justify-between py-1">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-8" />
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

const BlogAnalyticsSection = dynamic(
  () =>
    import("@/components/blog/blog-analytics-section").then(
      (m) => m.BlogAnalyticsSection,
    ),
  { loading: () => <BlogAnalyticsSkeleton /> },
);

type Props = {
  params: Promise<{ slug: string }>;
};

export default async function BlogAnalyticsPage({ params }: Props) {
  const session = await requireUserResourceAccess();
  const { slug } = await params;
  const blog = await getBlogBySlug(slug);

  if (!blog) {
    notFound();
  }

  if (!canViewBlogAnalytics(blog, session)) {
    return accessDeniedPanel({
      session,
      message: "Only the blog owner can view analytics.",
      returnTo: `/blog/${slug}/analytics`,
      context: {
        reason: "blog analytics access denied — not owner",
        route: `/blog/${slug}/analytics`,
      },
    });
  }

  return (
    <div className="container max-w-3xl py-8 space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Blog analytics
          </h1>
          <p className="text-sm text-muted-foreground truncate max-w-sm">
            {blog.title}
          </p>
        </div>
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/blog/${slug}`}>← Back to post</Link>
        </Button>
      </div>

      <Suspense fallback={<BlogAnalyticsSkeleton />}>
        <BlogAnalyticsSection
          blogId={blog.id}
          blogTitle={blog.title}
          currentPrincipal={getSessionPrincipal(session)}
        />
      </Suspense>
    </div>
  );
}
