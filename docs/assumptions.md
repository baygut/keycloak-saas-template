# Assumptions & Trade-offs

## SQLite for application data

I decide to use SQLite for blogs, logs, analytics, and OTel spans. SQLite requires zero extra infrastructure — it is just a file on disk. This way the local setup stays simple: `docker compose up` only needs to run Keycloak, Postgres (for OpenFGA), and OpenFGA itself.

The trade-off is that SQLite does not handle concurrent write load well and has no connection pooling. For a real production deployment this would be switched to Postgres. The Prisma schema is database-agnostic so changing the provider is a one-line edit in `schema.prisma`.

## Postgres only for OpenFGA

I run Postgres in the stack exclusively because OpenFGA requires a relational backend and does not support SQLite. Rather than running two separate Postgres instances, the app reuses the same Postgres container for OpenFGA's own data while keeping the application data in SQLite.

## Public Keycloak client

I configure the Keycloak client as a public client with no client secret. For a demo and template this is a reasonable default — it keeps setup simple and there is no secret to manage. The Authorization Code flow is still used so tokens are never exposed in the URL.

For a real production deployment, switching to a confidential client with a rotated secret is the recommended approach as it gives an extra layer of verification at the token endpoint.

## JWT decoded without signature verification

I decode JWT payloads by splitting on `.` and base64-decoding the middle segment. I do not verify the signature on every request.

I find this acceptable in the BFF pattern because the tokens are received directly from Keycloak over a server-to-server call during the code exchange — Keycloak already verified them. Verifying the signature on every request would require fetching and caching Keycloak's JWKS endpoint, which adds complexity without meaningful security gain in this setup.

For a production setup with stricter requirements, JWKS-based verification is the right approach.

## Stateless session cookies

I decide not to use a server-side session store like Redis. The session is a self-contained httpOnly JSON cookie with the user's name, sub, email, and roles.

The trade-off is that sessions cannot be force-invalidated server-side. If an admin revokes a user's role in Keycloak, the user's session cookie stays valid until the refresh token expires. For use cases that need immediate revocation, a server-side session store with a blocklist would be necessary.

## OpenFGA degrades gracefully when not configured

I check `isOpenFgaConfigured()` before every FGA call. If the store ID is not set in the environment, all permission checks fall back to owner-only access and no error is thrown. This allows the app to run in a reduced mode if the bootstrap step is skipped or OpenFGA is temporarily unavailable.

The trade-off is that if OpenFGA is misconfigured — store ID is set but points to a wrong store — the FGA calls will fail silently and deny access without giving the user any useful error message. The error is logged, so it is visible in the dashboard, but the user just sees a generic access denied.

## Temporary access stored in two places

I implement temporary access using both OpenFGA tuples and a `TemporaryAccess` table in SQLite. OpenFGA holds the permission itself. SQLite holds the expiry metadata.

I decide to do it this way because OpenFGA tuples have no native expiry. Rather than running a background job to clean up expired tuples, I check the expiry at access time — if the record has expired, I revoke the FGA tuple immediately and deny access. This is lazy eviction, so no cron job is needed.

The trade-off is that the two stores need to stay in sync. If the SQLite record is lost but the FGA tuple remains, access would be incorrectly granted. Between expiry and the next access attempt, the tuple technically still exists in FGA even though the app denies access.

## Analytics are fire-and-forget

I decide that analytics events should never be on the critical path of a request. `persistAnalyticsEvent()` wraps the database write in a try/catch that swallows all errors. A failed analytics write is much better than a broken page load.

The trade-off is that analytics data can be silently lost if the database is unavailable. There is no retry queue or dead letter store.

## OTel spans stored in SQLite

I store OpenTelemetry spans in the `OtelSpan` SQLite table instead of sending them to a real collector. This makes span data visible in the admin dashboard without needing any additional infrastructure, which fits the goal of keeping the local setup simple.

For a production setup this exporter would be replaced with the standard OTLP exporter pointed at Jaeger, Tempo, or any compatible backend. SQLite is not designed for high-volume append workloads from a span exporter.
