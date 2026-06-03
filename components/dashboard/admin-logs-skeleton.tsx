import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function AdminLogsSkeleton() {
  return (
    <Card>
      <CardHeader className="flex flex-col gap-2">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-4 w-64" />
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <div
            key={index}
            className="flex flex-col gap-2 rounded-md border border-border p-3"
          >
            <div className="flex items-start justify-between gap-4">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-24 shrink-0" />
            </div>
            <Skeleton className="h-3 w-full" />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
