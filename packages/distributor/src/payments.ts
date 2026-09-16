import { prisma, requirePermission, getMyOrgId, logAction } from "@game-platform/commons";

export async function configureMerchant(actorId: string, data: { name: string; config?: any }) {
  const myOrgId = await getMyOrgId(actorId);
  await requirePermission(actorId, "UPDATE", "MERCHANT", myOrgId ?? undefined);
  const merchant = await prisma.merchant.create({
    data: { name: data.name, config: data.config, ...(myOrgId ? { orgId: myOrgId } : {}) },
  });
  await logAction(actorId, "UPDATE", "MERCHANT", merchant.id, { name: data.name }, true);
  return merchant;
}

export async function setPaymentMethod(actorId: string, merchantId: string, type: string) {
  await requirePermission(actorId, "UPDATE", "PAYMENT_METHOD");
  const pm = await prisma.paymentMethod.create({ data: { merchantId, type } });
  await logAction(actorId, "UPDATE", "PAYMENT_METHOD", pm.id, { merchantId, type }, true);
  return pm;
}

export async function issueRefund(actorId: string, txnId: string) {
  await requirePermission(actorId, "REFUND", "TRANSACTION");
  const txn = await prisma.transaction.findUnique({ where: { id: txnId } });
  if (!txn) throw new Error("Transaction not found");
  if (txn.state !== "PAID") throw new Error("Transaction not refundable");
  await prisma.transaction.update({ where: { id: txnId }, data: { state: "REFUND_PENDING" } });
  const request = await prisma.refundRequest.create({ data: { txnId, requestedBy: actorId } });
  await logAction(actorId, "REFUND", "TRANSACTION", txnId, undefined, true);
  return request;
}

export async function approveRefund(actorId: string, txnId: string) {
  await requirePermission(actorId, "APPROVE", "TRANSACTION");
  const request = await prisma.refundRequest.findUnique({ where: { txnId } });
  if (!request) throw new Error("No refund request found");
  if (request.requestedBy === actorId) {
    throw new Error("Separation of duties: approver cannot be the requester");
  }
  await prisma.transaction.update({ where: { id: txnId }, data: { state: "REFUNDED" } });
  await logAction(actorId, "APPROVE", "TRANSACTION", txnId, undefined, true);
  return request;
}

export async function viewSettlement(actorId: string, period: string) {
  await requirePermission(actorId, "READ", "SETTLEMENT");
  return prisma.settlement.findFirst({ where: { period } });
}

export async function reconcile(actorId: string, period: string) {
  const myOrgId = await getMyOrgId(actorId);
  await requirePermission(actorId, "UPDATE", "SETTLEMENT", myOrgId ?? undefined);
  const transactions = await prisma.transaction.findMany({
    where: { ...(myOrgId ? { product: { app: { ownerOrgId: myOrgId } } } : {}) },
  });
  return { transactionCount: transactions.length };
}

export async function payout(actorId: string, period: string, amount: bigint) {
  await requirePermission(actorId, "UPDATE", "SETTLEMENT");
  const p = await prisma.payout.create({ data: { period, amount } });
  await logAction(actorId, "UPDATE", "SETTLEMENT", p.id, { period, amount: amount.toString() }, true);
  return p;
}

export async function exportTransactions(actorId: string) {
  const myOrgId = await getMyOrgId(actorId);
  await requirePermission(actorId, "EXPORT", "TRANSACTION", myOrgId ?? undefined);
  return prisma.transaction.findMany({
    where: { ...(myOrgId ? { product: { app: { ownerOrgId: myOrgId } } } : {}) },
    orderBy: { occurredAt: "desc" },
  });
}

export async function listMerchants(actorId: string) {
  const myOrgId = await getMyOrgId(actorId);
  await requirePermission(actorId, "READ", "SETTLEMENT", myOrgId ?? undefined);
  return prisma.merchant.findMany({
    where: { ...(myOrgId ? { orgId: myOrgId } : {}) },
    include: { paymentMethods: true },
  });
}
