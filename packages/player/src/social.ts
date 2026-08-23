import { prisma, createThread, sendMessage } from "@game-platform/commons";

export async function findBetween(a: string, b: string) {
  return prisma.friendship.findFirst({
    where: {
      OR: [
        { requesterId: a, addresseeId: b },
        { requesterId: b, addresseeId: a },
      ],
    },
  });
}

export async function addFriend(me: string, friendCode: string) {
  const other = await prisma.playerProfile.findUnique({ where: { friendCode } });
  if (!other || other.accountId === me) throw new Error("Invalid friend code");

  const existing = await findBetween(me, other.accountId);
  if (existing) throw new Error("Already friends or pending");

  return prisma.friendship.create({
    data: { requesterId: me, addresseeId: other.accountId, status: "PENDING" },
  });
}

export async function acceptFriend(me: string, requestId: string) {
  const result = await prisma.friendship.updateMany({
    where: { id: requestId, addresseeId: me, status: "PENDING" },
    data: { status: "ACCEPTED" },
  });
  if (result.count === 0) throw new Error("Request not found or not yours to accept");
  return prisma.friendship.findUnique({ where: { id: requestId } });
}

export async function rejectFriend(me: string, requestId: string) {
  const result = await prisma.friendship.deleteMany({
    where: { id: requestId, addresseeId: me, status: "PENDING" },
  });
  if (result.count === 0) throw new Error("Request not found or not yours to reject");
}

export async function cancelRequest(me: string, requestId: string) {
  const result = await prisma.friendship.deleteMany({
    where: { id: requestId, requesterId: me, status: "PENDING" },
  });
  if (result.count === 0) throw new Error("Request not found or not yours to cancel");
}

export async function removeFriend(me: string, otherId: string) {
  await prisma.friendship.deleteMany({
    where: {
      OR: [
        { requesterId: me, addresseeId: otherId },
        { requesterId: otherId, addresseeId: me },
      ],
    },
  });
}

export async function listFriends(me: string) {
  const friendships = await prisma.friendship.findMany({
    where: {
      status: "ACCEPTED",
      OR: [{ requesterId: me }, { addresseeId: me }],
    },
  });
  return friendships.map((f) => (f.requesterId === me ? f.addresseeId : f.requesterId));
}

export async function sendDm(me: string, friendId: string, body: string) {
  const friendship = await findBetween(me, friendId);
  if (!friendship || friendship.status !== "ACCEPTED") {
    throw new Error("Not friends");
  }

  let thread = await prisma.chatThread.findFirst({
    where: {
      kind: "PLAYER_DIRECT",
      participants: {
        every: { accountId: { in: [me, friendId] } },
      },
      AND: [
        { participants: { some: { accountId: me } } },
        { participants: { some: { accountId: friendId } } },
      ],
    },
  });

  if (!thread) {
    thread = await createThread("PLAYER_DIRECT", [me, friendId]);
  }

  return sendMessage(thread.id, me, body);
}
