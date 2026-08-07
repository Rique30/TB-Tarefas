-- Local filesystem uploads never persist on Vercel's serverless runtime, so
-- previously stored attachment rows point at files that no longer exist.
-- Clear them before switching attachments to store their bytes in the database.
DELETE FROM "AircraftAttachment";
DELETE FROM "ExpiryAttachment";
DELETE FROM "MaintenanceAttachment";
DELETE FROM "Attachment";

-- AlterTable
ALTER TABLE "AircraftAttachment" DROP COLUMN "url",
  ADD COLUMN "mimeType" TEXT NOT NULL,
  ADD COLUMN "data" BYTEA NOT NULL;

-- AlterTable
ALTER TABLE "Attachment" DROP COLUMN "url",
  ADD COLUMN "mimeType" TEXT NOT NULL,
  ADD COLUMN "data" BYTEA NOT NULL;

-- AlterTable
ALTER TABLE "ExpiryAttachment" DROP COLUMN "url",
  ADD COLUMN "mimeType" TEXT NOT NULL,
  ADD COLUMN "data" BYTEA NOT NULL;

-- AlterTable
ALTER TABLE "MaintenanceAttachment" DROP COLUMN "url",
  ADD COLUMN "mimeType" TEXT NOT NULL,
  ADD COLUMN "data" BYTEA NOT NULL;
