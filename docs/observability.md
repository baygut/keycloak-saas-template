# Observability & Error Handling

## Structured logging

I create a custom `Logger` class that is instantiated once as a global singleton and shared across the entire Node.js process. Every module gets a namespaced child logger via `logger.child("prefix")` so it is always clear where a log entry comes from.

### Log levels and transport

I implement a transport system so logs can go to multiple destinations. In development, logs are printed to the console. The level threshold is controlled by the `CONSOLE_LOG_LEVEL` environment variable and defaults to `info`. In production, console output is suppressed entirely.

The main transport writes every log entry to the `LogEvent` SQLite table. I make the transport fire-and-forget — if the database write fails, the error is swallowed so logging never breaks the request path.

This way structured log data with full metadata is always available in the admin dashboard, regardless of what is happening with the console.

| Prefix | What it covers |
|--------|---------------|
| `proxy` | Token refresh, route guard decisions |
| `authz` | OpenFGA check failures, write errors |
| `authz-blog` | FGA tuple operations — grant, revoke, read |
| `auth` | Logout errors, session issues |
| `app/error` | Client-side errors from the error boundary |

## Analytics

I create a `persistAnalyticsEvent()` function that records events to the `AnalyticsEvent` table. I wrap the database call in a try/catch that swallows all errors — analytics must never break the app or slow down a request.

| Event | When it fires |
|-------|--------------|
| `page_view` | Every blog detail page load, server-side |
| `route_transition` | Every client-side navigation, measured in the browser |

## Route transition timing

For route transition monitoring I implement a lightweight solution without any external SDK. `instrumentation-client.ts` stamps `window.__navStart` with a `performance.now()` timestamp at the start of every router navigation. When the `RouteTransitionTracker` component detects a path change, it reads the timestamp, computes the elapsed milliseconds, and fires a non-blocking POST to the analytics endpoint with `keepalive: true` so the request completes even if the user navigates away immediately.

This way real end-to-end navigation timing shows up in the admin analytics page.

## OpenTelemetry

I also set up OpenTelemetry for better performance insights. I initialize the OTel Node.js SDK in `instrumentation.node.ts` which Next.js loads automatically before the app starts.

Instead of sending spans to an external collector, I create a `PrismaSpanExporter` that implements the OTel `SpanExporter` interface and writes completed spans to the `OtelSpan` SQLite table. This way span data is visible in the admin dashboard without needing any additional infrastructure. For a real production setup this exporter would be replaced with the standard OTLP exporter.

I also expose a `withSpan()` helper in `lib/telemetry.ts` for wrapping async operations in a named span, and `getTracer()` for manual instrumentation where needed.

## Error boundaries

I add error boundaries at two levels.

The `ErrorBoundary` class component catches rendering errors anywhere in its subtree. When an error is caught, it shows a fallback UI and calls the `logClientError` Server Action which writes the error message and component stack to the `LogEvent` table. This way client-side rendering errors show up in the server-side log viewer immediately.

For catastrophic errors that escape the root layout, I use `app/global-error.tsx` as a last-resort boundary. It renders a minimal recovery UI with a "Try again" button.

## Authentication and authorization errors

For authentication errors I keep it simple. If the session cookie is missing or invalid, `requireSession()` redirects to login. If the user has the wrong role, `requireRole()` and `requireUserResourceAccess()` redirect to the `/forbidden` page with context about what was required and what the user actually has.

For OpenFGA errors I decide to fail safe. If an FGA check throws for any reason — network timeout, service down — `can()` catches the error, logs it, and returns `false`. `listObjectIds()` does the same and returns an empty array. This way an OpenFGA outage means "deny everything" rather than crashing the app. The error is still visible in the log dashboard so it is easy to diagnose.
