import { PrismaClient } from "@prisma/client";
import { mkdirSync } from "fs";
import { dirname, join, resolve } from "path";

const GLOBAL_KEY = "__PRISMA_CLIENT_SINGLETON__";

declare global {
  var __PRISMA_CLIENT_SINGLETON__: PrismaClient | undefined;
}

// Prisma CLI resolves relative SQLite paths relative to the schema file (prisma/).
// Prisma Client resolves them relative to process.cwd(). We normalise to an
// absolute path here so both always agree on the same file on disk.
const SCHEMA_DIR = resolve(process.cwd(), "prisma");

function ensureDatabaseUrl() {
  const configured = process.env.DATABASE_URL?.trim();
  const defaultPath = join(SCHEMA_DIR, "data", "app.sqlite");

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
    : resolve(SCHEMA_DIR, rawPath);

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
