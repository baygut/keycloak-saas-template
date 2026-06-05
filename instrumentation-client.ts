performance.mark("app-init");

declare global {
  interface Window {
    __navStart?: { url: string; time: number; type: string };
  }
}

export function onRouterTransitionStart(
  url: string,
  navigationType: "push" | "replace" | "traverse",
) {
  window.__navStart = { url, time: performance.now(), type: navigationType };
}
