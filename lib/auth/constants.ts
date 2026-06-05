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
/** CSRF protection: OAuth2 state parameter stored before redirect to Keycloak. */
export const OAUTH_STATE_COOKIE = "oauth_state";
/** OIDC nonce stored before redirect to Keycloak, validated on callback. */
export const OAUTH_NONCE_COOKIE = "oauth_nonce";
/** HttpOnly cookie holding the raw access token (BFF use only). */
export const ACCESS_TOKEN_COOKIE = "access_token";
/** HttpOnly cookie holding the refresh token (BFF use only). */
export const REFRESH_TOKEN_COOKIE = "refresh_token";
/** HttpOnly cookie holding access token expiry as a Unix timestamp (seconds). */
export const ACCESS_TOKEN_EXP_COOKIE = "access_token_exp";

export const BLOG_VISIBILITY = {
  PUBLIC: "public",
  PRIVATE: "private",
  USERS_ONLY: "users_only",
} as const;

export type BlogVisibility =
  (typeof BLOG_VISIBILITY)[keyof typeof BLOG_VISIBILITY];
