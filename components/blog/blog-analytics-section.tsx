import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getBlogAnalytics } from "@/lib/analytics/events";

type Props = { blogId: string; blogTitle: string; currentPrincipal: string };

export async function BlogAnalyticsSection({
  blogId,
  blogTitle,
  currentPrincipal,
}: Props) {
  const { totalViews, dailyViews, recentViewers } =
    await getBlogAnalytics(blogId);

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardContent className="pt-6">
          <p className="text-4xl font-bold tabular-nums">{totalViews}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Total views for &ldquo;{blogTitle}&rdquo;
          </p>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Daily views</CardTitle>
            <CardDescription>Last 30 days</CardDescription>
          </CardHeader>
          <CardContent>
            {dailyViews.length === 0 ? (
              <p className="text-sm text-muted-foreground">No views yet.</p>
            ) : (
              <ul className="divide-y">
                {dailyViews.map((row) => (
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

        <Card>
          <CardHeader>
            <CardTitle>Recent viewers</CardTitle>
            <CardDescription>
              Last 10 unique authenticated visitors
            </CardDescription>
          </CardHeader>
          <CardContent>
            {recentViewers.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No authenticated views recorded yet.
              </p>
            ) : (
              <ul className="divide-y">
                {recentViewers.map((viewer) => (
                  <li
                    key={viewer}
                    className="flex items-center gap-2 py-2 text-sm font-mono"
                  >
                    {viewer}
                    {viewer === currentPrincipal ? (
                      <span className="font-sans text-xs text-muted-foreground">
                        (You :D)
                      </span>
                    ) : null}
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
