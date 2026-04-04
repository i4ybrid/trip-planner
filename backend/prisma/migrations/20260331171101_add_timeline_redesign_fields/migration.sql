-- CreateEnum
CREATE TYPE "TimelineEventKind" AS ENUM ('EVENT', 'MILESTONE', 'ACTIVITY_START', 'ACTIVITY_END');

-- CreateEnum
CREATE TYPE "RefreshState" AS ENUM ('TRUE', 'REFRESHING', 'FALSE');

-- DropIndex
DROP INDEX "TimelineEvent_tripId_createdAt_idx";

-- AlterTable
ALTER TABLE "TimelineEvent" ADD COLUMN     "activityId" TEXT,
ADD COLUMN     "effectiveDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "icon" TEXT,
ADD COLUMN     "kind" "TimelineEventKind" NOT NULL DEFAULT 'EVENT',
ADD COLUMN     "meta" TEXT,
ADD COLUMN     "sourceId" TEXT,
ADD COLUMN     "sourceType" TEXT,
ADD COLUMN     "title" TEXT,
ALTER COLUMN "eventType" DROP NOT NULL,
ALTER COLUMN "description" DROP NOT NULL;

-- CreateTable
CREATE TABLE "TripTimelineUIState" (
    "tripId" TEXT NOT NULL,
    "cachedEventIds" TEXT NOT NULL,
    "needsRefresh" "RefreshState" NOT NULL DEFAULT 'TRUE',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TripTimelineUIState_pkey" PRIMARY KEY ("tripId")
);

-- CreateIndex
CREATE UNIQUE INDEX "TripTimelineUIState_tripId_key" ON "TripTimelineUIState"("tripId");

-- CreateIndex
CREATE INDEX "TimelineEvent_tripId_effectiveDate_idx" ON "TimelineEvent"("tripId", "effectiveDate" DESC);

-- CreateIndex
CREATE INDEX "TimelineEvent_sourceType_sourceId_idx" ON "TimelineEvent"("sourceType", "sourceId");

-- Backfill effectiveDate = createdAt for all existing rows
UPDATE "TimelineEvent" SET "effectiveDate" = "createdAt";

-- AddForeignKey
ALTER TABLE "TripTimelineUIState" ADD CONSTRAINT "TripTimelineUIState_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "Trip"("id") ON DELETE CASCADE ON UPDATE CASCADE;
