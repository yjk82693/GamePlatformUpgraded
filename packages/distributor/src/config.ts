import { prisma, requirePermission } from "@game-platform/commons";
import type { Prisma } from "@game-platform/commons";

// ── Leaderboard config ──
export async function createBoard(actorId: string, appId: string, name: string) {
  await requirePermission(actorId, "CREATE", "ANALYTICS");
  return prisma.leaderboard.create({ data: { appId, name } });
}

export async function configureBoard(actorId: string, boardId: string, data: { name?: string }) {
  await requirePermission(actorId, "UPDATE", "ANALYTICS");
  return prisma.leaderboard.update({ where: { id: boardId }, data });
}

export async function openSeason(actorId: string, boardId: string) {
  await requirePermission(actorId, "UPDATE", "ANALYTICS");
  const board = await prisma.leaderboard.findUnique({ where: { id: boardId } });
  if (!board) throw new Error("Board not found");
  return prisma.leaderboard.update({
    where: { id: boardId },
    data: { season: board.season + 1, closed: false },
  });
}

export async function closeSeason(actorId: string, boardId: string) {
  await requirePermission(actorId, "UPDATE", "ANALYTICS");
  return prisma.leaderboard.update({ where: { id: boardId }, data: { closed: true } });
}

// ── Terms ──
export async function registerTerms(
  actorId: string,
  content: string,
  version: string,
  effectiveDate: Date
) {
  await requirePermission(actorId, "CREATE", "SETTING");
  return prisma.terms.create({
    data: { content, version, effectiveDate, active: false },
  });
}

export async function activateTerms(actorId: string, version: string) {
  await requirePermission(actorId, "UPDATE", "SETTING");
  await prisma.terms.updateMany({ data: { active: false }, where: {} });
  return prisma.terms.update({ where: { version }, data: { active: true } });
}

// ── Redeem generation ──
export interface RewardLine {
  itemId: string;
  amount: number;
}

export async function generateCode(
  actorId: string,
  reward: RewardLine[],
  usesLeft: number,
  expiry?: Date
) {
  await requirePermission(actorId, "CREATE", "PRODUCT");
  const code = crypto.randomUUID().slice(0, 8).toUpperCase();
  return prisma.redeemCode.create({
    data: {
      code,
      reward: reward as unknown as Prisma.InputJsonValue,
      usesLeft,
      ...(expiry ? { expiry } : {}),
    },
  });
}

export async function batchGenerate(
  actorId: string,
  reward: RewardLine[],
  count: number,
  usesLeft: number,
  expiry?: Date
) {
  const codes = [];
  for (let i = 0; i < count; i++) {
    codes.push(await generateCode(actorId, reward, usesLeft, expiry));
  }
  return codes;
}

export async function trackRedemptions(actorId: string, codeId: string) {
  await requirePermission(actorId, "READ", "PRODUCT");
  return prisma.redeemGrant.findMany({ where: { codeId } });
}

export async function revokeCode(actorId: string, codeId: string) {
  await requirePermission(actorId, "DELETE", "PRODUCT");
  return prisma.redeemCode.update({ where: { id: codeId }, data: { usesLeft: 0 } });
}

export async function listBoardsForApp(actorId: string, appId: string) {
  await requirePermission(actorId, "READ", "ANALYTICS");
  return prisma.leaderboard.findMany({ where: { appId } });
}

export async function listTerms(actorId: string) {
  await requirePermission(actorId, "READ", "SETTING");
  return prisma.terms.findMany({ orderBy: { effectiveDate: "desc" } });
}

export async function listRedeemCodes(actorId: string) {
  await requirePermission(actorId, "READ", "PRODUCT");
  return prisma.redeemCode.findMany({ orderBy: { id: "desc" } });
}

export async function listMultiplayerApps(actorId: string) {
  await requirePermission(actorId, "READ", "ANALYTICS");
  const boards = await prisma.leaderboard.findMany({
    distinct: ["appId"],
    include: { app: true },
  });
  return boards.map((b) => ({ id: b.app.id, name: b.app.name }));
}
