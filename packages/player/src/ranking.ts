import { prisma } from "@game-platform/commons";
import type { BoardScope } from "@game-platform/commons";

export async function submitScore(playerId: string, boardId: string, value: number) {
  const board = await prisma.leaderboard.findUnique({ where: { id: boardId } });
  if (!board || board.closed) throw new Error("Board closed");

  const existing = await prisma.score.findUnique({
    where: { boardId_accountId: { boardId, accountId: playerId } },
  });
  if (existing && existing.value >= value) return existing;

  return prisma.score.upsert({
    where: { boardId_accountId: { boardId, accountId: playerId } },
    create: { boardId, accountId: playerId, value },
    update: { value },
  });
}

export async function viewRankings(boardId: string, scope: BoardScope, viewerId?: string) {
  let accountFilter: { in: string[] } | undefined;
  if (scope === "FRIENDS" && viewerId) {
    const friendships = await prisma.friendship.findMany({
      where: {
        status: "ACCEPTED",
        OR: [{ requesterId: viewerId }, { addresseeId: viewerId }],
      },
    });
    const ids = friendships.map((f) =>
      f.requesterId === viewerId ? f.addresseeId : f.requesterId
    );
    accountFilter = { in: ids };
  }

  const scores = await prisma.score.findMany({
    where: {
      boardId,
      ...(accountFilter ? { accountId: accountFilter } : {}),
    },
    orderBy: { value: "desc" },
    include: { account: { include: { playerProfile: true } } },
  });

  return scores.map((s, i) => ({
    rank: i + 1,
    accountId: s.accountId,
    displayName: s.account.playerProfile?.displayName ?? "Unknown Player",
    value: s.value,
  }));
}

export async function myRank(playerId: string, boardId: string) {
  const mine = await prisma.score.findUnique({
    where: { boardId_accountId: { boardId, accountId: playerId } },
  });
  if (!mine) return null;
  const higherCount = await prisma.score.count({
    where: { boardId, value: { gt: mine.value } },
  });
  return higherCount + 1;
}

export async function searchPlayer(query: string) {
  return prisma.playerProfile.findMany({
    where: { displayName: { contains: query, mode: "insensitive" } },
  });
}

export async function viewAchievements(playerId: string) {
  return prisma.achievementUnlock.findMany({
    where: { accountId: playerId },
    include: { achievement: true },
  });
}

export async function listBoardsForApp(appId: string) {
  return prisma.leaderboard.findMany({ where: { appId } });
}

export async function viewAchievementsForApp(playerId: string, appId: string) {
  return prisma.achievementUnlock.findMany({
    where: { accountId: playerId, achievement: { group: { appId } } },
    include: { achievement: true },
  });
}

export async function getGameMode(appId: string): Promise<"MULTI" | "SOLO"> {
  const board = await prisma.leaderboard.findFirst({ where: { appId } });
  return board ? "MULTI" : "SOLO";
}
