import { prisma } from "@game-platform/commons";
import type { Prisma } from "@game-platform/commons";
import { getCatalogEntry } from "./catalog.js";
import { getDispatcher } from "./dispatch.js";

export async function proposeAction(
  actorId: string,
  operation: string,
  targetId: string,
  payload?: Prisma.InputJsonValue
) {
  const entry = getCatalogEntry(operation);
  if (!entry) {
    throw new Error(`AI coordinator is not permitted to propose operation "${operation}"`);
  }
  return prisma.heldCall.create({
    data: {
      actorId,
      operation,
      proposedAction: entry.action,
      targetType: entry.targetType,
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

  const dispatcher = getDispatcher(call.operation);
  if (!dispatcher) {
    throw new Error(`No dispatcher registered for operation "${call.operation}"`);
  }

  // Dispatch first. If the real function throws, the HeldCall stays
  // PENDING rather than getting marked APPROVED against a failed action.
  await dispatcher(call.actorId, call.targetId, (call.payload as object) ?? {});

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
