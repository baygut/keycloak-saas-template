import { AdminLogsSkeleton } from "@/components/dashboard/admin-logs-skeleton";

export default function AllLogsLoading() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <div className="h-8 w-48 animate-pulse rounded-md bg-muted" />
        <div className="h-4 w-72 animate-pulse rounded-md bg-muted" />
      </div>
      <AdminLogsSkeleton />
    </div>
  );
}
