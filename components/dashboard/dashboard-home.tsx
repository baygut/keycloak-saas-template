import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { SafeSessionUser } from "@/lib/auth/types";

type QuickStats =
  | { role: "admin"; totalViews: number; totalBlogs: number }
  | { role: "user"; totalViews: number; totalBlogs: number };

type DashboardHomeProps = {
  user: SafeSessionUser;
  quickStats: QuickStats;
};

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <Card>
      <CardContent className="pt-6">
        <p className="text-3xl font-bold tabular-nums">{value}</p>
        <p className="mt-1 text-sm text-muted-foreground">{label}</p>
      </CardContent>
    </Card>
  );
}

export function DashboardHome({ user, quickStats }: DashboardHomeProps) {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Overview of your authenticated session.
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <span className="size-2 animate-pulse rounded-full bg-green-500" />
            <CardDescription>Authentication session established</CardDescription>
          </div>
          <CardTitle className="text-2xl">Welcome back, {user.name}!</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Active roles:{" "}
            <Badge variant="secondary">{user.roles.join(", ") || "none"}</Badge>
          </p>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2">
        <StatCard
          label={
            quickStats.role === "admin" ? "Total page views" : "Views on your posts"
          }
          value={quickStats.totalViews}
        />
        <StatCard
          label={
            quickStats.role === "admin" ? "Total blogs" : "Your blog posts"
          }
          value={quickStats.totalBlogs}
        />
      </div>

      {quickStats.role === "admin" ? (
        <Card>
          <CardHeader>
            <CardTitle>Analytics</CardTitle>
            <CardDescription>
              Full system analytics including route performance and OpenTelemetry
              traces.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" size="sm">
              <Link href="/dashboard/analytics">View analytics</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Your blogs</CardTitle>
            <CardDescription>
              View your published posts and their performance.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" size="sm">
              <Link href="/dashboard/my-blogs">View my blogs</Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
