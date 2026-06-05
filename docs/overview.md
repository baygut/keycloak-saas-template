# Project Overview

| Area | Technology | Notes |
|------|-----------|-------|
| Authentication | Keycloak (OIDC) | Realm imported via JSON on compose up |
| Session | Encrypted httpOnly cookies | Server-side only; token refresh built-in |
| Data | SQLite + Prisma | Simple setup; Postgres is a future option |
| Authorization | OpenFGA | Permanent + temporary access |
| Observability | Structured logs, analytics, OpenTelemetry | All stored in SQLite |

---

## Authentication

At the beginning I start the project with Keycloak authentication. It was not a familiar thing for me. I just start to play with the dashboard and try to explore what is going on there.

Then I continue with Keycloak integration. With easy usage of admin panel of Keycloak I create a realm, client and some users. With the relevant callbacks I successfully get the first token. Then I realize I need to set this up for the demo. At this point I found that I can just put relevant information about Keycloak in a JSON file then import it while `docker compose up`. This way I can avoid manual setup of Keycloak for every new developer.

## Session

After that I start to work on keeping session in the app after callback. I decide to use encrypted cookies for this. I create a session handler that can set and get session from cookies. Then I create a middleware that will check the session on every request and set the user in the context if the session is valid.

While implementing session I also find the way of exposing role information in the session. This way I can easily check if the user is admin or not in the app and show relevant UI.

A few things worth noting about the security model:

- All role checks are on the **server side** — they are secure and cannot be bypassed
- Client-side role checks are only for **UI purposes** and do not affect security
- **Token refresh** is built into the session handler, so the session stays alive as long as the user is active without requiring them to log in again after token expiration
- **Route guards** are enforced in `proxy.ts`

## Blog Data

After authentication is working I start to work on blog data management. I create a simple blog model with `title`, `content`, `visibility` and `owner`. Then I create some API routes to create, update, delete and list blogs. I also create some pages to display the blogs and a dashboard for the owner to manage their blogs.

I put all the data in a SQLite database using Prisma as the ORM. At that part I could implement stronger typed data management with Prisma and also I can easily manage database migrations. It could be a future improvement to switch to a more robust database like Postgres but for the sake of simplicity and ease of setup I stick with SQLite for now.

## Authorization

After authentication and blog data management I start to work on authorization. I use OpenFGA for this. I create a model for blog access control and implement the logic in the app. I also create a bootstrap script that will:

1. Create the store
2. Upload the model
3. Backfill the existing blogs with owner tuples

When I finish integration for permanent access control, I also implement temporary access for private blogs. This allows blog owners to share their private blogs with other users for a limited time.

## Observability

While completing the features I also implement some observability features.

| Feature | Model | Where it shows |
|---------|-------|----------------|
| Structured logs | `LogEvent` | Dashboard → Logs |
| Analytics events | `AnalyticsEvent` | Dashboard → Analytics |
| OpenTelemetry spans | `OtelSpan` | Dashboard → Analytics |

Then I create some pages in the dashboard to display logs and analytics data. For better observability I also set up OpenTelemetry and store spans in the database. This way I can have better insights into the performance of the app and identify any bottlenecks or issues.
