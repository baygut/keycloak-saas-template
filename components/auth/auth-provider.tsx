"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

import { getSessionAction } from "@/actions/auth/get-session";
import type { SafeSessionUser } from "@/lib/auth/types";
import { useAuthStore } from "@/stores/auth-store";

type AuthProviderProps = {
  initialUser: SafeSessionUser | null;
  children: React.ReactNode;
};

export function AuthProvider({ initialUser, children }: AuthProviderProps) {
  const hydrate = useAuthStore((state) => state.hydrate);

  useEffect(() => {
    hydrate(initialUser);
  }, [hydrate, initialUser]);

  return <>{children}</>;
}

export function AuthRefresher() {
  const setUser = useAuthStore((state) => state.setUser);
  const pathname = usePathname();

  useEffect(() => {
    async function refresh() {
      const result = await getSessionAction();
      if (result.ok && result.data.authenticated && result.data.user) {
        setUser(result.data.user);
      } else {
        setUser(null);
      }
    }

    void refresh();
  }, [setUser, pathname]);

  return null;
}
