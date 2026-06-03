"use client";

import { useAuthStore } from "@/stores/auth-store";

export function useAuth() {
  const user = useAuthStore((state) => state.user);
  const status = useAuthStore((state) => state.status);
  const hasRole = useAuthStore((state) => state.hasRole);
  const hasAnyRole = useAuthStore((state) => state.hasAnyRole);
  const isAdmin = useAuthStore((state) => state.isAdmin);

  return {
    user,
    status,
    isAuthenticated: status === "authenticated",
    hasRole,
    hasAnyRole,
    isAdmin,
  };
}
