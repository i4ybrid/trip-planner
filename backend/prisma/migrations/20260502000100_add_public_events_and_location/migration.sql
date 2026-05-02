-- CreateEnum
CREATE TYPE "UserLocationSource" AS ENUM ('PROFILE', 'BROWSER', 'IP_INFERRED');

-- CreateEnum
CREATE TYPE "PublicEventStatus" AS ENUM ('DRAFT', 'PENDING_PAYMENT', 'PUBLISHED', 'ARCHIVED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PromotionPaymentStatus" AS ENUM ('PENDING', 'REQUIRES_ACTION', 'PAID', 'FAILED', 'REFUNDED', 'CANCELLED');

-- AlterTable
ALTER TABLE "User"
ADD COLUMN "city" TEXT,
ADD COLUMN "state" TEXT,
ADD COLUMN "country" TEXT DEFAULT 'US',
ADD COLUMN "latitude" DECIMAL(9,6),
ADD COLUMN "longitude" DECIMAL(9,6),
ADD COLUMN "locationSource" "UserLocationSource";

-- CreateTable
CREATE TABLE "PublicEvent" (
    "id" TEXT NOT NULL,
    "organizerId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "venueName" TEXT,
    "addressLine" TEXT,
    "city" TEXT NOT NULL,
    "state" TEXT,
    "country" TEXT NOT NULL DEFAULT 'US',
    "latitude" DECIMAL(9,6),
    "longitude" DECIMAL(9,6),
    "regionRadiusMiles" INTEGER NOT NULL DEFAULT 50,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "coverImage" TEXT,
    "status" "PublicEventStatus" NOT NULL DEFAULT 'DRAFT',
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "publishedAt" TIMESTAMP(3),
    "promotionStartsAt" TIMESTAMP(3),
    "promotionEndsAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PublicEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PublicEventPromotionPayment" (
    "id" TEXT NOT NULL,
    "publicEventId" TEXT NOT NULL,
    "organizerId" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "provider" TEXT NOT NULL DEFAULT 'mock',
    "providerCheckoutId" TEXT,
    "providerPaymentIntentId" TEXT,
    "checkoutUrl" TEXT,
    "status" "PromotionPaymentStatus" NOT NULL DEFAULT 'PENDING',
    "regionCity" TEXT,
    "regionState" TEXT,
    "regionCountry" TEXT DEFAULT 'US',
    "regionRadiusMiles" INTEGER NOT NULL DEFAULT 50,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3) NOT NULL,
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PublicEventPromotionPayment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PublicEvent_organizerId_idx" ON "PublicEvent"("organizerId");

-- CreateIndex
CREATE INDEX "PublicEvent_status_startDate_idx" ON "PublicEvent"("status", "startDate");

-- CreateIndex
CREATE INDEX "PublicEvent_country_state_city_idx" ON "PublicEvent"("country", "state", "city");

-- CreateIndex
CREATE INDEX "PublicEventPromotionPayment_publicEventId_status_idx" ON "PublicEventPromotionPayment"("publicEventId", "status");

-- CreateIndex
CREATE INDEX "PublicEventPromotionPayment_organizerId_createdAt_idx" ON "PublicEventPromotionPayment"("organizerId", "createdAt");

-- CreateIndex
CREATE INDEX "PublicEventPromotionPayment_regionCountry_regionState_regionCity_idx" ON "PublicEventPromotionPayment"("regionCountry", "regionState", "regionCity");

-- AddForeignKey
ALTER TABLE "PublicEvent" ADD CONSTRAINT "PublicEvent_organizerId_fkey" FOREIGN KEY ("organizerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PublicEventPromotionPayment" ADD CONSTRAINT "PublicEventPromotionPayment_publicEventId_fkey" FOREIGN KEY ("publicEventId") REFERENCES "PublicEvent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PublicEventPromotionPayment" ADD CONSTRAINT "PublicEventPromotionPayment_organizerId_fkey" FOREIGN KEY ("organizerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
