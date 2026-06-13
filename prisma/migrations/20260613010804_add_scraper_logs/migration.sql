-- CreateEnum
CREATE TYPE "ScraperRunStatus" AS ENUM ('RUNNING', 'SUCCESS', 'PARTIAL', 'FAILED');

-- CreateTable
CREATE TABLE "ScraperLog" (
    "id" TEXT NOT NULL,
    "sourceId" TEXT,
    "status" "ScraperRunStatus" NOT NULL DEFAULT 'RUNNING',
    "itemsFound" INTEGER NOT NULL DEFAULT 0,
    "itemsCreated" INTEGER NOT NULL DEFAULT 0,
    "itemsUpdated" INTEGER NOT NULL DEFAULT 0,
    "itemsSkipped" INTEGER NOT NULL DEFAULT 0,
    "errorMessage" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMP(3),
    "durationMs" INTEGER,

    CONSTRAINT "ScraperLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ScraperLog_sourceId_startedAt_idx" ON "ScraperLog"("sourceId", "startedAt");

-- AddForeignKey
ALTER TABLE "ScraperLog" ADD CONSTRAINT "ScraperLog_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "Source"("id") ON DELETE SET NULL ON UPDATE CASCADE;
