import { redirect } from "next/navigation";

import { ROLES } from "@/lib/auth/constants";
import { requireRole } from "@/lib/auth/server";
import { getKeycloakAdminConsoleUsersUrl } from "@/lib/keycloak/keycloak";

export default async function AdminUsersPage() {
  await requireRole(ROLES.ADMIN);
  redirect(getKeycloakAdminConsoleUsersUrl());
}
