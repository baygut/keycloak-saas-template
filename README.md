# keycloak-saas-template

A Next.js starter that wires up Keycloak (authentication), OpenFGA (fine-grained authorization), and SQLite (app data) into a working multi-user SaaS skeleton — with a demo blog platform to show the patterns in action.

## Prerequisites

- Node.js 20+
- Docker (running)

## First run

```bash
chmod +x start.sh
./start.sh
```

That's it. The script will:

1. Run `npm install` if `node_modules` is absent
2. Start Keycloak, Postgres, and OpenFGA via Docker Compose
3. Wait for each service to be healthy
4. Create `.env.local` with default values
5. Push the Prisma schema to SQLite (`prisma/data/app.sqlite`)
6. Seed demo blog posts
7. Bootstrap the OpenFGA store and authorization model, and write the generated IDs back to `.env.local`
8. Start `next dev` and wait for it to be ready

When done:

| URL | Credentials |
|-----|-------------|
| App | http://localhost:3000 |
| Keycloak admin | http://localhost:8080 — `admin` / `admin` |
| OpenFGA | http://localhost:8081 |

### Demo accounts (password: `123123`)

| Username | Role |
|----------|------|
| `demo.user` | Regular user |
| `demo.user2` | Regular user |
| `keymate` | Regular user |
| `baygut` | Regular user |
| `admin.user` | Admin — full dashboard access |

## Project structure

```
app/                  Next.js App Router pages
  blog/               Public blog listing and individual posts
  dashboard/          Admin-only dashboard (analytics, logs, users, all blogs)
  api/                Route handlers (auth callbacks, analytics events, Keycloak proxy)

components/
  ui/                 shadcn/ui primitives
  auth/               Auth provider, role guard, resource badge
  blog/               Blog-specific components (share panel, analytics, visibility)
  dashboard/          Dashboard panels and skeletons
  core/               Header, footer, error boundary, route tracker

lib/
  auth/               Session handling, permissions, Keycloak OIDC integration
  authz/              OpenFGA wrappers — can(), writeTuples(), listObjects()
  blog/               Blog repository, access rules, slug generation
  analytics/          Analytics event recording
  keycloak/           Keycloak Admin REST API client
  telemetry/          OpenTelemetry setup and Prisma span exporter
  prisma.ts           Prisma client singleton (resolves SQLite path consistently)
  openfga.ts          OpenFGA client singleton

actions/              Next.js Server Actions (create/update/delete blog, auth, share)
hooks/                React hooks (useAuth, useMobile)
stores/               Zustand client store (auth state)
types/                Shared TypeScript types

prisma/
  schema.prisma       DB schema (Blog, LogEvent, AnalyticsEvent, TemporaryAccess, OtelSpan)
  migrations/         Migration history
  data/               SQLite database file (gitignored)

fga/
  model.fga           OpenFGA authorization model source

keycloak/
  realm-demo.json     Keycloak realm export (pre-loaded on first boot)

scripts/
  seed.mjs            Idempotent demo data seeder
  openfga-bootstrap.mjs  Creates the FGA store, uploads the model, backfills owner tuples

docker-compose.yml    Keycloak + Postgres + OpenFGA (+ migration job)
start.sh              Single-command bootstrap for local development
```

## Key concepts

**Authentication** is handled by Keycloak over OIDC. The app exchanges the authorization code for tokens, stores the session in an encrypted cookie, and refreshes it transparently.

**Authorization** is split into two layers:
- *Role-based*: Keycloak realm roles (`admin` vs regular user) gate dashboard access.
- *Resource-based*: OpenFGA tracks per-blog relationships (`owner`, `editor`, `viewer`, `admin`) and answers `can(user, relation, resource)` checks for every read and write.

**Temporary access**: owners can grant time-limited access to a blog without permanently changing OpenFGA tuples — stored in the `TemporaryAccess` table and merged at check time.

**Observability**: structured logs are written to the `LogEvent` table and shown in the admin log viewer; OpenTelemetry spans are stored in `OtelSpan` and surfaced in the analytics dashboard.
