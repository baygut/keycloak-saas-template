"use client";

import Link from "next/link";
import {
  FileText,
  LayoutDashboard,
  Newspaper,
  ScrollText,
  User,
  Users,
} from "lucide-react";

import { RoleGuard } from "@/components/auth/role-guard";
import { SignOutButton } from "@/components/auth/sign-out-button";
import {
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { ROLE_GROUPS, ROLES } from "@/lib/auth/constants";
import { RESOURCE_ROUTES } from "@/lib/auth/resources";

export function HeaderAuthMenuItems() {
  return (
    <>
      <DropdownMenuItem asChild>
        <Link href="/dashboard" className="flex cursor-pointer items-center gap-2">
          <LayoutDashboard />
          Dashboard
        </Link>
      </DropdownMenuItem>
      <DropdownMenuItem asChild>
        <Link href="/blog" className="flex cursor-pointer items-center gap-2">
          <Newspaper />
          Blogs
        </Link>
      </DropdownMenuItem>
      <RoleGuard roles={ROLE_GROUPS.USER_ACCESS}>
        <DropdownMenuItem asChild>
          <Link
            href={RESOURCE_ROUTES.userRestricted.profile}
            className="flex cursor-pointer items-center gap-2"
          >
            <User />
            Profile (user_restricted)
          </Link>
        </DropdownMenuItem>
      </RoleGuard>
      <RoleGuard role={ROLES.ADMIN}>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link
            href={RESOURCE_ROUTES.adminRestricted.logs}
            className="flex cursor-pointer items-center gap-2"
          >
            <ScrollText />
            System logs
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link
            href={RESOURCE_ROUTES.adminRestricted.blogs}
            className="flex cursor-pointer items-center gap-2"
          >
            <FileText />
            Blog management
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link
            href={RESOURCE_ROUTES.adminRestricted.users}
            className="flex cursor-pointer items-center gap-2"
          >
            <Users />
            User management
          </Link>
        </DropdownMenuItem>
      </RoleGuard>
      <DropdownMenuSeparator />
      <DropdownMenuItem asChild>
        <SignOutButton className="w-full" />
      </DropdownMenuItem>
    </>
  );
}
