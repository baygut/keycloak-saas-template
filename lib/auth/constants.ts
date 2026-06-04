/** Keycloak realm role names (must match keycloak/realm-demo.json) */
export const ROLES = {
  USER: "user",
  ADMIN: "admin",
} as const;

export type AppRole = (typeof ROLES)[keyof typeof ROLES];

export const ROLE_GROUPS = {
  USER_ACCESS: [ROLES.USER, ROLES.ADMIN] as const,
  ADMIN_ONLY: [ROLES.ADMIN] as const,
} as const;

export const AUTH_PATHS = {
  LOGIN: "/api/keycloak/login",
  REGISTER: "/api/keycloak/register",
  LOGOUT: "/api/keycloak/logout",
  SIGNED_OUT: "/signed-out",
} as const;

export const SESSION_COOKIE = "session_token";
/** HttpOnly cookie holding the OIDC id_token for Keycloak end-session logout. */
export const ID_TOKEN_COOKIE = "kc_id_token";
/** Short-lived post-login redirect target (from ?next= on login). */
export const POST_LOGIN_REDIRECT_COOKIE = "auth_next";

export const BLOG_VISIBILITY = {
  PUBLIC: "public",
  PRIVATE: "private",
} as const;

export type BlogVisibility =
  (typeof BLOG_VISIBILITY)[keyof typeof BLOG_VISIBILITY];
