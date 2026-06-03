import { Suspense } from "react";
import Link from "next/link";

import { AdminBlogsSection } from "@/components/dashboard/admin-blogs-section";
import { AdminBlogsSkeleton } from "@/components/dashboard/admin-blogs-skeleton";
import { ResourceBadge } from "@/components/auth/resource-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ROLES } from "@/lib/auth/constants";
import { PROTECTED_RESOURCES } from "@/lib/auth/resources";
import { requireRole } from "@/lib/auth/server";

export default async function AdminBlogsPage() {
  await requireRole(ROLES.ADMIN);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Blog management</h1>
            <p className="text-sm text-muted-foreground">
              Admin-only view of every blog in the database.
            </p>
          </div>
          <ResourceBadge resource={PROTECTED_RESOURCES.ADMIN} />
          <Badge variant="outline">{ROLES.ADMIN}</Badge>
        </div>
        <Button asChild>
          <Link href="/blog/new">New blog</Link>
        </Button>
      </div>

      <Suspense fallback={<AdminBlogsSkeleton />}>
        <AdminBlogsSection />
      </Suspense>
    </div>
  );
}
