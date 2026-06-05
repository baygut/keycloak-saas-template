import { Suspense } from "react";

import { ResourceBadge } from "@/components/auth/resource-badge";
import { Badge } from "@/components/ui/badge";
import { AnalyticsPanel } from "@/components/dashboard/analytics-panel";
import { ErrorBoundary } from "@/components/core/error-boundary";
import { ROLES } from "@/lib/auth/constants";
import { PROTECTED_RESOURCES } from "@/lib/auth/resources";
import { requireRole } from "@/lib/auth/server";
import AnalyticsLoading from "./loading";

export default async function AdminAnalyticsPage() {
  await requireRole(ROLES.ADMIN);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Analytics</h1>
          <p className="text-sm text-muted-foreground">
            Page views, route performance, and OpenTelemetry traces.
          </p>
        </div>
        <ResourceBadge resource={PROTECTED_RESOURCES.ADMIN} />
        <Badge variant="outline">{ROLES.ADMIN}</Badge>
      </div>

      <Suspense fallback={<AnalyticsLoading />}>
        <ErrorBoundary>
          <AnalyticsPanel />
        </ErrorBoundary>
      </Suspense>
    </div>
  );
}
