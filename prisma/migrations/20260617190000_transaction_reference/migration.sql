-- AlterTable: add human readable reference (table is empty in development)
ALTER TABLE "Transaction" ADD COLUMN "reference" TEXT NOT NULL;

-- AlterTable: default new workspaces to GHS
ALTER TABLE "Tenant" ALTER COLUMN "currency" SET DEFAULT 'GHS';

-- CreateIndex: reference is unique per tenant
CREATE UNIQUE INDEX "Transaction_tenantId_reference_key" ON "Transaction"("tenantId", "reference");
