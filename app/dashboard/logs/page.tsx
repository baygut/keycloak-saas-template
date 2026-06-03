import { Suspense } from "react";

import { AdminLogsSection } from "@/components/dashboard/admin-logs-section";
import { AdminLogsSkeleton } from "@/components/dashboard/admin-logs-skeleton";
import { ResourceBadge } from "@/components/auth/resource-badge";
import { Badge } from "@/components/ui/badge";
import { ROLES } from "@/lib/auth/constants";
import { PROTECTED_RESOURCES } from "@/lib/auth/resources";
import { requireRole } from "@/lib/auth/server";

export default async function AdminLogsPage() {
  await requireRole(ROLES.ADMIN);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">System logs</h1>
          <p className="text-sm text-muted-foreground">
            Admin-only view of persisted application events.
          </p>
        </div>
        <ResourceBadge resource={PROTECTED_RESOURCES.ADMIN} />
        <Badge variant="outline">{ROLES.ADMIN}</Badge>
      </div>

      <Suspense fallback={<AdminLogsSkeleton />}>
        <AdminLogsSection />
      </Suspense>
    </div>
  );
}
