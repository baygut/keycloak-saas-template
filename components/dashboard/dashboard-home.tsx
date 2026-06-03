import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { SafeSessionUser } from "@/lib/auth/types";

type DashboardHomeProps = {
  user: SafeSessionUser;
};

export function DashboardHome({ user }: DashboardHomeProps) {
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
    </div>
  );
}
