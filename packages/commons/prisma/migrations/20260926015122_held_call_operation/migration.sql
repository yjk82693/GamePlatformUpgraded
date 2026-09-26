/*
  Warnings:

  - Added the required column `operation` to the `HeldCall` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "HeldCall" ADD COLUMN     "operation" TEXT NOT NULL;
