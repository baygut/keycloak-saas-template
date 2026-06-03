import { AdminLogPanel } from "@/components/dashboard/admin-log-panel";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getAdminRecentLogEvents } from "@/lib/dashboard/get-admin-logs";
import { requireSession } from "@/lib/auth/server";

export async function AdminLogsSection() {
  const session = await requireSession();
  const events = await getAdminRecentLogEvents(session);

  return (
    <Card>
      <CardHeader>
        <CardTitle>System event logs</CardTitle>
        <CardDescription>
          Recent persisted log events from the application logger.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <AdminLogPanel events={events} fullPage />
      </CardContent>
    </Card>
  );
}
