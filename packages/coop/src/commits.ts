import { prisma } from "@game-platform/commons";

export async function listAllVersions(workspaceId: string) {
  return prisma.documentVersion.findMany({
    where: { document: { workspaceId } },
    include: { document: true, author: true },
    orderBy: { createdAt: "desc" },
  });
}

export async function addComment(
  actorId: string,
  documentId: string,
  version: number,
  body: string,
  parentId?: string
) {
  return prisma.versionComment.create({
    data: {
      documentId,
      version,
      authorId: actorId,
      body,
      ...(parentId ? { parentId } : {}),
    },
    include: { author: true },
  });
}

export async function listComments(documentId: string, version: number) {
  return prisma.versionComment.findMany({
    where: { documentId, version },
    include: { author: true },
    orderBy: { createdAt: "asc" },
  });
}
