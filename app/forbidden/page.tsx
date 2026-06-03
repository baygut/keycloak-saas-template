import { ForbiddenPanel } from "@/components/dashboard/forbidden-panel";
import { getSession } from "@/lib/auth/server";

type ForbiddenPageProps = {
  searchParams: Promise<{
    message?: string;
    roles?: string;
    required?: string;
    next?: string;
  }>;
};

export default async function ForbiddenPage({ searchParams }: ForbiddenPageProps) {
  const params = await searchParams;
  const session = await getSession();
  const rolesFromQuery = params.roles?.split(",").filter(Boolean);
  const requiredRoles = params.required?.split(",").filter(Boolean);

  return (
    <ForbiddenPanel
      variant="full"
      message={
        params.message ??
        "You do not have permission to access this resource."
      }
      roles={rolesFromQuery ?? session?.roles}
      requiredRoles={requiredRoles}
      authenticated={Boolean(session)}
      returnTo={params.next}
    />
  );
}
