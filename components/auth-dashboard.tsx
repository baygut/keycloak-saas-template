"use client";

const highlights = [
  "Direct redirect to Keycloak",
  "Server logs for query params",
  "Server logs for token exchange payload",
];

export function AuthDashboard() {
  function handleLogin() {
    window.location.assign("/api/keycloak/login");
  }

  return (
    <main className="mx-auto flex min-h-[calc(100vh-2rem)] w-full max-w-6xl items-center px-4 py-8 sm:px-6 lg:px-8">
      <section className="grid w-full gap-6 rounded-4xl border border-white/10 bg-white/75 p-5 shadow-[0_25px_80px_rgba(15,23,42,0.18)] backdrop-blur-xl lg:grid-cols-[1.2fr_0.8fr] lg:p-8">
        <div className="flex flex-col justify-between gap-8 rounded-3xl bg-[linear-gradient(160deg,rgba(15,23,42,0.96),rgba(30,41,59,0.9),rgba(14,165,233,0.55))] p-6 text-white shadow-lg sm:p-8">
          <div className="space-y-5">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-sky-200/80">
              Secure Next.js auth
            </p>
            <div className="space-y-4">
              <h1 className="max-w-xl text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
                Inspect the raw response from Keycloak after login.
              </h1>
              <p className="max-w-xl text-base leading-7 text-slate-200/90 sm:text-lg">
                This template now skips NextAuth entirely. The login button
                sends you straight to Keycloak, and the callback route logs the
                query parameters plus the token exchange response on the server.
              </p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            {highlights.map((item) => (
              <div
                key={item}
                className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm text-slate-100"
              >
                {item}
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-5 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-slate-500">Debug flow</p>
              <h2 className="mt-1 text-2xl font-semibold text-slate-950">
                Keycloak login callback
              </h2>
            </div>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-600">
              direct
            </span>
          </div>

          <div className="space-y-4">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm leading-7 text-slate-600">
              Click below to start the Keycloak authorization code flow. After
              login, open the terminal running the app and look for the callback
              log entries. The browser will also show the raw callback JSON
              response.
            </div>

            <button
              type="button"
              onClick={handleLogin}
              className="inline-flex items-center justify-center rounded-full bg-sky-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-sky-500"
            >
              Sign in with Keycloak
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}
