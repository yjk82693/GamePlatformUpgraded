import { prisma, requirePermission } from "@game-platform/commons";
import type { Action, Target } from "@game-platform/commons";

export interface LogFilter {
  actorId?: string;
  action?: Action;
  targetType?: Target;
  after?: Date;
  before?: Date;
}

export async function queryLog(actorId: string, filter?: LogFilter) {
  await requirePermission(actorId, "READ", "SETTING");
  return prisma.auditLog.findMany({
    where: {
      ...(filter?.actorId ? { actorId: filter.actorId } : {}),
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
  await requirePermission(actorId, "READ", "SETTING");
  return prisma.deadLetter.findMany({ orderBy: { failedAt: "desc" } });
}
