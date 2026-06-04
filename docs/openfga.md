# OpenFGA integration

Fine-grained blog access is enforced server-side via OpenFGA. Keycloak still handles authentication and coarse roles (`demo-user`, `demo-admin`).

## Authorization model

See [`fga/model.fga`](../fga/model.fga). Each blog is `blog:{id}` with relations:

| Relation | Meaning |
|----------|---------|
| `owner` | Creator (written on blog create) |
| `viewer` | Can view private posts |
| `editor` | Can view and edit |
| `admin` | Can view, edit, and manage sharing |

Computed permissions: `can_view`, `can_edit`, `can_delete`, `can_share`.

**Decision order** (in `lib/blog/access.ts`):

1. `public` visibility → allow view
2. Keycloak `demo-admin` → allow (app override)
3. SQLite `ownerKey` match → allow owner operations
4. OpenFGA check → authoritative for shared access
5. Otherwise deny

## Local setup

```bash
docker compose up -d
npm run openfga:bootstrap
```

Bootstrap creates a store, uploads the model, backfills `owner` tuples for existing blogs, and appends `OPENFGA_*` vars to `.env.local`.

Restart the Next.js dev server after bootstrap.

## Sharing a private post

1. Sign in as the owner (e.g. `demo.user`).
2. Create a **private** blog.
3. Open **Edit** → **Share access**.
4. Enter another user's Keycloak **username** (e.g. `admin.user`) and choose Viewer / Editor / Admin.
5. Sign in as that user — the post appears on `/blog` and is viewable at `/blog/[slug]`.

User ids in OpenFGA match `getSessionPrincipal()` (`username`, else `email`, else `sub`).

## Code layout

| Path | Role |
|------|------|
| `lib/openfga.ts` | SDK client |
| `lib/authz/can.ts` | `can(user, relation, object)` |
| `lib/authz/blog.ts` | Blog tuples, grants, collaborators |
| `actions/blog/share-blog.ts` | Server actions for share UI |
