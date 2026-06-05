import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { listAnalyticsEventsCursor } from "@/lib/analytics/events";
import { formatDate } from "@/lib/format";

const PAGE_SIZE = 20;

type Props = { cursor?: string };

export async function AnalyticsEventsAllSection({ cursor }: Props) {
  const { events, nextCursor } = await listAnalyticsEventsCursor({
    cursor,
    limit: PAGE_SIZE,
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>All analytics events</CardTitle>
        <CardDescription>
          {PAGE_SIZE} events per page, newest first.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {events.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No analytics events recorded yet.
          </p>
        ) : (
          <ul className="divide-y">
            {events.map((event) => (
              <li
                key={event.id}
                className="flex flex-wrap items-center justify-between gap-3 py-3 text-sm"
              >
                <div className="flex min-w-0 items-center gap-2">
                  <Badge
                    variant="outline"
                    className="shrink-0 font-mono text-xs"
                  >
                    {event.event}
                  </Badge>
                  {event.path ? (
                    <span className="truncate font-mono text-xs text-muted-foreground">
                      {event.path}
                    </span>
                  ) : null}
                  {event.resourceType ? (
                    <span className="shrink-0 text-xs text-muted-foreground">
                      [{event.resourceType}]
                    </span>
                  ) : null}
                </div>
                <div className="flex shrink-0 items-center gap-3 text-xs text-muted-foreground">
                  {event.durationMs != null ? (
                    <span>{event.durationMs}ms</span>
                  ) : null}
                  <span>{formatDate(new Date(event.createdAt))}</span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
      <CardFooter className="flex items-center justify-between">
        {cursor ? (
          <Button variant="outline" size="sm" asChild>
            <Link href="/dashboard/analytics/all">← First page</Link>
          </Button>
        ) : (
          <span />
        )}
        {nextCursor ? (
          <Button variant="outline" size="sm" asChild>
            <Link href={`/dashboard/analytics/all?cursor=${nextCursor}`}>
              Next →
            </Link>
          </Button>
        ) : (
          <span className="text-sm text-muted-foreground">End of events</span>
        )}
      </CardFooter>
    </Card>
  );
}
