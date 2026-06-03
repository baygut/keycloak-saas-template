"use server";

import { redirect } from "next/navigation";

import { resolveLogoutRedirectUrl } from "@/lib/auth/logout";

export async function signOutAction(): Promise<void> {
  const redirectUrl = await resolveLogoutRedirectUrl();
  redirect(redirectUrl);
}
