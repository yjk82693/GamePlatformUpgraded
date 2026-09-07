-- CreateEnum
CREATE TYPE "ProductKind" AS ENUM ('GAME', 'DLC', 'CONSUMABLE');

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "kind" "ProductKind" NOT NULL DEFAULT 'CONSUMABLE';
