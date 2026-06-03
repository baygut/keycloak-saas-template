import { PrismaClient } from "@prisma/client";
import { mkdirSync } from "fs";
import { dirname, join, resolve } from "path";

const GLOBAL_KEY = "__PRISMA_CLIENT_SINGLETON__";

declare global {
  var __PRISMA_CLIENT_SINGLETON__: PrismaClient | undefined;
}

function ensureDatabaseUrl() {
  const configured = process.env.DATABASE_URL?.trim();
  const defaultPath = join(process.cwd(), "data", "app.sqlite");

  if (!configured) {
    mkdirSync(dirname(defaultPath), { recursive: true });
    const url = `file:${defaultPath}`;
    process.env.DATABASE_URL = url;
    return url;
  }

  if (!configured.startsWith("file:")) {
    return configured;
  }

  const rawPath = configured.slice("file:".length);
  const sqlitePath = rawPath.startsWith("/")
    ? rawPath
    : resolve(process.cwd(), rawPath);

  mkdirSync(dirname(sqlitePath), { recursive: true });
  const url = `file:${sqlitePath}`;
  process.env.DATABASE_URL = url;
  return url;
}

function createPrismaClient() {
  ensureDatabaseUrl();
  return new PrismaClient({
    log: ["error"],
  });
}

export const prisma: PrismaClient =
  globalThis[GLOBAL_KEY] ?? (globalThis[GLOBAL_KEY] = createPrismaClient());

if (process.env.NODE_ENV !== "production") {
  globalThis[GLOBAL_KEY] = prisma;
}
