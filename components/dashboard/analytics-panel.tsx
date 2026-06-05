import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  getAdminAnalytics,
  getRecentOtelSpans,
} from "@/lib/analytics/events";
import { formatDate } from "@/lib/format";

function StatCard({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <Card>
      <CardContent className="pt-6">
        <p className="text-3xl font-bold">{value}</p>
        <p className="text-sm text-muted-foreground mt-1">{label}</p>
      </CardContent>
    </Card>
  );
}

export async function AnalyticsPanel() {
  const [analytics, recentSpans] = await Promise.all([
    getAdminAnalytics(),
    getRecentOtelSpans(20),
  ]);

  return (
    <div className="flex flex-col gap-8">
      {/* Summary stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard label="Total page views" value={analytics.totalViews} />
        <StatCard label="Total blogs" value={analytics.totalBlogs} />
        <StatCard
          label="Tracked route transitions"
          value={analytics.routeStats.reduce((s, r) => s + r.count, 0)}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Top blogs */}
        <Card>
          <CardHeader>
            <CardTitle>Top posts by views</CardTitle>
            <CardDescription>Most visited blog posts</CardDescription>
          </CardHeader>
          <CardContent>
            {analytics.topBlogs.length === 0 ? (
              <p className="text-sm text-muted-foreground">No views recorded yet.</p>
            ) : (
              <ul className="divide-y">
                {analytics.topBlogs.map((blog) => (
                  <li
                    key={blog.slug}
                    className="flex items-center justify-between py-2 text-sm"
                  >
                    <Link
                      href={`/blog/${blog.slug}`}
                      className="truncate hover:underline"
                    >
                      {blog.title}
                    </Link>
                    <span className="ml-4 shrink-0 tabular-nums text-muted-foreground">
                      {blog.viewCount} views
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Daily views */}
        <Card>
          <CardHeader>
            <CardTitle>Daily views</CardTitle>
            <CardDescription>Last 7 days</CardDescription>
          </CardHeader>
          <CardContent>
            {analytics.dailyViews.length === 0 ? (
              <p className="text-sm text-muted-foreground">No data yet.</p>
            ) : (
              <ul className="divide-y">
                {analytics.dailyViews.map((row) => (
                  <li
                    key={row.date}
                    className="flex items-center justify-between py-2 text-sm"
                  >
                    <span className="text-muted-foreground">{row.date}</span>
                    <span className="tabular-nums">{row.count}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Route transitions */}
        <Card>
          <CardHeader>
            <CardTitle>Route transitions</CardTitle>
            <CardDescription>Top 5 routes by navigation count</CardDescription>
          </CardHeader>
          <CardContent>
            {analytics.routeStats.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No transitions recorded yet. Navigate around the app to generate data.
              </p>
            ) : (
              <ul className="divide-y">
                {analytics.routeStats.map((row) => (
                  <li
                    key={row.path}
                    className="flex items-center justify-between gap-4 py-2 text-sm"
                  >
                    <span className="truncate font-mono text-xs">{row.path}</span>
                    <span className="shrink-0 tabular-nums text-muted-foreground">
                      {row.count}× · avg {row.avgMs}ms
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Recent OTel spans */}
        <Card>
          <CardHeader>
            <CardTitle>Recent traces</CardTitle>
            <CardDescription>Latest 20 OpenTelemetry spans</CardDescription>
          </CardHeader>
          <CardContent>
            {recentSpans.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No spans recorded yet. Spans appear after the first request.
              </p>
            ) : (
              <ul className="divide-y">
                {recentSpans.map((span) => (
                  <li
                    key={span.id}
                    className="flex items-start justify-between gap-3 py-2 text-xs"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-mono">{span.name}</p>
                      <p className="text-muted-foreground">
                        {span.service ?? span.kind} · {span.durationMs}ms ·{" "}
                        {formatDate(span.startTime)}
                      </p>
                    </div>
                    <Badge
                      variant={
                        span.statusCode === "ERROR" ? "destructive" : "outline"
                      }
                      className="shrink-0"
                    >
                      {span.statusCode}
                    </Badge>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
