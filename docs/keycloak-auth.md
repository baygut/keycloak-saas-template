# Keycloak Authentication & Authorization Model

## Authentication flow

I use the OIDC Authorization Code flow with Keycloak as the identity provider. The client is configured as a public client so there is no client secret to manage.

The flow works like this: when a user tries to access a protected route, they get redirected to Keycloak's login page. After they log in, Keycloak redirects back to the app with a short-lived authorization code. The callback handler exchanges that code for tokens on the server side and stores them in httpOnly cookies.

I also find a nice way to avoid manual Keycloak setup for every developer. I put the realm configuration — the realm, client, users, and roles — in a JSON file (`keycloak/realm-demo.json`) and Keycloak imports it automatically on startup. This way a fresh `docker compose up` gives you a fully configured Keycloak without touching the admin console.

## Token storage

I decide to store all tokens in httpOnly cookies. This way tokens are never accessible to JavaScript running in the browser, which eliminates a whole class of XSS token-theft attacks.

| Cookie | Content | Purpose |
|--------|---------|---------|
| `session_token` | `{ name, sub, email, username, roles }` | What the app reads on every request |
| `access_token` | Raw Keycloak access JWT | BFF use only |
| `refresh_token` | Raw Keycloak refresh token | Token rotation |
| `kc_id_token` | OIDC id_token | Needed for Keycloak logout |
| `access_token_exp` | Unix timestamp | Used by proxy to decide when to refresh |

Page code only ever reads the `session_token` cookie. The raw access token stays on the server side.

## Session handling

I create a `getSession()` function that reads and parses the session cookie. On top of that I build `requireSession()`, `requireRole()`, and `requireUserResourceAccess()` that redirect or show a forbidden state if the check fails. I call these inside Server Actions and Server Components as a second enforcement layer, independent of the middleware.

Roles are extracted from the `realm_access.roles` claim in the access token and stored directly in the session cookie. This way I can check roles on every request without decoding the JWT again.

## Token refresh

I also implement proactive token refresh in the proxy middleware. If the access token is going to expire within 30 seconds, the middleware calls Keycloak's token endpoint with the refresh token, rotates all the cookies on the response, and lets the request continue. The user never notices. If the refresh fails — for example because the refresh token has expired — the middleware redirects to login.

## CSRF protection

Before redirecting to Keycloak I generate a random `state` and `nonce`, store them in short-lived httpOnly cookies, and include them in the authorization URL. The callback validates both values before doing anything with the code.

## Role-based authorization

I implement two resource tiers and enforce them at two independent layers.

**Admin-restricted resources** are the dashboard pages for logs, analytics, blogs management, and user management. Only users with the `admin` role can access these.

**User-restricted resources** are the profile page, personal blog management, and the blog write operations. Users with either `user` or `admin` role can access these.

### Layer 1 — Middleware

The middleware runs at the edge before any page renders and reads the session cookie directly from the request.

| Route | Required role |
|-------|--------------|
| `/dashboard/logs`, `/dashboard/blogs`, `/dashboard/analytics`, `/dashboard/users` | `admin` |
| `/dashboard/profile`, `/dashboard/my-blogs`, `/blog/new`, `/blog/:slug/edit`, `/blog/:slug/analytics` | `user` or `admin` |

Users without the required role are redirected to `/forbidden`.

### Layer 2 — Server-side guards

I also add server-side guards in every Server Action and protected Server Component. This way even if the middleware is bypassed or a new route is added without updating the matcher, the authorization decision is still enforced at the application layer.

## Fine-grained authorization with OpenFGA

Keycloak handles who you are and which tier of resource you can access. OpenFGA handles which specific resource you can access.

When I finish the role-based layer I start to work on resource-level authorization using OpenFGA. I define a blog authorization model with four relations — `owner`, `admin`, `editor`, and `viewer` — and computed permissions (`can_view`, `can_edit`, `can_delete`, `can_share`) that are derived automatically from the relations.

When a blog is created, the creator gets an `owner` tuple in OpenFGA. Owners can share their blog with other users at any relation level. When access is revoked, all tuples for that user on that blog are deleted atomically.

I also implement temporary access for private blogs. When an owner shares with an expiry date, the expiry is stored in the `TemporaryAccess` SQLite table alongside the OpenFGA tuple. At check time, if the record has expired, the tuple is immediately revoked and access is denied — no cron job needed.

## Logout

Logout calls the OIDC end-session endpoint on Keycloak with the `id_token_hint` so Keycloak terminates the session on its side too. Then all local cookies are cleared and the user lands on the `/signed-out` page.
