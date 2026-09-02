import { prisma, createThread, sendMessage, listMessages, fetchSince, addParticipant, removeParticipant } from "@game-platform/commons";
import type { ChatKind } from "@game-platform/commons";

async function allAreStaff(accountIds: string[]): Promise<boolean> {
  const members = await prisma.member.findMany({
    where: { accountId: { in: accountIds } },
  });
  const staffIds = new Set(members.map((m) => m.accountId));
  return accountIds.every((id) => staffIds.has(id));
}

export async function createStaffThread(kind: ChatKind, participantIds: string[]) {
  if (kind !== "GROUP" && kind !== "STAFF_DIRECT") {
    throw new Error("createStaffThread only supports GROUP or STAFF_DIRECT");
  }
  const ok = await allAreStaff(participantIds);
  if (!ok) throw new Error("All participants must be staff members");
  return createThread(kind, participantIds);
}

export { sendMessage, listMessages, fetchSince, addParticipant, removeParticipant };

export async function listMyThreads(actorId: string) {
  return prisma.chatThread.findMany({
    where: {
      kind: { in: ["GROUP", "STAFF_DIRECT"] },
      participants: { some: { accountId: actorId } },
    },
    include: { participants: { include: { account: true } } },
  });
}
