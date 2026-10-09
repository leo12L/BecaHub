-- AlterTable
ALTER TABLE "Scholarship" ADD COLUMN "fingerprint" TEXT,
ADD COLUMN "rawPayload" JSONB,
ADD COLUMN "validationErrors" JSONB;

-- CreateIndex
CREATE UNIQUE INDEX "Scholarship_fingerprint_key" ON "Scholarship"("fingerprint");
