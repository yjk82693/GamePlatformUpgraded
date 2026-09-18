-- CreateEnum
CREATE TYPE "HeldCallStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateTable
CREATE TABLE "HeldCall" (
    "id" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "proposedAction" "Action" NOT NULL,
    "targetType" "Target" NOT NULL,
    "targetId" TEXT NOT NULL,
    "payload" JSONB,
    "status" "HeldCallStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "decidedAt" TIMESTAMP(3),
    "decidedBy" TEXT,

    CONSTRAINT "HeldCall_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "HeldCall" ADD CONSTRAINT "HeldCall_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "Account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
