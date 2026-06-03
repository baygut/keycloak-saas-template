"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  FileText,
  LayoutDashboard,
  Lock,
  LogOut,
  ScrollText,
  User,
  Users,
} from "lucide-react";

import { ResourceBadge } from "@/components/auth/resource-badge";
import { SignOutButton } from "@/components/auth/sign-out-button";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import type {
  DashboardNavIcon,
  DashboardNavItem,
  DashboardSidebarConfig,
} from "@/lib/dashboard/sidebar";

const NAV_ICONS: Record<DashboardNavIcon, typeof LayoutDashboard> = {
  "layout-dashboard": LayoutDashboard,
  user: User,
  users: Users,
  blogs: FileText,
  logs: ScrollText,
};

type AppSidebarProps = {
  config: DashboardSidebarConfig;
};

function isActive(pathname: string, href: string) {
  if (href === "/dashboard") {
    return pathname === "/dashboard";
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

function NavMenu({ items }: { items: DashboardNavItem[] }) {
  const pathname = usePathname();

  return (
    <SidebarMenu>
      {items.map((item) => {
        const Icon = NAV_ICONS[item.icon];
        const active = pathname ? isActive(pathname, item.href) : false;

        return (
          <SidebarMenuItem key={item.href}>
            <SidebarMenuButton asChild isActive={active} tooltip={item.label}>
              <Link href={item.href} className="flex min-w-0 items-center gap-2 overflow-hidden">
                <Icon className="size-4 shrink-0" />
                <span className="truncate">{item.label}</span>
                <ResourceBadge
                  resource={item.resource}
                  className="ml-auto hidden shrink-0 group-data-[collapsible=icon]:hidden lg:inline-flex"
                />
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        );
      })}
    </SidebarMenu>
  );
}

export function AppSidebarMobileTrigger() {
  return <SidebarTrigger className="md:hidden" />;
}

export function AppSidebar({ config }: AppSidebarProps) {
  return (
    <Sidebar collapsible="icon" variant="sidebar">
      <SidebarHeader className="overflow-hidden">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild tooltip="Keycloak SaaS">
              <Link href="/dashboard">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                  <Lock className="size-4" />
                </div>
                <div className="grid min-w-0 flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">Keycloak SaaS</span>
                  <span className="truncate text-xs text-sidebar-foreground/70">
                    Dashboard
                  </span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <NavMenu items={config.navItems} />
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="overflow-hidden p-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              tooltip="Sign out"
              className="text-destructive hover:text-destructive"
            >
              <SignOutButton className="flex min-w-0 items-center gap-2 overflow-hidden">
                <LogOut className="size-4 shrink-0" />
                <span className="truncate">Sign out</span>
              </SignOutButton>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        <SidebarTrigger className="mt-2 hidden md:flex group-data-[collapsible=icon]:hidden" />
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
