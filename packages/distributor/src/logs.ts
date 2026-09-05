import { prisma, requirePermission, getMyOrgId } from "@game-platform/commons";
import type { Action, Target } from "@game-platform/commons";

export interface LogFilter {
  actorId?: string;
  action?: Action;
  targetType?: Target;
  after?: Date;
  before?: Date;
}

async function orgActorIds(myOrgId: string | null): Promise<string[] | null> {
  if (!myOrgId) return null;
  const members = await prisma.member.findMany({ where: { orgId: myOrgId } });
  return members.map((m) => m.accountId);
}

export async function queryLog(actorId: string, filter?: LogFilter) {
  const myOrgId = await getMyOrgId(actorId);
  await requirePermission(actorId, "READ", "SETTING", myOrgId ?? undefined);

  const scopedIds = await orgActorIds(myOrgId);
  let actorFilter: string[] | undefined;
  if (scopedIds) {
    actorFilter = filter?.actorId
      ? scopedIds.filter((id) => id === filter.actorId)
      : scopedIds;
  }

  return prisma.auditLog.findMany({
    where: {
      ...(actorFilter ? { actorId: { in: actorFilter } } : {}),
      ...(!scopedIds && filter?.actorId ? { actorId: filter.actorId } : {}),
      ...(filter?.action ? { action: filter.action } : {}),
      ...(filter?.targetType ? { targetType: filter.targetType } : {}),
      ...(filter?.after || filter?.before
        ? {
            occurredAt: {
              ...(filter.after ? { gte: filter.after } : {}),
              ...(filter.before ? { lte: filter.before } : {}),
            },
          }
        : {}),
    },
    orderBy: { occurredAt: "desc" },
  });
}

export async function exportCsv(actorId: string, filter?: LogFilter) {
  await requirePermission(actorId, "EXPORT", "SETTING");
  const rows = await queryLog(actorId, filter);
  const header = "id,actorId,action,targetType,targetId,occurredAt,success";
  const lines = rows.map(
    (r) => `${r.id},${r.actorId},${r.action},${r.targetType},${r.targetId},${r.occurredAt.toISOString()},${r.success}`
  );
  return [header, ...lines].join("\n");
}

export async function viewDlq(actorId: string) {
  // The dead-letter queue stores raw failed-job payloads with no actor
  // or org attribution in its current shape, so it can't be meaningfully
  // scoped per company without a schema change. Left global; flagged as
  // a known remaining gap rather than faked.
  await requirePermission(actorId, "READ", "SETTING");
  return prisma.deadLetter.findMany({ orderBy: { failedAt: "desc" } });
}
