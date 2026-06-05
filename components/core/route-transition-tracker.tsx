"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

export function RouteTransitionTracker() {
  const pathname = usePathname();
  const prevPathRef = useRef("");

  useEffect(() => {
    const prev = prevPathRef.current;
    prevPathRef.current = pathname;

    if (!prev || prev === pathname) return;

    const navStart = window.__navStart;
    if (!navStart) return;

    const durationMs = Math.round(performance.now() - navStart.time);
    window.__navStart = undefined;

    fetch("/api/analytics/route-event", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        path: pathname,
        from: prev,
        durationMs,
        navigationType: navStart.type,
      }),
      keepalive: true,
    }).catch(() => {});
  }, [pathname]);

  return null;
}
