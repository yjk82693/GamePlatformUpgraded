/*
  Warnings:

  - A unique constraint covering the columns `[domain]` on the table `Org` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Org" ADD COLUMN     "domain" TEXT;

-- AlterTable
ALTER TABLE "Role" ADD COLUMN     "orgId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Org_domain_key" ON "Org"("domain");

-- AddForeignKey
ALTER TABLE "Role" ADD CONSTRAINT "Role_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Org"("id") ON DELETE SET NULL ON UPDATE CASCADE;
