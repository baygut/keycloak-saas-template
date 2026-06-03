import { isAdmin } from "@/lib/auth/permissions";
import {
  PROTECTED_RESOURCES,
  RESOURCE_ROUTES,
  type ProtectedResourceId,
} from "@/lib/auth/resources";
import type { SessionUser } from "@/lib/auth/types";

export type DashboardNavIcon =
  | "layout-dashboard"
  | "user"
  | "users"
  | "blogs"
  | "logs";

export type DashboardNavItem = {
  href: string;
  label: string;
  icon: DashboardNavIcon;
  resource: ProtectedResourceId;
};

export type DashboardSidebarConfig = {
  navItems: DashboardNavItem[];
};

export function getDashboardSidebarConfig(
  session: SessionUser,
): DashboardSidebarConfig {
  const navItems: DashboardNavItem[] = [
    {
      href: "/dashboard",
      label: "Dashboard",
      icon: "layout-dashboard",
      resource: PROTECTED_RESOURCES.USER,
    },
    {
      href: RESOURCE_ROUTES.userRestricted.profile,
      label: "Profile",
      icon: "user",
      resource: PROTECTED_RESOURCES.USER,
    },
  ];

  if (isAdmin(session)) {
    navItems.push(
      {
        href: RESOURCE_ROUTES.adminRestricted.users,
        label: "User management",
        icon: "users",
        resource: PROTECTED_RESOURCES.ADMIN,
      },
      {
        href: RESOURCE_ROUTES.adminRestricted.blogs,
        label: "Blog management",
        icon: "blogs",
        resource: PROTECTED_RESOURCES.ADMIN,
      },
      {
        href: RESOURCE_ROUTES.adminRestricted.logs,
        label: "System logs",
        icon: "logs",
        resource: PROTECTED_RESOURCES.ADMIN,
      },
    );
  }

  return { navItems };
}
