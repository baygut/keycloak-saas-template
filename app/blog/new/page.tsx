import Link from "next/link";

import { BlogForm } from "@/components/blog-form";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ResourceBadge } from "@/components/auth/resource-badge";
import { PROTECTED_RESOURCES } from "@/lib/auth/resources";
import { requireUserResourceAccess } from "@/lib/auth/server";

export default async function NewBlogPage() {
  await requireUserResourceAccess();

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        <ResourceBadge resource={PROTECTED_RESOURCES.USER} />
        <span className="text-sm text-muted-foreground">Create flow (user_restricted)</span>
      </div>
      <Button variant="ghost" size="sm" className="-ml-2 w-fit" asChild>
        <Link href="/blog">← Back to blogs</Link>
      </Button>

      <Card>
        <CardHeader>
          <CardTitle>Create a blog</CardTitle>
          <CardDescription>
            Add a title, summary, and content. Choose who can read the post.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <BlogForm mode="create" actionLabel="Create blog" />
        </CardContent>
      </Card>
    </div>
  );
}
