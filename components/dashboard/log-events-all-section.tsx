import Link from "next/link";

import { AdminLogPanel } from "@/components/dashboard/admin-log-panel";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getAdminLogEventsCursor } from "@/lib/dashboard/get-admin-logs";

const PAGE_SIZE = 20;

type Props = { cursor?: string };

export async function LogEventsAllSection({ cursor }: Props) {
  const { events, nextCursor } = await getAdminLogEventsCursor({
    cursor,
    limit: PAGE_SIZE,
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>All system logs</CardTitle>
        <CardDescription>
          {PAGE_SIZE} events per page, newest first.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <AdminLogPanel events={events} fullPage />
      </CardContent>
      <CardFooter className="flex items-center justify-between">
        {cursor ? (
          <Button variant="outline" size="sm" asChild>
            <Link href="/dashboard/logs/all">← First page</Link>
          </Button>
        ) : (
          <span />
        )}
        {nextCursor ? (
          <Button variant="outline" size="sm" asChild>
            <Link href={`/dashboard/logs/all?cursor=${nextCursor}`}>
              Next →
            </Link>
          </Button>
        ) : (
          <span className="text-sm text-muted-foreground">End of logs</span>
        )}
      </CardFooter>
    </Card>
  );
}
