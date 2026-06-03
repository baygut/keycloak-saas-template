import { NextResponse } from "next/server";

import { resolveLogoutRedirectUrl } from "@/lib/auth/logout";

export async function GET() {
  const redirectUrl = await resolveLogoutRedirectUrl();
  return NextResponse.redirect(redirectUrl);
}
