/*
  Warnings:

  - A unique constraint covering the columns `[accountId,productId]` on the table `Review` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `appId` to the `Product` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "appId" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Review_accountId_productId_key" ON "Review"("accountId", "productId");

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_appId_fkey" FOREIGN KEY ("appId") REFERENCES "App"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
