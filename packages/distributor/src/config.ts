import { prisma, requirePermission, getMyOrgId, logAction } from "@game-platform/commons";

export async function createBoard(actorId: string, appId: string, name: string) {
  await requirePermission(actorId, "CREATE", "ANALYTICS");
  const board = await prisma.leaderboard.create({ data: { appId, name } });
  await logAction(actorId, "CREATE", "ANALYTICS", board.id, { appId, name }, true);
  return board;
}

export async function configureBoard(actorId: string, boardId: string, data: { name?: string; season?: number }) {
  await requirePermission(actorId, "UPDATE", "ANALYTICS");
  const board = await prisma.leaderboard.update({ where: { id: boardId }, data });
  await logAction(actorId, "UPDATE", "ANALYTICS", boardId, data, true);
  return board;
}

export async function openSeason(actorId: string, boardId: string) {
  await requirePermission(actorId, "UPDATE", "ANALYTICS");
  const board = await prisma.leaderboard.findUnique({ where: { id: boardId } });
  if (!board) throw new Error("Board not found");
  const updated = await prisma.leaderboard.update({
    where: { id: boardId },
    data: { season: board.season + 1, closed: false },
  });
  await logAction(actorId, "UPDATE", "ANALYTICS", boardId, { season: updated.season, closed: false }, true);
  return updated;
}

export async function closeSeason(actorId: string, boardId: string) {
  await requirePermission(actorId, "UPDATE", "ANALYTICS");
  const board = await prisma.leaderboard.update({ where: { id: boardId }, data: { closed: true } });
  await logAction(actorId, "UPDATE", "ANALYTICS", boardId, { closed: true }, true);
  return board;
}

export async function registerTerms(actorId: string, content: string, version: string, effectiveDate: Date) {
  const myOrgId = await getMyOrgId(actorId);
  await requirePermission(actorId, "CREATE", "SETTING", myOrgId ?? undefined);
  const terms = await prisma.terms.create({
    data: { content, version, effectiveDate, ...(myOrgId ? { orgId: myOrgId } : {}) },
  });
  await logAction(actorId, "CREATE", "SETTING", terms.id, { version, effectiveDate }, true);
  return terms;
}

export async function activateTerms(actorId: string, version: string) {
  const myOrgId = await getMyOrgId(actorId);
  await requirePermission(actorId, "UPDATE", "SETTING", myOrgId ?? undefined);
  if (!myOrgId) throw new Error("No organization found for this account");

  await prisma.terms.updateMany({
    where: { orgId: myOrgId },
    data: { active: false },
  });
  const terms = await prisma.terms.update({
    where: { orgId_version: { orgId: myOrgId, version } },
    data: { active: true },
  });
  await logAction(actorId, "UPDATE", "SETTING", terms.id, { version, active: true }, true);
  return terms;
}

export async function generateCode(actorId: string, reward: any, usesLeft: number, expiry?: Date) {
  const myOrgId = await getMyOrgId(actorId);
  await requirePermission(actorId, "CREATE", "PRODUCT", myOrgId ?? undefined);
  const code = Math.random().toString(36).slice(2, 10).toUpperCase();
  const rc = await prisma.redeemCode.create({
    data: { code, reward, usesLeft, ...(expiry ? { expiry } : {}), ...(myOrgId ? { orgId: myOrgId } : {}) },
  });
  await logAction(actorId, "CREATE", "PRODUCT", rc.id, { code, usesLeft }, true);
  return rc;
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
  await logAction(actorId, "CREATE", "PRODUCT", codes[0]?.id ?? "batch", { count, usesLeft }, true);
  return codes;
}

export async function trackRedemptions(actorId: string, codeId: string) {
  await requirePermission(actorId, "READ", "PRODUCT");
  return prisma.redeemGrant.findMany({ where: { codeId } });
}

export async function revokeCode(actorId: string, codeId: string) {
  await requirePermission(actorId, "DELETE", "PRODUCT");
  const rc = await prisma.redeemCode.update({ where: { id: codeId }, data: { usesLeft: 0 } });
  await logAction(actorId, "DELETE", "PRODUCT", codeId, undefined, true);
  return rc;
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
