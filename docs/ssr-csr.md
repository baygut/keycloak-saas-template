# SSR / CSR Optimization

I use the Next.js App Router, where every component is a React Server Component by default. This means the HTML is generated on the server before it reaches the browser. Components only opt into client-side rendering when they actually need it — things like interactivity, browser APIs, or reactive state — by adding `"use client"` at the top of the file.

## What runs on the server

I keep as much as possible on the server. The session cookie is read and decoded in the root layout so the user is available to every page without a client-side fetch. Blog records, access checks, and analytics writes all happen before the HTML leaves the server. Dashboard pages do their auth checks and data queries in Server Components so the browser receives ready-to-display HTML.

The middleware (`proxy.ts`) also runs on the server — at the edge, before any page component even starts rendering. It validates the session, enforces route guards, and refreshes tokens transparently.

| Layer | What happens server-side |
|-------|--------------------------|
| Root layout | Session decoded once, passed down as a prop |
| Blog pages | Data fetch, access check, analytics write |
| Dashboard pages | Auth guard, data query |
| `proxy.ts` | Session validation, role check, token refresh |

## What runs on the client

I try to keep client components narrow. Each one has a specific reason to be on the client.

| Component | Why it needs the client |
|-----------|------------------------|
| `AuthProvider` / `AuthRefresher` | Holds reactive session state in a Zustand store |
| `RouteTransitionTracker` | Listens to `usePathname()` to measure navigation duration |
| `ErrorBoundary` | React class component — `componentDidCatch` is a client-only API |
| `SidebarProvider` | Manages open/collapsed state and keyboard shortcuts |
| Blog share panel | Form interactions for granting and revoking access |

## Static generation

For public blog posts I use `generateStaticParams` so they are pre-rendered at build time as static HTML. Private blogs are excluded from this — they always render dynamically so the access check can run on every request.

```ts
// app/blog/[slug]/page.tsx
export async function generateStaticParams() {
  const publicBlogs = await prisma.blog.findMany({
    where: { visibility: "public" },
    select: { slug: true },
  });
  return publicBlogs.map((blog) => ({ slug: blog.slug }));
}
```

## Route transition performance

I also implement basic performance monitoring for client-side navigation without any third-party SDK. `instrumentation-client.ts` stamps `window.__navStart` with a `performance.now()` timestamp at the start of every router transition. When `RouteTransitionTracker` detects that the pathname changed, it reads that timestamp, computes the elapsed milliseconds, and fires a non-blocking POST to the analytics endpoint. This way I get real navigation timing data that shows up in the dashboard.

## Fonts

I load fonts through `next/font/google` (Geist Sans and Geist Mono). Next.js automatically subsets, self-hosts, and inlines the font CSS so there is no external font request at runtime.
