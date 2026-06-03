import {
  ID_TOKEN_COOKIE,
  POST_LOGIN_REDIRECT_COOKIE,
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
    maxAge: number;
  },
) {
  const options = sessionCookieOptions(input.maxAge);

  cookieStore.set(SESSION_COOKIE, input.sessionJson, options);
  cookieStore.set(ID_TOKEN_COOKIE, input.idToken, options);
}

export function clearAuthCookies(cookieStore: CookieStore) {
  const expired = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    maxAge: 0,
    path: "/",
  };

  cookieStore.delete(SESSION_COOKIE);
  cookieStore.delete(ID_TOKEN_COOKIE);
  cookieStore.set(SESSION_COOKIE, "", expired);
  cookieStore.set(ID_TOKEN_COOKIE, "", expired);
}
