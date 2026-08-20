import { prisma } from "./db.js";
import type { ChatKind } from "./db.js";

export async function createThread(kind: ChatKind, participantIds: string[]) {
  return prisma.chatThread.create({
    data: {
      kind,
      participants: {
        create: participantIds.map((accountId) => ({ accountId })),
      },
    },
  });
}

export async function sendMessage(threadId: string, senderId: string, body: string) {
  const isParticipant = await prisma.chatParticipant.findUnique({
    where: { threadId_accountId: { threadId, accountId: senderId } },
  });
  if (!isParticipant) {
    throw new Error("Not a participant of this thread");
  }
  return prisma.chatMessage.create({
    data: { threadId, senderId, body },
  });
}

export async function listMessages(threadId: string, cursor?: Date, take = 50) {
  return prisma.chatMessage.findMany({
    where: {
      threadId,
      ...(cursor ? { createdAt: { lt: cursor } } : {}),
    },
    orderBy: { createdAt: "desc" },
    take,
  });
}

export async function fetchSince(threadId: string, afterMessageId: string) {
  const anchor = await prisma.chatMessage.findUnique({ where: { id: afterMessageId } });
  if (!anchor) {
    throw new Error("Anchor message not found");
  }
  return prisma.chatMessage.findMany({
    where: { threadId, createdAt: { gt: anchor.createdAt } },
    orderBy: { createdAt: "asc" },
  });
}

export async function addParticipant(threadId: string, accountId: string) {
  return prisma.chatParticipant.upsert({
    where: { threadId_accountId: { threadId, accountId } },
    create: { threadId, accountId },
    update: {},
  });
}

export async function removeParticipant(threadId: string, accountId: string): Promise<void> {
  await prisma.chatParticipant.deleteMany({ where: { threadId, accountId } });
}
