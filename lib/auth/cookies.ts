import {
  ACCESS_TOKEN_COOKIE,
  ACCESS_TOKEN_EXP_COOKIE,
  ID_TOKEN_COOKIE,
  OAUTH_NONCE_COOKIE,
  OAUTH_STATE_COOKIE,
  POST_LOGIN_REDIRECT_COOKIE,
  REFRESH_TOKEN_COOKIE,
  SESSION_COOKIE,
} from "@/lib/auth/constants";

const POST_LOGIN_MAX_AGE = 600;

export function sanitizePostLoginPath(value: string | null | undefined): string | null {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return null;
  }

  return value;
}

export function setPostLoginRedirectCookie(
  cookieStore: CookieStore,
  path: string,
) {
  const safe = sanitizePostLoginPath(path);
  if (!safe) {
    return;
  }

  cookieStore.set(POST_LOGIN_REDIRECT_COOKIE, safe, {
    ...sessionCookieOptions(POST_LOGIN_MAX_AGE),
  });
}

export function clearPostLoginRedirectCookie(cookieStore: CookieStore) {
  const expired = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    maxAge: 0,
    path: "/",
  };

  cookieStore.delete(POST_LOGIN_REDIRECT_COOKIE);
  cookieStore.set(POST_LOGIN_REDIRECT_COOKIE, "", expired);
}

type CookieStore = {
  delete: (name: string) => void;
  set: (
    name: string,
    value: string,
    options: {
      httpOnly: boolean;
      secure: boolean;
      sameSite: "lax";
      maxAge: number;
      path: string;
    },
  ) => void;
};

function sessionCookieOptions(maxAge: number) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    maxAge,
    path: "/",
  };
}

export function setAuthCookies(
  cookieStore: CookieStore,
  input: {
    sessionJson: string;
    idToken: string;
    accessToken: string;
    refreshToken: string;
    /** Absolute Unix timestamp (seconds) when the access token expires. */
    accessTokenExp: number;
    maxAge: number;
  },
) {
  const options = sessionCookieOptions(input.maxAge);

  cookieStore.set(SESSION_COOKIE, input.sessionJson, options);
  cookieStore.set(ID_TOKEN_COOKIE, input.idToken, options);
  cookieStore.set(ACCESS_TOKEN_COOKIE, input.accessToken, options);
  cookieStore.set(REFRESH_TOKEN_COOKIE, input.refreshToken, options);
  cookieStore.set(ACCESS_TOKEN_EXP_COOKIE, String(input.accessTokenExp), options);
}

const OAUTH_COOKIE_MAX_AGE = 300; // 5 minutes, enough to complete the auth flow

export function setOAuthStateCookie(cookieStore: CookieStore, state: string) {
  cookieStore.set(OAUTH_STATE_COOKIE, state, {
    ...sessionCookieOptions(OAUTH_COOKIE_MAX_AGE),
  });
}

export function setOAuthNonceCookie(cookieStore: CookieStore, nonce: string) {
  cookieStore.set(OAUTH_NONCE_COOKIE, nonce, {
    ...sessionCookieOptions(OAUTH_COOKIE_MAX_AGE),
  });
}

export function clearOAuthCookies(cookieStore: CookieStore) {
  const expired = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    maxAge: 0,
    path: "/",
  };
  cookieStore.delete(OAUTH_STATE_COOKIE);
  cookieStore.delete(OAUTH_NONCE_COOKIE);
  cookieStore.set(OAUTH_STATE_COOKIE, "", expired);
  cookieStore.set(OAUTH_NONCE_COOKIE, "", expired);
}

export function clearAuthCookies(cookieStore: CookieStore) {
  const expired = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    maxAge: 0,
    path: "/",
  };

  for (const name of [
    SESSION_COOKIE,
    ID_TOKEN_COOKIE,
    ACCESS_TOKEN_COOKIE,
    REFRESH_TOKEN_COOKIE,
    ACCESS_TOKEN_EXP_COOKIE,
  ]) {
    cookieStore.delete(name);
    cookieStore.set(name, "", expired);
  }
}
