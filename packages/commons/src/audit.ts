import { prisma } from "./db.js";
import type { Action, Target, Prisma } from "./db.js";

export async function logAction(
  actorId: string,
  action: Action,
  targetType: Target,
  targetId: string,
  payload: Prisma.InputJsonValue | undefined,
  success: boolean
): Promise<void> {
  await prisma.auditLog.create({
    data: {
      actorId,
      action,
      targetType,
      targetId,
      ...(payload !== undefined ? { payload } : {}),
      success,
    },
  });
}
