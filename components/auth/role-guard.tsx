"use client";

import type { AppRole } from "@/lib/auth/constants";
import { useAuth } from "@/hooks/use-auth";

type RoleGuardProps = {
  role?: AppRole;
  roles?: readonly AppRole[];
  fallback?: React.ReactNode;
  children: React.ReactNode;
};

export function RoleGuard({
  role,
  roles,
  fallback = null,
  children,
}: RoleGuardProps) {
  const { hasRole, hasAnyRole, isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return fallback;
  }

  const allowed = role
    ? hasRole(role)
    : roles
      ? hasAnyRole(roles)
      : true;

  if (!allowed) {
    return fallback;
  }

  return <>{children}</>;
}
