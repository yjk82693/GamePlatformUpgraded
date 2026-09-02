import { prisma } from "@game-platform/commons";

async function canAccess(actorId: string, workspaceId: string): Promise<boolean> {
  const member = await prisma.member.findFirst({ where: { accountId: actorId } });
  return !!member; // staff-only workspace; no per-workspace membership table yet
}

async function canEdit(actorId: string, docId: string): Promise<boolean> {
  const share = await prisma.documentShare.findUnique({
    where: { docId_memberId: { docId, memberId: actorId } },
  });
  return !!share;
}

export async function createDocument(actorId: string, workspaceId: string, path: string, blobRef: string) {
  if (!(await canAccess(actorId, workspaceId))) throw new Error("Forbidden");

  const doc = await prisma.document.create({
    data: { workspaceId, path, currentVersion: 1 },
  });
  await prisma.documentVersion.create({
    data: { documentId: doc.id, version: 1, blobRef, authorId: actorId },
  });
  await prisma.documentShare.create({
    data: { docId: doc.id, memberId: actorId, access: "EDIT" },
  });
  return doc;
}

export async function listDocuments(actorId: string, workspaceId: string, path?: string) {
  if (!(await canAccess(actorId, workspaceId))) throw new Error("Forbidden");
  return prisma.document.findMany({
    where: { workspaceId, ...(path ? { path } : {}) },
  });
}

export async function openDocument(actorId: string, docId: string) {
  const doc = await prisma.document.findUnique({ where: { id: docId } });
  if (!doc) throw new Error("Document not found");
  const versions = await prisma.documentVersion.findMany({
    where: { documentId: docId, version: doc.currentVersion },
  });
  return { doc, content: versions[0]?.blobRef ?? null, version: doc.currentVersion };
}

export async function saveDocument(actorId: string, docId: string, blobRef: string) {
  if (!(await canEdit(actorId, docId))) throw new Error("Forbidden");
  const doc = await prisma.document.findUnique({ where: { id: docId } });
  if (!doc) throw new Error("Document not found");

  const next = doc.currentVersion + 1;
  await prisma.documentVersion.create({
    data: { documentId: docId, version: next, blobRef, authorId: actorId },
  });
  return prisma.document.update({ where: { id: docId }, data: { currentVersion: next } });
}

export async function shareDocument(actorId: string, docId: string, memberId: string, access: string) {
  if (!(await canEdit(actorId, docId))) throw new Error("Forbidden: must already have access to share");
  return prisma.documentShare.upsert({
    where: { docId_memberId: { docId, memberId } },
    create: { docId, memberId, access },
    update: { access },
  });
}

export async function listVersions(docId: string) {
  return prisma.documentVersion.findMany({
    where: { documentId: docId },
    orderBy: { version: "desc" },
  });
}

export async function requestRollback(actorId: string, docId: string, targetVersion: number) {
  if (!(await canEdit(actorId, docId))) throw new Error("Forbidden");
  return prisma.rollbackRequest.create({
    data: { docId, targetVersion, byId: actorId, status: "PENDING" },
  });
}

export async function approveRollback(approverId: string, requestId: string) {
  const request = await prisma.rollbackRequest.findUnique({ where: { id: requestId } });
  if (!request) throw new Error("Rollback request not found");
  if (request.byId === approverId) {
    throw new Error("Separation of duties: approver cannot be the requester");
  }
  if (!(await canEdit(approverId, request.docId))) {
    throw new Error("Forbidden: approver must have access to the document");
  }

  const result = await prisma.rollbackRequest.updateMany({
    where: { id: requestId, status: "PENDING" },
    data: { status: "APPROVED" },
  });
  if (result.count === 0) throw new Error("Rollback already handled");

  const old = await prisma.documentVersion.findUnique({
    where: { documentId_version: { documentId: request.docId, version: request.targetVersion } },
  });
  if (!old) throw new Error("Target version not found");

  return saveDocument(approverId, request.docId, old.blobRef);
}

export async function listRollbackRequests(docId: string) {
  return prisma.rollbackRequest.findMany({
    where: { docId },
    orderBy: { id: "desc" },
  });
}
