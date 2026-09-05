import { prisma, sendMessage } from "@game-platform/commons";

export async function createTicket(playerId: string, appId: string, subject: string, body: string) {
  const app = await prisma.app.findUnique({ where: { id: appId } });
  if (!app) throw new Error("Game not found");

  const thread = await prisma.chatThread.create({
    data: {
      kind: "SUPPORT",
      orgId: app.ownerOrgId,
      participants: { create: { accountId: playerId } },
      ticketMeta: { create: { status: "OPEN" } },
    },
  });
  await sendMessage(thread.id, playerId, `${subject}\n\n${body}`);
  return thread;
}

export async function listTickets(playerId: string) {
  return prisma.chatThread.findMany({
    where: {
      kind: "SUPPORT",
      participants: { some: { accountId: playerId } },
    },
    include: { ticketMeta: true, org: true },
  });
}

export async function viewTicket(playerId: string, threadId: string) {
  const isParticipant = await prisma.chatParticipant.findUnique({
    where: { threadId_accountId: { threadId, accountId: playerId } },
  });
  if (!isParticipant) throw new Error("Forbidden");

  const thread = await prisma.chatThread.findUnique({
    where: { id: threadId },
    include: { messages: true, ticketMeta: true, org: true },
  });
  if (!thread) throw new Error("Ticket not found");
  return thread;
}

export async function replyTicket(playerId: string, threadId: string, body: string) {
  const isParticipant = await prisma.chatParticipant.findUnique({
    where: { threadId_accountId: { threadId, accountId: playerId } },
  });
  if (!isParticipant) throw new Error("Forbidden");
  return sendMessage(threadId, playerId, body);
}
