"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Lock } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { HeaderAuthMenuItems } from "@/components/core/header-auth-menu";
import { AUTH_PATHS } from "@/lib/auth/constants";
import { useAuth } from "@/hooks/use-auth";

export function Header() {
  const { user, status, isAuthenticated } = useAuth();
  const pathname = usePathname();
  const isDashboard = pathname?.startsWith("/dashboard");

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <div className="mr-4 flex items-center gap-2">
          <Link href="/" className="flex items-center gap-2 font-bold">
            <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground hover:bg-primary/90">
              <Lock className="h-4 w-4" />
            </div>
            <span className="hidden font-bold sm:inline-block">Keycloak SaaS Template</span>
          </Link>
        </div>

        <nav className="flex items-center space-x-6 text-sm font-medium">
          {isDashboard ? (
            <span className="text-muted-foreground">Dashboard</span>
          ) : (
            <>
              <Link
                href="/blog"
                className="text-foreground/60 transition-colors hover:text-foreground/80"
              >
                Blogs
              </Link>
              <Link
                href="#features"
                className="text-foreground/60 transition-colors hover:text-foreground/80"
              >
                Features
              </Link>
              <Link
                href="#pricing"
                className="text-foreground/60 transition-colors hover:text-foreground/80"
              >
                Pricing
              </Link>
            </>
          )}
        </nav>

        <div className="ml-auto flex items-center space-x-4">
          {status === "loading" ? (
            <div className="h-8 w-20 animate-pulse rounded bg-muted" />
          ) : isAuthenticated && user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative size-8 rounded-full">
                  <Avatar className="size-8">
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      {user.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <div className="flex items-center justify-start gap-2 p-2">
                  <div className="flex flex-col gap-1">
                    <p className="text-sm font-medium leading-none">{user.name}</p>
                    {user.email ? (
                      <p className="text-xs leading-none text-muted-foreground">
                        {user.email}
                      </p>
                    ) : null}
                  </div>
                </div>
                <HeaderAuthMenuItems />
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              <Button variant="ghost" size="sm" asChild>
                <a href={AUTH_PATHS.LOGIN}>Sign In</a>
              </Button>
              <Button size="sm" asChild>
                <a href={AUTH_PATHS.REGISTER}>Get Started</a>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
