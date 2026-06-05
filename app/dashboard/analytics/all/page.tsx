import { Suspense } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";

import { ResourceBadge } from "@/components/auth/resource-badge";
import { ErrorBoundary } from "@/components/core/error-boundary";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ROLES } from "@/lib/auth/constants";
import { PROTECTED_RESOURCES } from "@/lib/auth/resources";
import { requireRole } from "@/lib/auth/server";

function AnalyticsEventsSkeleton() {
  return (
    <Card>
      <CardHeader className="flex flex-col gap-2">
        <Skeleton className="h-6 w-44" />
        <Skeleton className="h-4 w-56" />
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex items-center justify-between py-1">
            <div className="flex items-center gap-2">
              <Skeleton className="h-5 w-24" />
              <Skeleton className="h-4 w-32" />
            </div>
            <Skeleton className="h-4 w-20 shrink-0" />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

const AnalyticsEventsAllSection = dynamic(
  () =>
    import("@/components/dashboard/analytics-events-all-section").then(
      (m) => m.AnalyticsEventsAllSection,
    ),
  { loading: () => <AnalyticsEventsSkeleton /> },
);

type Props = {
  searchParams: Promise<{ cursor?: string }>;
};

export default async function AllAnalyticsPage({ searchParams }: Props) {
  await requireRole(ROLES.ADMIN);
  const { cursor } = await searchParams;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              All analytics events
            </h1>
            <p className="text-sm text-muted-foreground">
              Full paginated view of tracked page views and route transitions.
            </p>
          </div>
          <ResourceBadge resource={PROTECTED_RESOURCES.ADMIN} />
          <Badge variant="outline">{ROLES.ADMIN}</Badge>
        </div>
        <Button variant="outline" size="sm" asChild>
          <Link href="/dashboard/analytics">← Summary</Link>
        </Button>
      </div>

      <Suspense fallback={<AnalyticsEventsSkeleton />}>
        <ErrorBoundary>
          <AnalyticsEventsAllSection cursor={cursor} />
        </ErrorBoundary>
      </Suspense>
    </div>
  );
}
