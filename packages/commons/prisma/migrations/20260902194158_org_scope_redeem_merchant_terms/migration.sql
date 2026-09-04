/*
  Warnings:

  - A unique constraint covering the columns `[orgId,version]` on the table `Terms` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "Terms_version_key";

-- AlterTable
ALTER TABLE "Merchant" ADD COLUMN     "orgId" TEXT;

-- AlterTable
ALTER TABLE "RedeemCode" ADD COLUMN     "orgId" TEXT;

-- AlterTable
ALTER TABLE "Terms" ADD COLUMN     "orgId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Terms_orgId_version_key" ON "Terms"("orgId", "version");

-- AddForeignKey
ALTER TABLE "Merchant" ADD CONSTRAINT "Merchant_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Org"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RedeemCode" ADD CONSTRAINT "RedeemCode_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Org"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Terms" ADD CONSTRAINT "Terms_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Org"("id") ON DELETE SET NULL ON UPDATE CASCADE;
