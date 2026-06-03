export type SessionUser = {
  name: string;
  email?: string;
  username?: string;
  roles: string[];
  sub: string;
};

export type SafeSessionUser = {
  name: string;
  email?: string;
  username?: string;
  roles: string[];
  sub: string;
};

export type ActionResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string; code?: "UNAUTHORIZED" | "FORBIDDEN" | "NOT_FOUND" };
