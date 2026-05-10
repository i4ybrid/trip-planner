/*
  Warnings:

  - The `category` column on the `Expense` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `splitType` column on the `Expense` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "ExpenseCategory" AS ENUM ('FOOD', 'TRANSPORT', 'LODGING', 'ACTIVITIES', 'OTHER');

-- DropForeignKey
ALTER TABLE "Expense" DROP CONSTRAINT "Expense_payerId_fkey";

-- DropIndex
DROP INDEX "Expense_date_idx";

-- DropIndex
DROP INDEX "Expense_tripId_idx";

-- AlterTable
ALTER TABLE "BillSplit" ADD COLUMN     "receiptUrl" TEXT;

-- AlterTable
ALTER TABLE "Expense" DROP COLUMN "category",
ADD COLUMN     "category" "ExpenseCategory" NOT NULL DEFAULT 'OTHER',
ALTER COLUMN "date" SET DATA TYPE TIMESTAMP(3),
DROP COLUMN "splitType",
ADD COLUMN     "splitType" "SplitType" NOT NULL DEFAULT 'EQUAL',
ALTER COLUMN "createdAt" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "updatedAt" DROP DEFAULT,
ALTER COLUMN "updatedAt" SET DATA TYPE TIMESTAMP(3);

-- CreateTable
CREATE TABLE "PasswordResetToken" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "userId" TEXT NOT NULL,

    CONSTRAINT "PasswordResetToken_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PasswordResetToken_email_idx" ON "PasswordResetToken"("email");

-- CreateIndex
CREATE INDEX "Expense_tripId_date_idx" ON "Expense"("tripId", "date");

-- AddForeignKey
ALTER TABLE "PasswordResetToken" ADD CONSTRAINT "PasswordResetToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_payerId_fkey" FOREIGN KEY ("payerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- RenameIndex
ALTER INDEX "PublicEventPromotionPayment_regionCountry_regionState_regionCit" RENAME TO "PublicEventPromotionPayment_regionCountry_regionState_regio_idx";
