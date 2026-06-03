import { redirect } from "next/navigation";

import { ForbiddenPanel, type ForbiddenPanelProps } from "@/components/dashboard/forbidden-panel";
import { logAccessDenied, type AccessDenialContext } from "@/lib/auth/access-log";
import type { SessionUser } from "@/lib/auth/types";

type ForbiddenRedirectOptions = AccessDenialContext & {
  returnTo?: string;
};

export function redirectToForbidden(
  session: SessionUser | null,
  options: ForbiddenRedirectOptions,
): never {
  logAccessDenied(session, options);

  const params = new URLSearchParams();
  params.set("message", options.reason);

  if (options.requiredRoles?.length) {
    params.set("required", options.requiredRoles.join(","));
  }

  if (session?.roles.length) {
    params.set("roles", session.roles.join(","));
  }

  if (options.returnTo) {
    params.set("next", options.returnTo);
  }

  redirect(`/forbidden?${params.toString()}`);
}

type AccessDeniedPanelOptions = Omit<ForbiddenPanelProps, "variant"> & {
  context?: AccessDenialContext;
  session?: SessionUser | null;
};

/** Inline 403 view for server components (no experimental forbidden()). */
export function accessDeniedPanel({
  context,
  session = null,
  roles,
  authenticated,
  requiredRoles,
  ...panelProps
}: AccessDeniedPanelOptions) {
  if (context) {
    logAccessDenied(session, context);
  }

  return (
    <ForbiddenPanel
      variant="full"
      roles={roles ?? session?.roles}
      authenticated={authenticated ?? Boolean(session)}
      requiredRoles={
        requiredRoles ??
        (context?.requiredRoles ? [...context.requiredRoles] : undefined)
      }
      {...panelProps}
    />
  );
}
