"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { deleteBlogAction } from "@/actions/blog/delete-blog";
import { Button } from "./ui/button";

type BlogDeleteButtonProps = {
  slug: string;
};

export function BlogDeleteButton({ slug }: BlogDeleteButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleDelete() {
    const confirmed = window.confirm("Delete this blog post?");

    if (!confirmed) {
      return;
    }

    setError(null);

    startTransition(async () => {
      const result = await deleteBlogAction(slug);

      if (!result.ok) {
        setError(result.error);
        return;
      }

      router.push("/blog");
      router.refresh();
    });
  }

  return (
    <div>
      <Button onClick={handleDelete} disabled={isPending} variant="destructive">
        {isPending ? "Deleting..." : "Delete"}
      </Button>
      {error ? <p className="text-xs text-brand-accent">{error}</p> : null}
    </div>
  );
}
