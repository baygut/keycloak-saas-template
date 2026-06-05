import { PlayCircle } from "lucide-react";

import { Header } from "@/components/core/header";
import { Footer } from "@/components/core/footer";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-static";

export default function Home() {
  return (
    <div className="relative min-h-screen flex flex-col overflow-x-hidden bg-background">
      <Header />

      <main className="flex-1 flex flex-col container py-16 gap-16">
        {/* Hero Section */}
        <section className="flex flex-col items-center text-center space-y-8">
          <div className="space-y-4 max-w-3xl">
            <h1 className="text-4xl sm:text-6xl font-bold tracking-tight">
              Secure Your SaaS At The{" "}
              <span className="text-primary">Protocol Layer</span>
            </h1>
            <p className="text-lg text-muted-foreground">
              Production-ready Next.js template utilizing raw Keycloak OpenID
              Connect integrations. Statically pre-rendered (SSG) with
              client-side token validation. Zero third-party library overhead.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 items-center justify-center">
            <Button size="lg" asChild>
              <a href="/api/keycloak/register">Get Started Free</a>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <a href="/api/keycloak/login">Sign In Demo</a>
            </Button>
          </div>

          <Card className="max-w-4xl w-full">
            <CardHeader>
              <CardTitle>Keycloak Flow Inspector</CardTitle>
              <CardDescription>
                Authentication flow visualization
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 font-mono text-sm">
                <div className="p-4 bg-muted rounded">
                  <p className="text-muted-foreground mb-2">
                    Step 1: Client redirects to Keycloak Authorization Code flow
                  </p>
                  <p>
                    <span className="text-primary font-bold">GET</span>{" "}
                    /api/keycloak/login{" "}
                    <span className="text-muted-foreground">
                      → Redirecting to Keycloak...
                    </span>
                  </p>
                </div>
                <div className="p-4 bg-muted rounded">
                  <p className="text-muted-foreground mb-2">
                    Step 2: Keycloak Callback handles token exchange & issues
                    secure cookie
                  </p>
                  <p>
                    <span className="text-primary font-bold">GET</span>{" "}
                    /api/keycloak/callback?code=...{" "}
                    <span className="text-green-500">200 OK</span>
                  </p>
                  <p className="text-muted-foreground">
                    Set-Cookie: session_token=...; HttpOnly; Secure;
                  </p>
                </div>
                <div className="p-4 bg-muted rounded">
                  <p className="text-muted-foreground mb-2">
                    Step 3: Root layout hydrates session into client auth store
                    (Zustand)
                  </p>
                  <p>
                    <span className="text-primary font-bold">RSC</span>{" "}
                    getSession() <span className="text-green-500">200 OK</span>
                  </p>
                  <p className="text-blue-400">
                    {"{ name: '...', roles: [...] }"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Demo Video */}
        <section className="flex flex-col items-center gap-4">
          <div className="text-center space-y-2">
            <h2 className="text-2xl sm:text-3xl font-bold">See it in action</h2>
            <p className="text-sm text-muted-foreground">Full walkthrough of the authentication and authorization flow</p>
          </div>
          {/* Replace this div with a <video> or <iframe> when the recording is ready */}
          <div className="w-full max-w-4xl aspect-video rounded-xl border border-border bg-muted flex flex-col items-center justify-center gap-4 text-muted-foreground">
            <PlayCircle className="w-16 h-16 opacity-30" />
            <span className="text-sm">Demo video coming soon</span>
          </div>
        </section>

        {/* Features Grid */}
        <section id="features" className="space-y-8">
          <div className="text-center space-y-2">
            <h2 className="text-3xl sm:text-5xl font-bold">
              Guaranteed Isolation
            </h2>
            <p className="text-muted-foreground">
              Security modules built for production
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle>Native IAM</CardTitle>
                <CardDescription>Direct Keycloak integration</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Direct connection with Keycloak OIDC protocol endpoints.
                  Eliminates bloated wrapper layers for speed and stability.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Static SSG Speed</CardTitle>
                <CardDescription>
                  Lightning-fast static generation
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Landing pages compile to dynamic-free static content. Perfect
                  SEO scoring, instant loads, and effortless scaling.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Role-Based BFF</CardTitle>
                <CardDescription>Server-side access control</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Verify access at the server BFF (Backend-for-Frontend) layer.
                  Restrict admin and user data pools securely with cookies.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Pricing Tiers */}
        <section id="pricing" className="space-y-8">
          <div className="text-center space-y-2">
            <h2 className="text-3xl sm:text-5xl font-bold">Flat Pricing</h2>
            <p className="text-muted-foreground">
              Simple, transparent pricing for everyone
            </p>
          </div>

          <div className="grid gap-6 lg:grid-cols-3 max-w-5xl mx-auto items-stretch">
            <Card>
              <CardHeader>
                <CardTitle>Starter</CardTitle>
                <CardDescription>Perfect for getting started</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <span className="text-4xl font-bold">$0</span>
                  <span className="text-muted-foreground">/month</span>
                </div>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <span className="text-green-500">✓</span> 1 Keycloak Realm
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-green-500">✓</span> 500 Active
                    Identities
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-green-500">✓</span> Developer
                    Community Support
                  </li>
                </ul>
                <Button className="w-full" variant="outline" asChild>
                  <a href="/api/keycloak/register">Download Code</a>
                </Button>
              </CardContent>
            </Card>

            <Card className="border-primary">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Growth</CardTitle>
                  <Badge variant="default" className="text-xs">
                    Recommended
                  </Badge>
                </div>
                <CardDescription>For growing teams</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <span className="text-4xl font-bold">$49</span>
                  <span className="text-muted-foreground">/month</span>
                </div>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <span className="text-green-500">✓</span> 3 Keycloak Realms
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-green-500">✓</span> 15,000 Active
                    Identities
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-green-500">✓</span> Role & Group RBAC
                    Support
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-green-500">✓</span> BFF Secure Tokens
                  </li>
                </ul>
                <Button className="w-full" asChild>
                  <a href="/api/keycloak/register">Start Free Trial</a>
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Enterprise</CardTitle>
                <CardDescription>For large organizations</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <span className="text-4xl font-bold">$199</span>
                  <span className="text-muted-foreground">/month</span>
                </div>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <span className="text-green-500">✓</span> Unlimited realms &
                    users
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-green-500">✓</span> High Availability
                    Cluster
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-green-500">✓</span> LDAP / AD Identity
                    Federation
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-green-500">✓</span> 24/7 Priority
                    Support SLA
                  </li>
                </ul>
                <Button className="w-full" variant="outline" asChild>
                  <a href="mailto:sales@saasshield.local">Contact Sales</a>
                </Button>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Technology Specs */}
        <section id="technology" className="space-y-8">
          <div className="text-center space-y-2">
            <h2 className="text-3xl sm:text-5xl font-bold">
              System Architecture
            </h2>
            <p className="text-muted-foreground">
              Built with modern technologies
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
            <Card>
              <CardContent className="flex flex-col items-center justify-center p-6 gap-3">
                <span className="text-3xl font-bold">N16</span>
                <span className="text-sm text-muted-foreground">
                  Next.js 16
                </span>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex flex-col items-center justify-center p-6 gap-3">
                <span className="text-3xl font-bold text-primary">KC</span>
                <span className="text-sm text-muted-foreground">
                  Keycloak OIDC
                </span>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex flex-col items-center justify-center p-6 gap-3">
                <span className="text-3xl font-bold">TW4</span>
                <span className="text-sm text-muted-foreground">
                  Tailwind v4
                </span>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex flex-col items-center justify-center p-6 gap-3">
                <span className="text-3xl font-bold">TS</span>
                <span className="text-sm text-muted-foreground">
                  TypeScript
                </span>
              </CardContent>
            </Card>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
