-- CreateTable
CREATE TABLE "PersonaRelationship" (
    "accountId" TEXT NOT NULL,
    "personaId" TEXT NOT NULL,
    "repairResilience" INTEGER NOT NULL DEFAULT 0,
    "warmSince" TIMESTAMP(3),
    "lastHostilityAt" TIMESTAMP(3),

    CONSTRAINT "PersonaRelationship_pkey" PRIMARY KEY ("accountId","personaId")
);

-- AddForeignKey
ALTER TABLE "PersonaRelationship" ADD CONSTRAINT "PersonaRelationship_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
