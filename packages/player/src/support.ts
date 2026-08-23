import { prisma, sendMessage } from "@game-platform/commons";

export async function createTicket(playerId: string, subject: string, body: string) {
  const thread = await prisma.chatThread.create({
    data: {
      kind: "SUPPORT",
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
    include: { ticketMeta: true },
  });
}

export async function viewTicket(playerId: string, threadId: string) {
  const isParticipant = await prisma.chatParticipant.findUnique({
    where: { threadId_accountId: { threadId, accountId: playerId } },
  });
  if (!isParticipant) throw new Error("Forbidden");

  const thread = await prisma.chatThread.findUnique({
    where: { id: threadId },
    include: { messages: true, ticketMeta: true },
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
