-- CreateTable
CREATE TABLE "LogEvent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "ts" DATETIME NOT NULL,
    "level" TEXT NOT NULL,
    "service" TEXT,
    "prefix" TEXT,
    "msg" TEXT NOT NULL,
    "meta" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Blog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "visibility" TEXT NOT NULL DEFAULT 'private',
    "ownerKey" TEXT NOT NULL,
    "ownerName" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE INDEX "LogEvent_ts_idx" ON "LogEvent"("ts" DESC);

-- CreateIndex
CREATE INDEX "LogEvent_level_idx" ON "LogEvent"("level");

-- CreateIndex
CREATE UNIQUE INDEX "Blog_slug_key" ON "Blog"("slug");

-- CreateIndex
CREATE INDEX "Blog_ownerKey_idx" ON "Blog"("ownerKey");

-- CreateIndex
CREATE INDEX "Blog_visibility_idx" ON "Blog"("visibility");
