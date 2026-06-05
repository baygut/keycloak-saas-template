import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import { AuthProvider, AuthRefresher } from "@/components/auth/auth-provider";
import { RouteTransitionTracker } from "@/components/core/route-transition-tracker";
import { TooltipProvider } from "@/components/ui/tooltip";
import { getSafeSessionUser, getSession } from "@/lib/auth/server";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Keycloak Secure App",
  description: "Next.js application with direct Keycloak login debugging",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getSession();
  const initialUser = session ? getSafeSessionUser(session) : null;

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full items-center justify-center flex flex-col">
        <AuthProvider initialUser={initialUser}>
          <TooltipProvider>
            <AuthRefresher />
            <RouteTransitionTracker />
            {children}
          </TooltipProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
