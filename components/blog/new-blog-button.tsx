"use client";

import Link from "next/link";

import { RoleGuard } from "@/components/auth/role-guard";
import { Button } from "@/components/ui/button";
import { ROLE_GROUPS } from "@/lib/auth/constants";

type NewBlogButtonProps = {
  className?: string;
};

export function NewBlogButton({ className }: NewBlogButtonProps) {
  return (
    <RoleGuard roles={ROLE_GROUPS.USER_ACCESS}>
      <Button asChild className={className}>
        <Link href="/blog/new">New blog</Link>
      </Button>
    </RoleGuard>
  );
}
