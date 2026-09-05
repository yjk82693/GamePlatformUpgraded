import { prisma, requirePermission, getMyOrgId } from "@game-platform/commons";

export async function createBoard(actorId: string, appId: string, name: string) {
  await requirePermission(actorId, "CREATE", "ANALYTICS");
  return prisma.leaderboard.create({ data: { appId, name } });
}

export async function configureBoard(actorId: string, boardId: string, data: { name?: string; season?: number }) {
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

export async function registerTerms(actorId: string, content: string, version: string, effectiveDate: Date) {
  const myOrgId = await getMyOrgId(actorId);
  await requirePermission(actorId, "CREATE", "SETTING", myOrgId ?? undefined);
  return prisma.terms.create({
    data: { content, version, effectiveDate, ...(myOrgId ? { orgId: myOrgId } : {}) },
  });
}

export async function activateTerms(actorId: string, version: string) {
  const myOrgId = await getMyOrgId(actorId);
  await requirePermission(actorId, "UPDATE", "SETTING", myOrgId ?? undefined);
  if (!myOrgId) throw new Error("No organization found for this account");

  await prisma.terms.updateMany({
    where: { orgId: myOrgId },
    data: { active: false },
  });
  return prisma.terms.update({
    where: { orgId_version: { orgId: myOrgId, version } },
    data: { active: true },
  });
}

export async function generateCode(actorId: string, reward: any, usesLeft: number, expiry?: Date) {
  const myOrgId = await getMyOrgId(actorId);
  await requirePermission(actorId, "CREATE", "PRODUCT", myOrgId ?? undefined);
  const code = Math.random().toString(36).slice(2, 10).toUpperCase();
  return prisma.redeemCode.create({
    data: { code, reward, usesLeft, ...(expiry ? { expiry } : {}), ...(myOrgId ? { orgId: myOrgId } : {}) },
  });
}

export async function batchGenerate(actorId: string, reward: any, count: number, usesLeft: number, expiry?: Date) {
  const myOrgId = await getMyOrgId(actorId);
  await requirePermission(actorId, "CREATE", "PRODUCT", myOrgId ?? undefined);
  const codes = [];
  for (let i = 0; i < count; i++) {
    const code = Math.random().toString(36).slice(2, 10).toUpperCase();
    codes.push(
      await prisma.redeemCode.create({
        data: { code, reward, usesLeft, ...(expiry ? { expiry } : {}), ...(myOrgId ? { orgId: myOrgId } : {}) },
      })
    );
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
  const myOrgId = await getMyOrgId(actorId);
  await requirePermission(actorId, "READ", "SETTING", myOrgId ?? undefined);
  return prisma.terms.findMany({
    where: { ...(myOrgId ? { orgId: myOrgId } : {}) },
    orderBy: { effectiveDate: "desc" },
  });
}

export async function listRedeemCodes(actorId: string) {
  const myOrgId = await getMyOrgId(actorId);
  await requirePermission(actorId, "READ", "PRODUCT", myOrgId ?? undefined);
  return prisma.redeemCode.findMany({
    where: { ...(myOrgId ? { orgId: myOrgId } : {}) },
    orderBy: { id: "desc" },
  });
}

export async function listMultiplayerApps(actorId: string) {
  const myOrgId = await getMyOrgId(actorId);
  await requirePermission(actorId, "READ", "ANALYTICS", myOrgId ?? undefined);
  const boards = await prisma.leaderboard.findMany({
    distinct: ["appId"],
    include: { app: true },
    where: { ...(myOrgId ? { app: { ownerOrgId: myOrgId } } : {}) },
  });
  return boards.map((b) => ({ id: b.app.id, name: b.app.name }));
}
