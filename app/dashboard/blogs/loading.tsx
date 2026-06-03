import { AdminBlogsSkeleton } from "@/components/dashboard/admin-blogs-skeleton";
import { Skeleton } from "@/components/ui/skeleton";

export default function AdminBlogsLoading() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <Skeleton className="h-8 w-56 animate-pulse rounded-md bg-muted" />
        <Skeleton className="h-4 w-80 animate-pulse rounded-md bg-muted" />
      </div>
      <AdminBlogsSkeleton />
    </div>
  );
}
