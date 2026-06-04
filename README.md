# Keycloak SaaS Template

Next.js 16 app with Keycloak OIDC, centralized RBAC, Prisma SQLite, and server actions.

## Getting Started

```bash
cp .env.example .env.local
npm install
npm run db:push
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Keycloak Demo

Local realm: [`keycloak/realm-demo.json`](keycloak/realm-demo.json)

| Account | Password | Roles |
|---------|----------|-------|
| `demo.user` | `Demo1234!` | `demo-user` |
| `admin.user` | `Admin1234!` | `demo-user`, `demo-admin` |

Client: `my-nextjs-client` in realm `myrealm`.

## Architecture

### Protected resources (`lib/auth/resources.ts`)

| Resource ID | Routes | Server guard | Client `RoleGuard` |
|-------------|--------|--------------|-------------------|
| `user_restricted` | `/dashboard/profile`, `/blog`, `/blog/new`, edit own posts | `requireUserResourceAccess()` | Header profile, “New blog”, blog form public option (admin only) |
| `admin_restricted` | `/dashboard/logs`, `/dashboard/blogs`, `/dashboard/users` | `requireRole(ROLES.ADMIN)` | Header admin links, sidebar admin section |

Access denials render [`ForbiddenPanel`](components/dashboard/forbidden-panel.tsx) inline or redirect to `/forbidden`. Denials are logged under the `access` logger prefix and appear in **System logs** for admins.

### Roles (`lib/auth/constants.ts`)

All role strings live in one place. Server guards, server actions, and client `RoleGuard` import `ROLES` from there — never hardcode role names.

### Auth flow

- **Route handlers (OAuth only):** `/api/keycloak/login`, `register`, `callback`
- **Server actions:** `signOutAction`, blog CRUD, optional `getSessionAction`
- **Server session:** `getSession()`, `requireSession()`, `requireRole()` in `lib/auth/server.ts`
- **Client:** Zustand store + `useAuth()` hydrated from root layout (no `/api/auth/me` fetch on load)
- **Edge proxy:** [`proxy.ts`](proxy.ts) protects `/dashboard`, `/blog`, `/blog/new`, `/blog/:slug/edit`

### Blogs (Prisma)

Single SQLite DB (`data/app.sqlite`) for logs and blogs.

| Visibility | Who can view `/blog/[slug]` |
|------------|----------------------------|
| `public` | Anyone (no login) |
| `private` | Owner, users granted access via OpenFGA, or `demo-admin` |

**OpenFGA:** Private posts support per-user **viewer / editor / admin** sharing from the edit page. See [`docs/openfga.md`](docs/openfga.md). Run `docker compose up -d` and `npm run openfga:bootstrap` before using sharing.

Admins see all blogs on `/blog` with visibility badges. Public slugs are pre-rendered at build via `generateStaticParams`.

### Admin user management

`/dashboard/users` (admin only) redirects to the Keycloak Admin Console users page for the configured realm.

### Logger

```ts
import logger from "@/lib/logger";
const log = logger.child("my-module");
log.info("message", { meta });
```

Console output only in development; all levels persist to `LogEvent` via Prisma.

### SSR / CSR

- Landing page: `force-static`
- Dashboard: server-fetched user/admin data; admin panel lazy-loaded with `next/dynamic` (`ssr: false`)
- Blog detail: server access check; public posts in `generateStaticParams`

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Dev server |
| `npm run build` | Prisma generate + production build |
| `npm run db:push` | Apply Prisma schema |
| `npm run db:studio` | Prisma Studio |
| `npm run openfga:bootstrap` | Create OpenFGA store, model, and backfill owner tuples |

## Assignment mapping

See [`docs/task.md`](docs/task.md) for the full brief. This template covers Keycloak auth, BFF/server-side authorization, `admin_restricted` / `user_restricted` dashboard resources, structured logging, and SSR optimizations.
