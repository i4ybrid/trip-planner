-- CreateEnum
CREATE TYPE "MilestoneType" AS ENUM ('COMMITMENT_REQUEST', 'COMMITMENT_DEADLINE', 'FINAL_PAYMENT_DUE', 'SETTLEMENT_DUE', 'SETTLEMENT_COMPLETE', 'CUSTOM');

-- CreateEnum
CREATE TYPE "MilestoneActionType" AS ENUM ('PAYMENT_REQUEST', 'SETTLEMENT_REMINDER');

-- CreateEnum
CREATE TYPE "MilestoneStatus" AS ENUM ('PENDING', 'COMPLETED', 'SKIPPED', 'OVERDUE');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "NotificationType" ADD VALUE 'PAYMENT_REQUEST';
ALTER TYPE "NotificationType" ADD VALUE 'SETTLEMENT_REMINDER';

-- AlterTable
ALTER TABLE "Trip" ADD COLUMN     "autoMilestonesGenerated" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "Milestone" (
    "id" TEXT NOT NULL,
    "tripId" TEXT NOT NULL,
    "type" "MilestoneType" NOT NULL,
    "name" TEXT NOT NULL,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "isManualOverride" BOOLEAN NOT NULL DEFAULT false,
    "isSkipped" BOOLEAN NOT NULL DEFAULT false,
    "isLocked" BOOLEAN NOT NULL DEFAULT false,
    "isHard" BOOLEAN NOT NULL DEFAULT true,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Milestone_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MilestoneCompletion" (
    "id" TEXT NOT NULL,
    "milestoneId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" "MilestoneStatus" NOT NULL DEFAULT 'PENDING',
    "completedAt" TIMESTAMP(3),
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MilestoneCompletion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MilestoneAction" (
    "id" TEXT NOT NULL,
    "tripId" TEXT NOT NULL,
    "actionType" "MilestoneActionType" NOT NULL,
    "sentById" TEXT NOT NULL,
    "message" TEXT,
    "recipientIds" TEXT[],
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MilestoneAction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MilestoneCompletion_milestoneId_userId_key" ON "MilestoneCompletion"("milestoneId", "userId");

-- AddForeignKey
ALTER TABLE "Milestone" ADD CONSTRAINT "Milestone_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "Trip"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MilestoneCompletion" ADD CONSTRAINT "MilestoneCompletion_milestoneId_fkey" FOREIGN KEY ("milestoneId") REFERENCES "Milestone"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MilestoneCompletion" ADD CONSTRAINT "MilestoneCompletion_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MilestoneAction" ADD CONSTRAINT "MilestoneAction_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "Trip"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MilestoneAction" ADD CONSTRAINT "MilestoneAction_sentById_fkey" FOREIGN KEY ("sentById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
