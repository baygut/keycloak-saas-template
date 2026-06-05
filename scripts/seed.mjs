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
