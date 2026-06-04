"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { createBlogAction } from "@/actions/blog/create-blog";
import { updateBlogAction } from "@/actions/blog/update-blog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { BLOG_VISIBILITY, type BlogVisibility } from "@/lib/auth/constants";

type BlogFormValues = {
  title: string;
  summary: string;
  content: string;
  visibility: BlogVisibility;
};

type BlogFormProps = {
  actionLabel: string;
  mode: "create" | "edit";
  slug?: string;
  initialValues?: BlogFormValues;
};

export function BlogForm({
  actionLabel,
  mode,
  slug,
  initialValues,
}: BlogFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [title, setTitle] = useState(initialValues?.title ?? "");
  const [summary, setSummary] = useState(initialValues?.summary ?? "");
  const [content, setContent] = useState(initialValues?.content ?? "");
  const [visibility, setVisibility] = useState<BlogVisibility>(
    initialValues?.visibility ?? BLOG_VISIBILITY.PRIVATE,
  );
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    startTransition(async () => {
      const result =
        mode === "create"
          ? await createBlogAction({ title, summary, content, visibility })
          : await updateBlogAction({
              slug: slug!,
              title,
              summary,
              content,
              visibility,
            });

      if (!result.ok) {
        setError(result.error);
        return;
      }

      router.push(`/blog/${result.data.slug}`);
      router.refresh();
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="title">Title</Label>
        <Input
          id="title"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Enter a blog title"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="summary">Summary</Label>
        <Input
          id="summary"
          value={summary}
          onChange={(event) => setSummary(event.target.value)}
          placeholder="Short summary shown in lists"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="content">Content</Label>
        <Textarea
          id="content"
          value={content}
          onChange={(event) => setContent(event.target.value)}
          placeholder="Write the blog post content"
          className="min-h-55 resize-y"
          required
        />
      </div>

      <fieldset className="space-y-3">
        <legend className="text-sm font-medium leading-none">Visibility</legend>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="flex cursor-pointer gap-3 rounded-lg border border-border p-4 has-checked:border-primary has-checked:bg-primary/5">
            <input
              type="radio"
              name="visibility"
              checked={visibility === BLOG_VISIBILITY.PRIVATE}
              onChange={() => setVisibility(BLOG_VISIBILITY.PRIVATE)}
              className="mt-0.5 accent-primary"
            />
            <span className="space-y-1">
              <span className="block text-sm font-medium">Private</span>
              <span className="block text-xs text-muted-foreground">
                Only you, people you share with, and admins can view this post.
              </span>
            </span>
          </label>
          <label className="flex cursor-pointer gap-3 rounded-lg border border-border p-4 has-checked:border-primary has-checked:bg-primary/5">
            <input
              type="radio"
              name="visibility"
              checked={visibility === BLOG_VISIBILITY.PUBLIC}
              onChange={() => setVisibility(BLOG_VISIBILITY.PUBLIC)}
              className="mt-0.5 accent-primary"
            />
            <span className="space-y-1">
              <span className="block text-sm font-medium">Public</span>
              <span className="block text-xs text-muted-foreground">
                Anyone can open the post at /blog/your-slug.
              </span>
            </span>
          </label>
        </div>
      </fieldset>

      {error ? (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      <Button type="submit" disabled={isPending} className="w-full sm:w-auto">
        {isPending ? "Saving..." : actionLabel}
      </Button>
    </form>
  );
}
