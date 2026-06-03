"use client";

import { create } from "zustand";

import { ROLES, type AppRole } from "@/lib/auth/constants";
import {
  hasAnyRole as checkAnyRole,
  hasRole as checkRole,
  isAdmin as checkIsAdmin,
} from "@/lib/auth/permissions";
import type { SafeSessionUser } from "@/lib/auth/types";

type AuthState = {
  user: SafeSessionUser | null;
  status: "loading" | "authenticated" | "anonymous";
  hydrate: (user: SafeSessionUser | null) => void;
  setUser: (user: SafeSessionUser | null) => void;
  hasRole: (role: AppRole) => boolean;
  hasAnyRole: (roles: readonly AppRole[]) => boolean;
  isAdmin: () => boolean;
};

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  status: "loading",
  hydrate: (user) =>
    set({
      user,
      status: user ? "authenticated" : "anonymous",
    }),
  setUser: (user) =>
    set({
      user,
      status: user ? "authenticated" : "anonymous",
    }),
  hasRole: (role) => {
    const { user } = get();
    return user ? checkRole({ ...user, roles: user.roles }, role) : false;
  },
  hasAnyRole: (roles) => {
    const { user } = get();
    return user
      ? checkAnyRole({ ...user, roles: user.roles }, roles)
      : false;
  },
  isAdmin: () => {
    const { user } = get();
    return user ? checkIsAdmin({ ...user, roles: user.roles }) : false;
  },
}));

export { ROLES };
