import Link from "next/link";

import { Button } from "@/components/ui/button";
import { AUTH_PATHS } from "@/lib/auth/constants";

export type ForbiddenPanelProps = {
  title?: string;
  message: string;
  roles?: string[];
  requiredRoles?: string[];
  variant?: "default" | "full";
  /** When false, shows a Sign in action (default: false if roles omitted). */
  authenticated?: boolean;
  /** Post-login return path for the sign-in link. */
  returnTo?: string;
};

function buildSignInHref(returnTo?: string) {
  if (!returnTo) {
    return AUTH_PATHS.LOGIN;
  }

  return `${AUTH_PATHS.LOGIN}?next=${encodeURIComponent(returnTo)}`;
}

function ForbiddenPanelContent({
  title = "// 403_ACCESS_FORBIDDEN",
  message,
  roles,
  requiredRoles,
  authenticated = false,
  returnTo,
}: ForbiddenPanelProps) {
  const signInHref = buildSignInHref(returnTo);

  return (
    <div className="border border-brand-accent/20 bg-brand-accent/5 p-6 text-brand-accent space-y-4 max-w-lg w-full">
      <div className="space-y-2">
        <p className="font-bold">{title}</p>
        <p className="text-sm text-slate-400">{message}</p>
      </div>

      {requiredRoles && requiredRoles.length > 0 ? (
        <div className="border border-brand-accent/20 bg-slate-950/80 p-3 font-mono text-[10px] text-slate-500 leading-normal">
          Required role(s): [{requiredRoles.join(", ")}].
        </div>
      ) : null}

      {roles ? (
        <div className="border border-brand-accent/20 bg-slate-950/80 p-3 font-mono text-[10px] text-slate-500 leading-normal">
          Your token contains roles: [{roles.join(", ") || "none"}].
        </div>
      ) : null}

      <div className="flex flex-wrap gap-3 pt-1">
        {!authenticated ? (
          <Button asChild size="sm">
            <a href={signInHref}>Sign in</a>
          </Button>
        ) : (
          <Button asChild size="sm">
            <Link href="/dashboard">Dashboard</Link>
          </Button>
        )}
        <Button asChild variant="outline" size="sm">
          <Link href="/">Home</Link>
        </Button>
      </div>
    </div>
  );
}

export function ForbiddenPanel({
  variant = "default",
  ...props
}: ForbiddenPanelProps) {
  if (variant === "full") {
    return (
      <div className="flex min-h-[60vh] w-full items-center justify-center px-4 py-16">
        <ForbiddenPanelContent {...props} />
      </div>
    );
  }

  return <ForbiddenPanelContent {...props} />;
}
