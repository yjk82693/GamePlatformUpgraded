import { prisma } from "@game-platform/commons";
import type { Action, Target, Prisma } from "@game-platform/commons";
import { isActionAllowed } from "./catalog.js";

export async function proposeAction(
  actorId: string,
  proposedAction: Action,
  targetType: Target,
  targetId: string,
  payload?: Prisma.InputJsonValue
) {
  if (!isActionAllowed(proposedAction, targetType)) {
    throw new Error(`AI coordinator is not permitted to propose ${proposedAction} on ${targetType}`);
  }
  return prisma.heldCall.create({
    data: {
      actorId,
      proposedAction,
      targetType,
      targetId,
      ...(payload !== undefined ? { payload } : {}),
    },
  });
}

export async function listPendingHeldCalls(actorId: string) {
  return prisma.heldCall.findMany({
    where: { actorId, status: "PENDING" },
    orderBy: { createdAt: "desc" },
  });
}

export async function approveHeldCall(approverId: string, heldCallId: string) {
  const call = await prisma.heldCall.findUnique({ where: { id: heldCallId } });
  if (!call) throw new Error("Held call not found");
  if (call.status !== "PENDING") throw new Error("Held call already decided");
  return prisma.heldCall.update({
    where: { id: heldCallId },
    data: { status: "APPROVED", decidedAt: new Date(), decidedBy: approverId },
  });
}

export async function rejectHeldCall(approverId: string, heldCallId: string) {
  const call = await prisma.heldCall.findUnique({ where: { id: heldCallId } });
  if (!call) throw new Error("Held call not found");
  if (call.status !== "PENDING") throw new Error("Held call already decided");
  return prisma.heldCall.update({
    where: { id: heldCallId },
    data: { status: "REJECTED", decidedAt: new Date(), decidedBy: approverId },
  });
}
