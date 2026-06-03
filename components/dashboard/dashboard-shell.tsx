"use client";

import { SidebarProvider } from "@/components/ui/sidebar";

type DashboardShellProps = {
  sidebar: React.ReactNode;
  children: React.ReactNode;
};

export function DashboardShell({ sidebar, children }: DashboardShellProps) {
  return (
    <SidebarProvider>
      {sidebar}
      {children}
    </SidebarProvider>
  );
}
