import { prisma, requirePermission, sendMessage } from "@game-platform/commons";
import type { Prisma } from "@game-platform/commons";

export async function listTickets(actorId: string, filter?: { status?: "OPEN" | "SOLVED" }) {
  await requirePermission(actorId, "READ", "SETTING");
  const where: Prisma.ChatThreadWhereInput = { kind: "SUPPORT" };
  if (filter?.status) {
    where.ticketMeta = { status: filter.status };
  }
  return prisma.chatThread.findMany({
    where,
    include: { ticketMeta: true },
    orderBy: { id: "desc" },
  });
}

export async function claimTicket(actorId: string, threadId: string) {
  await requirePermission(actorId, "UPDATE", "SETTING");
  const result = await prisma.ticketMeta.updateMany({
    where: { threadId, assigneeId: null },
    data: { assigneeId: actorId },
  });
  if (result.count === 0) throw new Error("Already claimed");
  await prisma.chatParticipant.upsert({
    where: { threadId_accountId: { threadId, accountId: actorId } },
    create: { threadId, accountId: actorId },
    update: {},
  });
  return prisma.ticketMeta.findUnique({ where: { threadId } });
}

export async function replyTicket(actorId: string, threadId: string, body: string) {
  await requirePermission(actorId, "UPDATE", "SETTING");
  return sendMessage(threadId, actorId, body);
}

export async function markSolved(actorId: string, threadId: string) {
  await requirePermission(actorId, "UPDATE", "SETTING");
  const result = await prisma.ticketMeta.updateMany({
    where: { threadId, status: "OPEN" },
    data: { status: "SOLVED" },
  });
  if (result.count === 0) throw new Error("Ticket already solved or not found");
  return prisma.ticketMeta.findUnique({ where: { threadId } });
}
