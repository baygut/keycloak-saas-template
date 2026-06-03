import { AdminBlogsPanel } from "@/components/dashboard/admin-blogs-panel";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { requireSession } from "@/lib/auth/server";
import { listBlogsForViewer } from "@/lib/blog/repository";

export async function AdminBlogsSection() {
  const session = await requireSession();
  const blogs = await listBlogsForViewer(session);

  return (
    <Card>
      <CardHeader>
        <CardTitle>All blogs</CardTitle>
        <CardDescription>
          {blogs.length} blog{blogs.length === 1 ? "" : "s"} across all owners,
          ordered by most recently updated.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <AdminBlogsPanel blogs={blogs} fullPage />
      </CardContent>
    </Card>
  );
}
