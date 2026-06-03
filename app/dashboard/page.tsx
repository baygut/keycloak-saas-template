import { DashboardHome } from "@/components/dashboard/dashboard-home";
import { getSafeSessionUser, requireSession } from "@/lib/auth/server";

export default async function DashboardPage() {
  const session = await requireSession();
  const user = getSafeSessionUser(session);

  return <DashboardHome user={user} />;
}
