-- AlterTable
ALTER TABLE "Activity" ADD COLUMN     "searchVector" tsvector;

-- AlterTable
ALTER TABLE "BillSplit" ADD COLUMN     "receiptUrl" TEXT,
ADD COLUMN     "searchVector" tsvector;

-- AlterTable
ALTER TABLE "Trip" ADD COLUMN     "searchVector" tsvector;

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
CREATE INDEX "Activity_searchVector_idx" ON "Activity" USING GIN ("searchVector");

-- CreateIndex
CREATE INDEX "BillSplit_searchVector_idx" ON "BillSplit" USING GIN ("searchVector");

-- CreateIndex
CREATE INDEX "Trip_searchVector_idx" ON "Trip" USING GIN ("searchVector");

-- AddForeignKey
ALTER TABLE "PasswordResetToken" ADD CONSTRAINT "PasswordResetToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
