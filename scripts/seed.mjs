/**
 * Seeds the SQLite database with demo Blog rows matching the Keycloak demo users.
 * Idempotent: skips rows whose slug already exists.
 *
 * Usage: node scripts/seed.mjs
 */
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
import { mkdirSync } from "node:fs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");
const require = createRequire(import.meta.url);

const { PrismaClient } = require("@prisma/client");

// Prisma CLI resolves relative SQLite paths from prisma/ (schema dir).
// Match that convention so db:push and this script always share the same file.
const prismaDir = resolve(root, "prisma");

const databaseUrl =
  process.env.DATABASE_URL ?? `file:${resolve(prismaDir, "data/app.sqlite")}`;

const rawPath = databaseUrl.startsWith("file:")
  ? databaseUrl.slice("file:".length)
  : null;
if (rawPath) {
  const absPath = rawPath.startsWith("/") ? rawPath : resolve(prismaDir, rawPath);
  mkdirSync(dirname(absPath), { recursive: true });
}

const prisma = new PrismaClient({ datasources: { db: { url: databaseUrl } } });

const SEED_BLOGS = [
  {
    slug: "welcome",
    title: "keycloak-saas-template",
    summary:
      "A Next.js starter that wires up Keycloak, OpenFGA, and SQLite into a working multi-user SaaS skeleton — with a demo blog platform to show the patterns in action.",
    content: `# keycloak-saas-template

A Next.js starter that wires up Keycloak (authentication), OpenFGA (fine-grained authorization), and SQLite (app data) into a working multi-user SaaS skeleton — with a demo blog platform to show the patterns in action.

## Prerequisites

- Node.js 20+
- Docker (running)

## First run

\`\`\`bash
chmod +x start.sh
./start.sh
\`\`\`

That's it. The script will:

1. Run \`npm install\` if \`node_modules\` is absent
2. Start Keycloak, Postgres, and OpenFGA via Docker Compose
3. Wait for each service to be healthy
4. Create \`.env.local\` with default values
5. Push the Prisma schema to SQLite (\`prisma/data/app.sqlite\`)
6. Seed demo blog posts
7. Bootstrap the OpenFGA store and authorization model, and write the generated IDs back to \`.env.local\`
8. Start \`next dev\` and wait for it to be ready

## Demo accounts (password: \`123123\`)

| Username | Role |
|----------|------|
| \`demo.user\` | Regular user |
| \`demo.user2\` | Regular user |
| \`keymate\` | Regular user |
| \`baygut\` | Regular user |
| \`admin.user\` | Admin — full dashboard access |

## Key concepts

**Authentication** is handled by Keycloak over OIDC. The app exchanges the authorization code for tokens, stores the session in an encrypted cookie, and refreshes it transparently.

**Authorization** is split into two layers:
- *Role-based*: Keycloak realm roles (\`admin\` vs regular user) gate dashboard access.
- *Resource-based*: OpenFGA tracks per-blog relationships (\`owner\`, \`editor\`, \`viewer\`, \`admin\`) and answers \`can(user, relation, resource)\` checks for every read and write.

**Temporary access**: owners can grant time-limited access to a blog without permanently changing OpenFGA tuples — stored in the \`TemporaryAccess\` table and merged at check time.

**Observability**: structured logs are written to the \`LogEvent\` table and shown in the admin log viewer; OpenTelemetry spans are stored in \`OtelSpan\` and surfaced in the analytics dashboard.`,
    visibility: "public",
    ownerKey: "admin.user",
    ownerName: "Admin User",
  },
  {
    slug: "ssr-csr-optimization",
    title: "SSR / CSR Optimization",
    summary:
      "How the app uses the Next.js App Router to keep rendering on the server by default, where client components live and why, and how route transition timing is measured without any third-party SDK.",
    content: `# SSR / CSR Optimization

I use the Next.js App Router, where every component is a React Server Component by default. This means the HTML is generated on the server before it reaches the browser. Components only opt into client-side rendering when they actually need it — things like interactivity, browser APIs, or reactive state — by adding \`"use client"\` at the top of the file.

## What runs on the server

I keep as much as possible on the server. The session cookie is read and decoded in the root layout so the user is available to every page without a client-side fetch. Blog records, access checks, and analytics writes all happen before the HTML leaves the server. Dashboard pages do their auth checks and data queries in Server Components so the browser receives ready-to-display HTML.

The middleware (\`proxy.ts\`) also runs on the server — at the edge, before any page component even starts rendering. It validates the session, enforces route guards, and refreshes tokens transparently.

| Layer | What happens server-side |
|-------|--------------------------|
| Root layout | Session decoded once, passed down as a prop |
| Blog pages | Data fetch, access check, analytics write |
| Dashboard pages | Auth guard, data query |
| \`proxy.ts\` | Session validation, role check, token refresh |

## What runs on the client

I try to keep client components narrow. Each one has a specific reason to be on the client.

| Component | Why it needs the client |
|-----------|------------------------|
| \`AuthProvider\` / \`AuthRefresher\` | Holds reactive session state in a Zustand store |
| \`RouteTransitionTracker\` | Listens to \`usePathname()\` to measure navigation duration |
| \`ErrorBoundary\` | React class component — \`componentDidCatch\` is a client-only API |
| \`SidebarProvider\` | Manages open/collapsed state and keyboard shortcuts |
| Blog share panel | Form interactions for granting and revoking access |

## Static generation

For public blog posts I use \`generateStaticParams\` so they are pre-rendered at build time as static HTML. Private blogs are excluded from this — they always render dynamically so the access check can run on every request.

\`\`\`ts
// app/blog/[slug]/page.tsx
export async function generateStaticParams() {
  const publicBlogs = await prisma.blog.findMany({
    where: { visibility: "public" },
    select: { slug: true },
  });
  return publicBlogs.map((blog) => ({ slug: blog.slug }));
}
\`\`\`

## Route transition performance

I also implement basic performance monitoring for client-side navigation without any third-party SDK. \`instrumentation-client.ts\` stamps \`window.__navStart\` with a \`performance.now()\` timestamp at the start of every router transition. When \`RouteTransitionTracker\` detects that the pathname changed, it reads that timestamp, computes the elapsed milliseconds, and fires a non-blocking POST to the analytics endpoint. This way I get real navigation timing data that shows up in the dashboard.

## Fonts

I load fonts through \`next/font/google\` (Geist Sans and Geist Mono). Next.js automatically subsets, self-hosts, and inlines the font CSS so there is no external font request at runtime.`,
    visibility: "public",
    ownerKey: "admin.user",
    ownerName: "Admin User",
  },
  {
    slug: "keycloak-auth-model",
    title: "Keycloak Authentication & Authorization Model",
    summary:
      "The OIDC Authorization Code flow, how tokens are stored in httpOnly cookies, proactive refresh, the two-layer role enforcement model, and how Keycloak and OpenFGA divide responsibility.",
    content: `# Keycloak Authentication & Authorization Model

## Authentication flow

I use the OIDC Authorization Code flow with Keycloak as the identity provider. The client is configured as a public client so there is no client secret to manage.

The flow works like this: when a user tries to access a protected route, they get redirected to Keycloak's login page. After they log in, Keycloak redirects back to the app with a short-lived authorization code. The callback handler exchanges that code for tokens on the server side and stores them in httpOnly cookies.

I also find a nice way to avoid manual Keycloak setup for every developer. I put the realm configuration — the realm, client, users, and roles — in a JSON file (\`keycloak/realm-demo.json\`) and Keycloak imports it automatically on startup. This way a fresh \`docker compose up\` gives you a fully configured Keycloak without touching the admin console.

## Token storage

I decide to store all tokens in httpOnly cookies. This way tokens are never accessible to JavaScript running in the browser, which eliminates a whole class of XSS token-theft attacks.

| Cookie | Content | Purpose |
|--------|---------|---------|
| \`session_token\` | \`{ name, sub, email, username, roles }\` | What the app reads on every request |
| \`access_token\` | Raw Keycloak access JWT | BFF use only |
| \`refresh_token\` | Raw Keycloak refresh token | Token rotation |
| \`kc_id_token\` | OIDC id_token | Needed for Keycloak logout |
| \`access_token_exp\` | Unix timestamp | Used by proxy to decide when to refresh |

Page code only ever reads the \`session_token\` cookie. The raw access token stays on the server side.

## Session handling

I create a \`getSession()\` function that reads and parses the session cookie. On top of that I build \`requireSession()\`, \`requireRole()\`, and \`requireUserResourceAccess()\` that redirect or show a forbidden state if the check fails. I call these inside Server Actions and Server Components as a second enforcement layer, independent of the middleware.

Roles are extracted from the \`realm_access.roles\` claim in the access token and stored directly in the session cookie. This way I can check roles on every request without decoding the JWT again.

## Token refresh

I also implement proactive token refresh in the proxy middleware. If the access token is going to expire within 30 seconds, the middleware calls Keycloak's token endpoint with the refresh token, rotates all the cookies on the response, and lets the request continue. The user never notices. If the refresh fails — for example because the refresh token has expired — the middleware redirects to login.

## CSRF protection

Before redirecting to Keycloak I generate a random \`state\` and \`nonce\`, store them in short-lived httpOnly cookies, and include them in the authorization URL. The callback validates both values before doing anything with the code.

## Role-based authorization

I implement two resource tiers and enforce them at two independent layers.

**Admin-restricted resources** are the dashboard pages for logs, analytics, blogs management, and user management. Only users with the \`admin\` role can access these.

**User-restricted resources** are the profile page, personal blog management, and the blog write operations. Users with either \`user\` or \`admin\` role can access these.

### Layer 1 — Middleware

The middleware runs at the edge before any page renders and reads the session cookie directly from the request.

| Route | Required role |
|-------|--------------|
| \`/dashboard/logs\`, \`/dashboard/blogs\`, \`/dashboard/analytics\`, \`/dashboard/users\` | \`admin\` |
| \`/dashboard/profile\`, \`/dashboard/my-blogs\`, \`/blog/new\`, \`/blog/:slug/edit\` | \`user\` or \`admin\` |

Users without the required role are redirected to \`/forbidden\`.

### Layer 2 — Server-side guards

I also add server-side guards in every Server Action and protected Server Component. This way even if the middleware is bypassed or a new route is added without updating the matcher, the authorization decision is still enforced at the application layer.

## Fine-grained authorization with OpenFGA

Keycloak handles who you are and which tier of resource you can access. OpenFGA handles which specific resource you can access.

When I finish the role-based layer I start to work on resource-level authorization using OpenFGA. I define a blog authorization model with four relations — \`owner\`, \`admin\`, \`editor\`, and \`viewer\` — and computed permissions (\`can_view\`, \`can_edit\`, \`can_delete\`, \`can_share\`) that are derived automatically from the relations.

When a blog is created, the creator gets an \`owner\` tuple in OpenFGA. Owners can share their blog with other users at any relation level. When access is revoked, all tuples for that user on that blog are deleted atomically.

I also implement temporary access for private blogs. When an owner shares with an expiry date, the expiry is stored in the \`TemporaryAccess\` SQLite table alongside the OpenFGA tuple. At check time, if the record has expired, the tuple is immediately revoked and access is denied — no cron job needed.

## Logout

Logout calls the OIDC end-session endpoint on Keycloak with the \`id_token_hint\` so Keycloak terminates the session on its side too. Then all local cookies are cleared and the user lands on the \`/signed-out\` page.`,
    visibility: "public",
    ownerKey: "admin.user",
    ownerName: "Admin User",
  },
  {
    slug: "observability-and-error-handling",
    title: "Observability & Error Handling",
    summary:
      "How structured logs, analytics events, OpenTelemetry spans, and error boundaries are wired together — and why all of it is stored in SQLite instead of external services.",
    content: `# Observability & Error Handling

## Structured logging

I create a custom \`Logger\` class that is instantiated once as a global singleton and shared across the entire Node.js process. Every module gets a namespaced child logger via \`logger.child("prefix")\` so it is always clear where a log entry comes from.

### Log levels and transport

I implement a transport system so logs can go to multiple destinations. In development, logs are printed to the console. The level threshold is controlled by the \`CONSOLE_LOG_LEVEL\` environment variable and defaults to \`info\`. In production, console output is suppressed entirely.

The main transport writes every log entry to the \`LogEvent\` SQLite table. I make the transport fire-and-forget — if the database write fails, the error is swallowed so logging never breaks the request path.

This way structured log data with full metadata is always available in the admin dashboard, regardless of what is happening with the console.

| Prefix | What it covers |
|--------|---------------|
| \`proxy\` | Token refresh, route guard decisions |
| \`authz\` | OpenFGA check failures, write errors |
| \`authz-blog\` | FGA tuple operations — grant, revoke, read |
| \`auth\` | Logout errors, session issues |
| \`app/error\` | Client-side errors from the error boundary |

## Analytics

I create a \`persistAnalyticsEvent()\` function that records events to the \`AnalyticsEvent\` table. I wrap the database call in a try/catch that swallows all errors — analytics must never break the app or slow down a request.

| Event | When it fires |
|-------|--------------|
| \`page_view\` | Every blog detail page load, server-side |
| \`route_transition\` | Every client-side navigation, measured in the browser |

## Route transition timing

For route transition monitoring I implement a lightweight solution without any external SDK. \`instrumentation-client.ts\` stamps \`window.__navStart\` with a \`performance.now()\` timestamp at the start of every router navigation. When the \`RouteTransitionTracker\` component detects a path change, it reads the timestamp, computes the elapsed milliseconds, and fires a non-blocking POST to the analytics endpoint with \`keepalive: true\` so the request completes even if the user navigates away immediately.

This way real end-to-end navigation timing shows up in the admin analytics page.

## OpenTelemetry

I also set up OpenTelemetry for better performance insights. I initialize the OTel Node.js SDK in \`instrumentation.node.ts\` which Next.js loads automatically before the app starts.

Instead of sending spans to an external collector, I create a \`PrismaSpanExporter\` that implements the OTel \`SpanExporter\` interface and writes completed spans to the \`OtelSpan\` SQLite table. This way span data is visible in the admin dashboard without needing any additional infrastructure. For a real production setup this exporter would be replaced with the standard OTLP exporter.

I also expose a \`withSpan()\` helper in \`lib/telemetry.ts\` for wrapping async operations in a named span, and \`getTracer()\` for manual instrumentation where needed.

## Error boundaries

I add error boundaries at two levels.

The \`ErrorBoundary\` class component catches rendering errors anywhere in its subtree. When an error is caught, it shows a fallback UI and calls the \`logClientError\` Server Action which writes the error message and component stack to the \`LogEvent\` table. This way client-side rendering errors show up in the server-side log viewer immediately.

For catastrophic errors that escape the root layout, I use \`app/global-error.tsx\` as a last-resort boundary. It renders a minimal recovery UI with a "Try again" button.

## Authentication and authorization errors

For authentication errors I keep it simple. If the session cookie is missing or invalid, \`requireSession()\` redirects to login. If the user has the wrong role, \`requireRole()\` and \`requireUserResourceAccess()\` redirect to the \`/forbidden\` page with context about what was required and what the user actually has.

For OpenFGA errors I decide to fail safe. If an FGA check throws for any reason — network timeout, service down — \`can()\` catches the error, logs it, and returns \`false\`. \`listObjectIds()\` does the same and returns an empty array. This way an OpenFGA outage means "deny everything" rather than crashing the app. The error is still visible in the log dashboard so it is easy to diagnose.`,
    visibility: "public",
    ownerKey: "admin.user",
    ownerName: "Admin User",
  },
  {
    slug: "assumptions-and-trade-offs",
    title: "Assumptions & Trade-offs",
    summary:
      "The decisions I make during the build — SQLite over Postgres, stateless cookies, public Keycloak client, no JWT signature verification — and the honest trade-offs behind each one.",
    content: `# Assumptions & Trade-offs

## SQLite for application data

I decide to use SQLite for blogs, logs, analytics, and OTel spans. SQLite requires zero extra infrastructure — it is just a file on disk. This way the local setup stays simple: \`docker compose up\` only needs to run Keycloak, Postgres (for OpenFGA), and OpenFGA itself.

The trade-off is that SQLite does not handle concurrent write load well and has no connection pooling. For a real production deployment this would be switched to Postgres. The Prisma schema is database-agnostic so changing the provider is a one-line edit in \`schema.prisma\`.

## Postgres only for OpenFGA

I run Postgres in the stack exclusively because OpenFGA requires a relational backend and does not support SQLite. Rather than running two separate Postgres instances, the app reuses the same Postgres container for OpenFGA's own data while keeping the application data in SQLite.

## Public Keycloak client

I configure the Keycloak client as a public client with no client secret. For a demo and template this is a reasonable default — it keeps setup simple and there is no secret to manage. The Authorization Code flow is still used so tokens are never exposed in the URL.

For a real production deployment, switching to a confidential client with a rotated secret is the recommended approach as it gives an extra layer of verification at the token endpoint.

## JWT decoded without signature verification

I decode JWT payloads by splitting on \`.\` and base64-decoding the middle segment. I do not verify the signature on every request.

I find this acceptable in the BFF pattern because the tokens are received directly from Keycloak over a server-to-server call during the code exchange — Keycloak already verified them. Verifying the signature on every request would require fetching and caching Keycloak's JWKS endpoint, which adds complexity without meaningful security gain in this setup.

For a production setup with stricter requirements, JWKS-based verification is the right approach.

## Stateless session cookies

I decide not to use a server-side session store like Redis. The session is a self-contained httpOnly JSON cookie with the user's name, sub, email, and roles.

The trade-off is that sessions cannot be force-invalidated server-side. If an admin revokes a user's role in Keycloak, the user's session cookie stays valid until the refresh token expires. For use cases that need immediate revocation, a server-side session store with a blocklist would be necessary.

## OpenFGA degrades gracefully when not configured

I check \`isOpenFgaConfigured()\` before every FGA call. If the store ID is not set in the environment, all permission checks fall back to owner-only access and no error is thrown. This allows the app to run in a reduced mode if the bootstrap step is skipped or OpenFGA is temporarily unavailable.

The trade-off is that if OpenFGA is misconfigured — store ID is set but points to a wrong store — the FGA calls will fail silently and deny access without giving the user any useful error message. The error is logged, so it is visible in the dashboard, but the user just sees a generic access denied.

## Temporary access stored in two places

I implement temporary access using both OpenFGA tuples and a \`TemporaryAccess\` table in SQLite. OpenFGA holds the permission itself. SQLite holds the expiry metadata.

I decide to do it this way because OpenFGA tuples have no native expiry. Rather than running a background job to clean up expired tuples, I check the expiry at access time — if the record has expired, I revoke the FGA tuple immediately and deny access. This is lazy eviction, so no cron job is needed.

The trade-off is that the two stores need to stay in sync. If the SQLite record is lost but the FGA tuple remains, access would be incorrectly granted. Between expiry and the next access attempt, the tuple technically still exists in FGA even though the app denies access.

## Analytics are fire-and-forget

I decide that analytics events should never be on the critical path of a request. \`persistAnalyticsEvent()\` wraps the database write in a try/catch that swallows all errors. A failed analytics write is much better than a broken page load.

The trade-off is that analytics data can be silently lost if the database is unavailable. There is no retry queue or dead letter store.

## OTel spans stored in SQLite

I store OpenTelemetry spans in the \`OtelSpan\` SQLite table instead of sending them to a real collector. This makes span data visible in the admin dashboard without needing any additional infrastructure, which fits the goal of keeping the local setup simple.

For a production setup this exporter would be replaced with the standard OTLP exporter pointed at Jaeger, Tempo, or any compatible backend. SQLite is not designed for high-volume append workloads from a span exporter.`,
    visibility: "public",
    ownerKey: "admin.user",
    ownerName: "Admin User",
  },
  {
    slug: "getting-started-with-keycloak",
    title: "Getting Started with Keycloak",
    summary:
      "A step-by-step guide to setting up Keycloak as an identity provider for your Next.js application.",
    content: `Keycloak is an open-source Identity and Access Management solution. In this post we walk through spinning up a local Keycloak instance, creating a realm, registering a client, and wiring it up to a Next.js 16 app using the Authorization Code flow.

## Prerequisites
- Docker and Docker Compose
- Node.js 20+
- A basic understanding of OAuth 2.0 / OIDC

## Step 1 — Start Keycloak
Run \`docker compose up -d\` from the project root. Keycloak will start on port 8080 and automatically import the demo realm from \`keycloak/realm-demo.json\`.

## Step 2 — Explore the Admin Console
Navigate to http://localhost:8080/admin (admin / admin) and switch to the \`myrealm\` realm to inspect the pre-configured client and demo users.

## Step 3 — Sign In
Start the Next.js app and click "Sign in". You'll be redirected to Keycloak's login page. Use any of the demo credentials — for example \`demo.user / 123123\`.

That's it — you now have a fully working OIDC flow running locally.`,
    visibility: "public",
    ownerKey: "demo.user",
    ownerName: "Demo User",
  },
  {
    slug: "fine-grained-authz-with-openfga",
    title: "Fine-Grained Authorization with OpenFGA",
    summary:
      "How this template uses OpenFGA to enforce per-resource ownership and viewer relationships beyond simple role checks.",
    content: `Role-based access control (RBAC) is great for coarse-grained decisions — "is this user an admin?" But for resource-level rules like "can user A edit blog B?" you need relationship-based access control (ReBAC).

## The model
This project ships with an OpenFGA authorization model that defines a \`blog\` type with four relations: \`owner\`, \`editor\`, \`viewer\`, and \`admin\`. Computed relations (\`can_view\`, \`can_edit\`, \`can_delete\`) are derived automatically.

## Bootstrap
Running \`npm run openfga:bootstrap\` (or \`start.sh\`) will:
1. Create an OpenFGA store and upload the model.
2. Backfill owner tuples for every existing blog.
3. Append the generated env vars to \`.env.local\`.

## Runtime checks
Every blog action calls \`fga.check()\` with the current user's principal. The answer is a simple boolean — no custom SQL needed.`,
    visibility: "public",
    ownerKey: "demo.user",
    ownerName: "Demo User",
  },
  {
    slug: "my-private-draft",
    title: "My Private Draft",
    summary: "This is a private draft only visible to the owner.",
    content: `This post is set to \`private\` visibility. Only the owner (demo.user) or users with an explicit \`viewer\` tuple in OpenFGA can see it.

If you're reading this while signed in as demo.user — welcome! Try signing out and navigating directly to this URL; you'll see an access-denied panel instead.

Private posts are a good demonstration of the dual-layer authorization in this template: the Keycloak role check ensures you're authenticated, and the OpenFGA relationship check ensures you have a specific relationship with this resource.`,
    visibility: "private",
    ownerKey: "demo.user",
    ownerName: "Demo User",
  },
  {
    slug: "admin-guide-to-the-dashboard",
    title: "Admin Guide to the Dashboard",
    summary:
      "An overview of the admin-only dashboard features: system logs, analytics, and user management.",
    content: `Users with the \`admin\` role get access to extra sections in the dashboard sidebar.

## System Logs
The Logs page streams structured log events written by the server-side logger. Every error, warning, and info message is persisted to SQLite via the \`LogEvent\` model and displayed with level badges, timestamps, and metadata.

## Analytics
The Analytics page aggregates page view events, top blogs by traffic, daily view trends, and route transition latency. All data is collected non-blocking via \`persistAnalyticsEvent()\` and never breaks the request path.

## OpenTelemetry Spans
The OTel Spans section shows recent Prisma query spans exported by the custom \`PrismaSpanExporter\`. This gives you a lightweight in-process tracing view without needing an external collector.

Sign in as \`admin.user / 123123\` to explore these features.`,
    visibility: "public",
    ownerKey: "admin.user",
    ownerName: "Admin User",
  },
  {
    slug: "keycloak-saas-architecture",
    title: "Keycloak SaaS Template Architecture",
    summary:
      "How the proxy middleware, BFF pattern, and httpOnly cookies work together to keep tokens off the client.",
    content: `This template follows the Backend-for-Frontend (BFF) pattern for token management.

## Token storage
Access tokens and refresh tokens are stored in httpOnly cookies. They are never exposed to JavaScript running in the browser, which eliminates a whole class of XSS token-theft attacks.

## Proxy middleware
\`proxy.ts\` runs as Next.js middleware on every protected route. It reads the access token from the cookie, validates expiry, and transparently refreshes it using the stored refresh token if needed — all before the page component renders.

## Protected routes
Routes are declared in the middleware matcher. The proxy enforces authentication for \`/dashboard/**\`, \`/blog/*/edit\`, \`/blog/*/analytics\`, and the blog API actions.

## Session
The session is a lightweight decoded JWT payload cached in a React context. Server Components read it via \`getSession()\` which decodes the httpOnly cookie without a round-trip to Keycloak.`,
    visibility: "public",
    ownerKey: "admin.user",
    ownerName: "Admin User",
  },
];

async function main() {
  console.log("Seeding database...");
  console.log(`DATABASE_URL: ${databaseUrl}`);

  let created = 0;
  let skipped = 0;

  for (const blog of SEED_BLOGS) {
    const existing = await prisma.blog.findUnique({ where: { slug: blog.slug } });
    if (existing) {
      console.log(`  skip  ${blog.slug} (already exists)`);
      skipped++;
      continue;
    }

    await prisma.blog.create({ data: blog });
    console.log(`  create ${blog.slug}`);
    created++;
  }

  await prisma.$disconnect();
  console.log(`\nDone. Created ${created} blog(s), skipped ${skipped}.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
