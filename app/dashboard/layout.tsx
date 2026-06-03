import {
  AppSidebar,
  AppSidebarMobileTrigger,
} from "@/components/dashboard/app-sidebar";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { SidebarInset } from "@/components/ui/sidebar";
import { requireSession } from "@/lib/auth/server";
import { getDashboardSidebarConfig } from "@/lib/dashboard/sidebar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireSession();
  const sidebarConfig = getDashboardSidebarConfig(session);

  return (
    <DashboardShell sidebar={<AppSidebar config={sidebarConfig} />}>
      <SidebarInset className="flex min-h-svh flex-col px-3">
        <main className="container flex flex-1 flex-col gap-4 py-8">
          <AppSidebarMobileTrigger />
          {children}
        </main>
      </SidebarInset>
    </DashboardShell>
  );
}
