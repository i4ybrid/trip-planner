-- Create Expense table for tracking trip expenses
CREATE TABLE "Expense" (
    "id" TEXT NOT NULL,
    "tripId" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'other',
    "payerId" TEXT NOT NULL,
    "date" TIMESTAMP NOT NULL DEFAULT NOW(),
    "splitType" TEXT NOT NULL DEFAULT 'equal',
    "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT "Expense_pkey" PRIMARY KEY ("id")
);

-- Create indexes for common queries
CREATE INDEX "Expense_tripId_idx" ON "Expense"("tripId");
CREATE INDEX "Expense_payerId_idx" ON "Expense"("payerId");
CREATE INDEX "Expense_date_idx" ON "Expense"("date");

-- Add foreign key constraints
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "Trip"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_payerId_fkey" FOREIGN KEY ("payerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
