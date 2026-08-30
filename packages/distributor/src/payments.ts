import { prisma, requirePermission } from "@game-platform/commons";
import type { Prisma } from "@game-platform/commons";

export async function configureMerchant(
  actorId: string,
  data: { id?: string; name: string; config?: Prisma.InputJsonValue }
) {
  await requirePermission(actorId, "UPDATE", "MERCHANT");
  if (data.id) {
    return prisma.merchant.update({
      where: { id: data.id },
      data: { name: data.name, ...(data.config !== undefined ? { config: data.config } : {}) },
    });
  }
  return prisma.merchant.create({
    data: { name: data.name, ...(data.config !== undefined ? { config: data.config } : {}) },
  });
}

export async function setPaymentMethod(actorId: string, merchantId: string, type: string) {
  await requirePermission(actorId, "UPDATE", "PAYMENT_METHOD");
  return prisma.paymentMethod.create({ data: { merchantId, type } });
}

export async function issueRefund(actorId: string, txnId: string) {
  await requirePermission(actorId, "REFUND", "TRANSACTION");
  const result = await prisma.transaction.updateMany({
    where: { id: txnId, state: "PAID" },
    data: { state: "REFUND_PENDING" },
  });
  if (result.count === 0) throw new Error("Transaction not refundable");
  await prisma.refundRequest.create({ data: { txnId, requestedBy: actorId } });
  return prisma.transaction.findUnique({ where: { id: txnId } });
}

export async function approveRefund(approverId: string, txnId: string) {
  await requirePermission(approverId, "APPROVE", "TRANSACTION");
  const request = await prisma.refundRequest.findUnique({ where: { txnId } });
  if (!request) throw new Error("No refund request found");
  if (request.requestedBy === approverId) {
    throw new Error("Separation of duties: approver cannot be the requester");
  }

  const result = await prisma.transaction.updateMany({
    where: { id: txnId, state: "REFUND_PENDING" },
    data: { state: "REFUNDED" },
  });
  if (result.count === 0) throw new Error("No pending refund for this transaction");

  const txn = await prisma.transaction.findUnique({ where: { id: txnId } });
  if (txn) {
    await prisma.entitlement.deleteMany({
      where: { accountId: txn.accountId, productId: txn.productId },
    });
  }
  return txn;
}

export async function viewSettlement(actorId: string, period: string) {
  await requirePermission(actorId, "READ", "SETTLEMENT");
  return prisma.settlement.findFirst({ where: { period } });
}

export async function reconcile(actorId: string, period: string) {
  await requirePermission(actorId, "READ", "SETTLEMENT");
  const transactions = await prisma.transaction.findMany({
    where: { occurredAt: { gte: new Date(period) } },
  });
  // real reconciliation would compare against a processor report;
  // here we just return the transaction set for the period as a stub
  return { period, transactionCount: transactions.length, transactions };
}

export async function payout(actorId: string, period: string, amount: bigint) {
  await requirePermission(actorId, "UPDATE", "SETTLEMENT");
  const existing = await prisma.payout.findFirst({ where: { period } });
  if (existing) return existing;
  return prisma.payout.create({ data: { period, amount } });
}

export async function exportTransactions(actorId: string, filter?: { accountId?: string }) {
  await requirePermission(actorId, "EXPORT", "TRANSACTION");
  return prisma.transaction.findMany({
    where: filter?.accountId ? { accountId: filter.accountId } : {},
    orderBy: { occurredAt: "desc" },
  });
}

export async function listMerchants(actorId: string) {
  await requirePermission(actorId, "READ", "SETTLEMENT");
  return prisma.merchant.findMany({ include: { paymentMethods: true } });
}
