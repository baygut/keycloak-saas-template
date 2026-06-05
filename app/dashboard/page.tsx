import { DashboardHome } from "@/components/dashboard/dashboard-home";
import { isAdmin, getSessionPrincipal } from "@/lib/auth/permissions";
import { getSafeSessionUser, requireSession } from "@/lib/auth/server";
import { getAdminAnalytics, getUserAnalytics } from "@/lib/analytics/events";

export default async function DashboardPage() {
  const session = await requireSession();
  const user = getSafeSessionUser(session);

  const quickStats = isAdmin(session)
    ? await getAdminAnalytics().then((a) => ({
        role: "admin" as const,
        totalViews: a.totalViews,
        totalBlogs: a.totalBlogs,
      }))
    : await getUserAnalytics(getSessionPrincipal(session)).then((a) => ({
        role: "user" as const,
        totalViews: a.totalViews,
        totalBlogs: a.blogs.length,
      }));

  return <DashboardHome user={user} quickStats={quickStats} />;
}
