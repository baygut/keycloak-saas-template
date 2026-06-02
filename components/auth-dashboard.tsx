"use client";

import { signIn, signOut, useSession } from "next-auth/react";

const highlights = [
  "Keycloak-backed sign in",
  "JWT session with access token",
  "App Router friendly session provider",
];

function formatTokenPreview(token?: string) {
  if (!token) {
    return "Not available until you sign in.";
  }

  if (token.length <= 24) {
    return token;
  }

  return `${token.slice(0, 12)}...${token.slice(-8)}`;
}

export function AuthDashboard() {
  const { data: session, status } = useSession();
  const isAuthenticated = status === "authenticated";

  async function handleSignOut() {
    const idToken = session?.idToken;
    const logoutUrl = session?.keycloakLogoutUrl;

    await signOut({ redirect: false, callbackUrl: "/" });

    if (logoutUrl && idToken) {
      const url = new URL(logoutUrl);
      url.searchParams.set("id_token_hint", idToken);
      url.searchParams.set("post_logout_redirect_uri", window.location.origin);
      window.location.assign(url.toString());
      return;
    }

    window.location.assign("/");
  }

  return (
    <main className="mx-auto flex min-h-[calc(100vh-2rem)] w-full max-w-6xl items-center px-4 py-8 sm:px-6 lg:px-8">
      <section className="grid w-full gap-6 rounded-[2rem] border border-white/10 bg-white/75 p-5 shadow-[0_25px_80px_rgba(15,23,42,0.18)] backdrop-blur-xl lg:grid-cols-[1.2fr_0.8fr] lg:p-8">
        <div className="flex flex-col justify-between gap-8 rounded-[1.5rem] bg-[linear-gradient(160deg,rgba(15,23,42,0.96),rgba(30,41,59,0.9),rgba(14,165,233,0.55))] p-6 text-white shadow-lg sm:p-8">
          <div className="space-y-5">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-sky-200/80">
              Secure Next.js auth
            </p>
            <div className="space-y-4">
              <h1 className="max-w-xl text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
                Build a guarded app with Keycloak and NextAuth.
              </h1>
              <p className="max-w-xl text-base leading-7 text-slate-200/90 sm:text-lg">
                This template mirrors the article&apos;s flow: Keycloak handles
                identity, NextAuth manages sessions, and the UI switches between
                a public sign-in state and an authenticated profile view.
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

        <div className="flex flex-col gap-5 rounded-[1.5rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-slate-500">
                Session status
              </p>
              <h2 className="mt-1 text-2xl font-semibold text-slate-950">
                {isAuthenticated
                  ? "Signed in"
                  : status === "loading"
                    ? "Loading session"
                    : "Signed out"}
              </h2>
            </div>
            <span
              className={`rounded-full px-3 py-1 text-sm font-medium ${isAuthenticated ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"}`}
            >
              {status}
            </span>
          </div>

          {isAuthenticated ? (
            <div className="space-y-4">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm font-medium text-slate-500">Profile</p>
                <div className="mt-3 grid gap-3 text-sm text-slate-700">
                  <div className="flex items-center justify-between gap-4 border-b border-slate-200 pb-2">
                    <span className="font-medium text-slate-500">Name</span>
                    <span className="text-right font-semibold text-slate-950">
                      {session?.user?.name ?? "Unknown user"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-4 border-b border-slate-200 pb-2">
                    <span className="font-medium text-slate-500">Email</span>
                    <span className="text-right font-semibold text-slate-950">
                      {session?.user?.email ?? "No email available"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <span className="font-medium text-slate-500">User ID</span>
                    <span className="text-right font-semibold text-slate-950">
                      {session?.user?.id ?? "No subject available"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-950 px-4 py-4 text-slate-100">
                <p className="text-sm font-medium text-slate-400">
                  Access token preview
                </p>
                <p className="mt-2 break-all font-mono text-sm leading-6 text-sky-200">
                  {formatTokenPreview(session?.accessToken)}
                </p>
              </div>

              <button
                type="button"
                onClick={handleSignOut}
                className="inline-flex items-center justify-center rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                Sign out
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm leading-7 text-slate-600">
                Click below to start the Keycloak login flow. After
                authentication, this panel will show your profile data and
                access token preview.
              </div>

              <button
                type="button"
                onClick={() => signIn("keycloak")}
                className="inline-flex items-center justify-center rounded-full bg-sky-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-sky-500"
              >
                Sign in with Keycloak
              </button>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
