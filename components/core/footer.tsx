"use client";

import Link from "next/link";

import { SignOutButton } from "@/components/auth/sign-out-button";
import { AUTH_PATHS } from "@/lib/auth/constants";
import { useAuth } from "@/hooks/use-auth";

export function Footer() {
  const { isAuthenticated } = useAuth();

  return (
    <footer className="border-t bg-background">
      <div className="container flex flex-col items-center justify-between gap-4 py-10 md:h-24 md:flex-row md:py-0">
        <div className="flex flex-col items-center gap-4 px-8 md:flex-row md:gap-2 md:px-0">
          <p className="text-center text-sm leading-loose text-muted-foreground md:text-left">
            Built with{" "}
            <Link
              href="https://ui.shadcn.com"
              className="font-medium underline underline-offset-4"
            >
              shadcn/ui
            </Link>
            . The source code is available on{" "}
            <Link
              href="https://github.com"
              className="font-medium underline underline-offset-4"
            >
              GitHub
            </Link>
            .
          </p>
        </div>
        <div className="flex items-center gap-4">
          {isAuthenticated ? (
            <SignOutButton className="text-sm text-muted-foreground hover:text-foreground" />
          ) : (
            <>
              <Link
                href={AUTH_PATHS.LOGIN}
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                Sign In
              </Link>
              <Link
                href={AUTH_PATHS.REGISTER}
                className="text-sm font-medium text-muted-foreground hover:text-foreground"
              >
                Register
              </Link>
            </>
          )}
        </div>
      </div>
    </footer>
  );
}
