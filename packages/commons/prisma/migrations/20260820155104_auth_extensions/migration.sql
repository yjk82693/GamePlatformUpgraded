/*
  Warnings:

  - A unique constraint covering the columns `[externalId]` on the table `Account` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "AuthProvider" AS ENUM ('MANUAL', 'GOOGLE', 'APPLE');

-- AlterTable
ALTER TABLE "Account" ADD COLUMN     "authProvider" "AuthProvider" NOT NULL DEFAULT 'MANUAL',
ADD COLUMN     "externalId" TEXT,
ADD COLUMN     "resetCode" TEXT,
ADD COLUMN     "resetCodeExpiresAt" TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX "Account_externalId_key" ON "Account"("externalId");
