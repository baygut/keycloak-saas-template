import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { getSessionPrincipal } from "@/lib/auth/permissions";
import { getSession } from "@/lib/auth/server";
import { persistAnalyticsEvent } from "@/lib/analytics/events";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as unknown;

    if (!body || typeof body !== "object") {
      return NextResponse.json({ ok: false }, { status: 400 });
    }

    const { path, from, durationMs, navigationType } = body as Record<
      string,
      unknown
    >;

    if (typeof path !== "string" || typeof durationMs !== "number") {
      return NextResponse.json({ ok: false }, { status: 400 });
    }

    const session = await getSession();
    const viewerKey = session ? getSessionPrincipal(session) : undefined;

    await persistAnalyticsEvent({
      event: "route_transition",
      path,
      viewerKey,
      durationMs: Math.min(Math.max(0, durationMs), 60_000),
      meta: JSON.stringify({
        from: typeof from === "string" ? from : "",
        navigationType:
          typeof navigationType === "string" ? navigationType : "push",
      }),
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
