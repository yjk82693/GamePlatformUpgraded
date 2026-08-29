import { prisma } from "@game-platform/commons";

export async function getGameSummary(playerId: string, appId: string) {
  const status = await prisma.gameStatus.findUnique({
    where: { accountId_appId: { accountId: playerId, appId } },
  });
  return status?.data ?? null;
}

export async function getAchievementProgress(playerId: string, appId: string) {
  const groups = await prisma.achievementGroup.findMany({
    where: { appId },
    include: {
      achievements: {
        include: { unlocks: { where: { accountId: playerId } } },
      },
    },
  });
  return groups.map((g) => ({
    id: g.id,
    name: g.name,
    total: g.achievements.length,
    obtained: g.achievements.filter((a) => a.unlocks.length > 0).length,
  }));
}

export async function getAchievementGroupDetail(playerId: string, groupId: string) {
  const group = await prisma.achievementGroup.findUnique({
    where: { id: groupId },
    include: {
      achievements: {
        include: { unlocks: { where: { accountId: playerId } } },
      },
    },
  });
  if (!group) throw new Error("Group not found");
  return {
    name: group.name,
    achievements: group.achievements.map((a) => ({
      id: a.id,
      name: a.name,
      unlocked: a.unlocks.length > 0,
    })),
  };
}
