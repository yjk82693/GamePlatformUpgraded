-- CreateTable
CREATE TABLE "VersionComment" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "authorId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "parentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VersionComment_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "VersionComment" ADD CONSTRAINT "VersionComment_documentId_version_fkey" FOREIGN KEY ("documentId", "version") REFERENCES "DocumentVersion"("documentId", "version") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VersionComment" ADD CONSTRAINT "VersionComment_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "Account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VersionComment" ADD CONSTRAINT "VersionComment_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "VersionComment"("id") ON DELETE SET NULL ON UPDATE CASCADE;
