import { cookies, headers } from "next/headers";

import { AUTH_PATHS, ID_TOKEN_COOKIE } from "@/lib/auth/constants";
import { clearAuthCookies } from "@/lib/auth/cookies";
import { DEFAULT_APP_ORIGIN } from "@/lib/defaults";
import {
  createKeycloakLogoutUrl,
  readKeycloakConfig,
} from "@/lib/keycloak/keycloak";
import logger from "@/lib/logger";

const log = logger.child("logout");

export function getRequestOrigin(headerList: Headers): string {
  const host = headerList.get("x-forwarded-host") ?? headerList.get("host");
  const proto = headerList.get("x-forwarded-proto") ?? "http";
  return host ? `${proto}://${host}` : DEFAULT_APP_ORIGIN;
}

/**
 * Clears local session cookies and returns the URL to complete OIDC logout at Keycloak.
 * Falls back to the signed-out page when Keycloak is not configured.
 */
export async function resolveLogoutRedirectUrl(): Promise<string> {
  const cookieStore = await cookies();
  const headerList = await headers();
  const origin = getRequestOrigin(headerList);
  const signedOutUrl = new URL(AUTH_PATHS.SIGNED_OUT, origin).toString();

  const idTokenHint = cookieStore.get(ID_TOKEN_COOKIE)?.value;
  clearAuthCookies(cookieStore);

  log.info("local auth cookies cleared", {
    hadIdTokenHint: Boolean(idTokenHint),
  });

  try {
    const config = readKeycloakConfig();
    const logoutUrl = createKeycloakLogoutUrl({
      ...config,
      postLogoutRedirectUri: signedOutUrl,
      idTokenHint,
    });

    log.info("redirecting to keycloak logout", {
      postLogoutRedirectUri: signedOutUrl,
    });

    return logoutUrl.toString();
  } catch (error) {
    log.warn("keycloak logout unavailable, using signed-out page only", error);
    return signedOutUrl;
  }
}
