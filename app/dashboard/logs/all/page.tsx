import { Suspense } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";

import { ResourceBadge } from "@/components/auth/resource-badge";
import { AdminLogsSkeleton } from "@/components/dashboard/admin-logs-skeleton";
import { ErrorBoundary } from "@/components/core/error-boundary";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ROLES } from "@/lib/auth/constants";
import { PROTECTED_RESOURCES } from "@/lib/auth/resources";
import { requireRole } from "@/lib/auth/server";

const LogEventsAllSection = dynamic(
  () =>
    import("@/components/dashboard/log-events-all-section").then(
      (m) => m.LogEventsAllSection,
    ),
  { loading: () => <AdminLogsSkeleton /> },
);

type Props = {
  searchParams: Promise<{ cursor?: string }>;
};

export default async function AllLogsPage({ searchParams }: Props) {
  await requireRole(ROLES.ADMIN);
  const { cursor } = await searchParams;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              All system logs
            </h1>
            <p className="text-sm text-muted-foreground">
              Full paginated view of persisted application events.
            </p>
          </div>
          <ResourceBadge resource={PROTECTED_RESOURCES.ADMIN} />
          <Badge variant="outline">{ROLES.ADMIN}</Badge>
        </div>
        <Button variant="outline" size="sm" asChild>
          <Link href="/dashboard/logs">← Recent</Link>
        </Button>
      </div>

      <Suspense fallback={<AdminLogsSkeleton />}>
        <ErrorBoundary>
          <LogEventsAllSection cursor={cursor} />
        </ErrorBoundary>
      </Suspense>
    </div>
  );
}
