"use client";

import { useTransition } from "react";

import { signOutAction } from "@/actions/auth/sign-out";
import { useAuthStore } from "@/stores/auth-store";

export function SignOutButton({
  className,
  children = "Sign Out",
}: {
  className?: string;
  children?: React.ReactNode;
}) {
  const setUser = useAuthStore((state) => state.setUser);
  const [isPending, startTransition] = useTransition();

  return (
    <button
      type="button"
      className={className}
      disabled={isPending}
      onClick={() => {
        setUser(null);
        startTransition(() => {
          void signOutAction();
        });
      }}
    >
      {isPending ? "Signing out…" : children}
    </button>
  );
}
