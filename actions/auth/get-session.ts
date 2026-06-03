"use server";

import { getSafeSessionUser, getSession } from "@/lib/auth/server";
import type { ActionResult } from "@/lib/auth/types";
import type { SafeSessionUser } from "@/lib/auth/types";

export async function getSessionAction(): Promise<
  ActionResult<{ authenticated: boolean; user: SafeSessionUser | null }>
> {
  const session = await getSession();

  if (!session) {
    return { ok: true, data: { authenticated: false, user: null } };
  }

  return {
    ok: true,
    data: { authenticated: true, user: getSafeSessionUser(session) },
  };
}
