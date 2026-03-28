-- Timeline Engine Phase 1: Add actorId, targetId, metadata to TimelineEvent
ALTER TABLE "TimelineEvent" ADD COLUMN "actorId" TEXT;
ALTER TABLE "TimelineEvent" ADD COLUMN "targetId" TEXT;
ALTER TABLE "TimelineEvent" ADD COLUMN "metadata" JSONB;
