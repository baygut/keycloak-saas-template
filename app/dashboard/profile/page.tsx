import { ResourceBadge } from "@/components/auth/resource-badge";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PROTECTED_RESOURCES } from "@/lib/auth/resources";
import {
  getSafeSessionUser,
  requireUserResourceAccess,
} from "@/lib/auth/server";

export default async function ProfilePage() {
  const session = await requireUserResourceAccess();
  const user = getSafeSessionUser(session);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Profile</h1>
          <p className="text-sm text-muted-foreground">
            User-restricted resource — requires the{" "}
            <code className="text-xs">user</code> or{" "}
            <code className="text-xs">admin</code> role.
          </p>
        </div>
        <ResourceBadge resource={PROTECTED_RESOURCES.USER} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{user.name}</CardTitle>
          <CardDescription>Authenticated via Keycloak</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 text-sm">
          <div className="flex flex-col gap-1">
            <span className="text-muted-foreground">Email</span>
            <span>{user.email ?? "—"}</span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-muted-foreground">Username</span>
            <span>{user.username ?? "—"}</span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-muted-foreground">Subject (sub)</span>
            <span className="font-mono text-xs break-all">{user.sub}</span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-muted-foreground">Roles</span>
            <div className="flex flex-wrap gap-2">
              {user.roles.length > 0 ? (
                user.roles.map((role) => (
                  <Badge key={role} variant="secondary">
                    {role}
                  </Badge>
                ))
              ) : (
                <span className="text-muted-foreground">No roles assigned</span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
