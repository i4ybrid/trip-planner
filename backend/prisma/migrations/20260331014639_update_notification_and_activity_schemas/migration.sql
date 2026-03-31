/*
  Warnings:

  - You are about to drop the column `actionId` on the `Notification` table. All the data in the column will be lost.
  - You are about to drop the column `actionType` on the `Notification` table. All the data in the column will be lost.
  - You are about to drop the column `actionUrl` on the `Notification` table. All the data in the column will be lost.
  - You are about to drop the column `priority` on the `Notification` table. All the data in the column will be lost.
  - You are about to drop the column `read` on the `Notification` table. All the data in the column will be lost.
  - You are about to drop the column `scheduledFor` on the `Notification` table. All the data in the column will be lost.
  - You are about to drop the column `tripId` on the `Notification` table. All the data in the column will be lost.
  - You are about to drop the column `type` on the `Notification` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "ActivityStatus" AS ENUM ('PROPOSED', 'CONFIRMED', 'REJECTED');

-- CreateEnum
CREATE TYPE "NotificationCategory" AS ENUM ('MILESTONE', 'INVITE', 'FRIEND', 'PAYMENT', 'SETTLEMENT', 'CHAT', 'MEMBER');

-- CreateEnum
CREATE TYPE "NotificationReferenceType" AS ENUM ('TRIP', 'INVITE', 'FRIEND_REQUEST', 'BILL_SPLIT', 'MILESTONE', 'MESSAGE', 'USER');

-- CreateEnum
CREATE TYPE "CostType" AS ENUM ('PER_PERSON', 'FIXED');

-- AlterEnum
ALTER TYPE "MemberStatus" ADD VALUE 'PENDING_JOIN';

-- DropForeignKey
ALTER TABLE "Notification" DROP CONSTRAINT "Notification_tripId_fkey";

-- DropForeignKey
ALTER TABLE "Notification" DROP CONSTRAINT "Notification_userId_fkey";

-- AlterTable
ALTER TABLE "Activity" ADD COLUMN     "confirmedAt" TIMESTAMP(3),
ADD COLUMN     "confirmedBy" TEXT,
ADD COLUMN     "costType" "CostType" NOT NULL DEFAULT 'PER_PERSON',
ADD COLUMN     "rejectedAt" TIMESTAMP(3),
ADD COLUMN     "rejectedBy" TEXT,
ADD COLUMN     "status" "ActivityStatus" NOT NULL DEFAULT 'PROPOSED';

-- AlterTable
ALTER TABLE "BillSplit" ADD COLUMN     "costType" "CostType" NOT NULL DEFAULT 'PER_PERSON';

-- AlterTable
ALTER TABLE "Milestone" ADD COLUMN     "firstOverdueNotifiedAt" TIMESTAMP(3),
ADD COLUMN     "reminderAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Notification" DROP COLUMN "actionId",
DROP COLUMN "actionType",
DROP COLUMN "actionUrl",
DROP COLUMN "priority",
DROP COLUMN "read",
DROP COLUMN "scheduledFor",
DROP COLUMN "tripId",
DROP COLUMN "type",
ADD COLUMN     "category" "NotificationCategory" NOT NULL DEFAULT 'MILESTONE',
ADD COLUMN     "isRead" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "link" TEXT,
ADD COLUMN     "referenceId" TEXT,
ADD COLUMN     "referenceType" "NotificationReferenceType";

-- AlterTable
ALTER TABLE "TripMember" ALTER COLUMN "role" SET DEFAULT 'VIEWER';

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "emailNotificationsEnabled" BOOLEAN NOT NULL DEFAULT true;

-- DropEnum
DROP TYPE "NotificationType";

-- CreateTable
CREATE TABLE "NotificationPreference" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "category" "NotificationCategory" NOT NULL,
    "inApp" BOOLEAN NOT NULL DEFAULT true,
    "email" BOOLEAN NOT NULL DEFAULT false,
    "push" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "NotificationPreference_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PushSubscription" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "p256dh" TEXT NOT NULL,
    "auth" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PushSubscription_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "NotificationPreference_userId_category_key" ON "NotificationPreference"("userId", "category");

-- CreateIndex
CREATE UNIQUE INDEX "PushSubscription_userId_key" ON "PushSubscription"("userId");

-- CreateIndex
CREATE INDEX "BillSplit_tripId_status_idx" ON "BillSplit"("tripId", "status");

-- CreateIndex
CREATE INDEX "Notification_userId_isRead_createdAt_idx" ON "Notification"("userId", "isRead", "createdAt");

-- CreateIndex
CREATE INDEX "Notification_userId_category_idx" ON "Notification"("userId", "category");

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificationPreference" ADD CONSTRAINT "NotificationPreference_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PushSubscription" ADD CONSTRAINT "PushSubscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
