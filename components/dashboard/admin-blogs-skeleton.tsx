import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function AdminBlogsSkeleton() {
  return (
    <Card>
      <CardHeader className="flex flex-col gap-2">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-4 w-56" />
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {Array.from({ length: 5 }).map((_, index) => (
          <div
            key={index}
            className="flex flex-col gap-2 rounded-md border border-border p-3 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="flex flex-1 flex-col gap-2">
              <Skeleton className="h-5 w-2/3" />
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-1/2" />
            </div>
            <div className="flex gap-2">
              <Skeleton className="h-8 w-16" />
              <Skeleton className="h-8 w-16" />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
