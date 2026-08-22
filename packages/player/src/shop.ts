import crypto from "node:crypto";
import { prisma, needsConsent } from "@game-platform/commons";
import type { Prisma } from "@game-platform/commons";
import { creditCoins, debitCoins } from "./wallet.js";

export async function browseShop(filter?: { categoryId?: string; appId?: string }) {
  return prisma.product.findMany({
    where: {
      enabled: true,
      app: { status: "PUBLISHED" },
      ...(filter?.categoryId ? { categoryId: filter.categoryId } : {}),
      ...(filter?.appId ? { appId: filter.appId } : {}),
    },
  });
}

export async function viewProduct(viewerId: string, productId: string) {
  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) throw new Error("Product not found");
  const owned = await prisma.entitlement.findUnique({
    where: { accountId_productId: { accountId: viewerId, productId } },
  });
  const reviews = await prisma.review.findMany({ where: { productId } });
  return { product, owned: !!owned, reviewsSummary: reviews };
}

export async function viewReviews(productId: string) {
  return prisma.review.findMany({
    where: { productId },
    orderBy: { id: "desc" },
  });
}

export async function purchase(
  playerId: string,
  productId: string,
  payWith: "CASH" | "COIN"
) {
  if (await needsConsent(playerId)) {
    throw new Error("Consent required");
  }

  const product = await prisma.product.findUnique({
    where: { id: productId },
    include: { app: true },
  });
  if (!product || !product.enabled || product.app.status !== "PUBLISHED") {
    throw new Error("Product unavailable");
  }

  const existing = await prisma.entitlement.findUnique({
    where: { accountId_productId: { accountId: playerId, productId } },
  });
  if (existing) {
    throw new Error("Already owned");
  }

  const receiptId = crypto.randomUUID();

  if (payWith === "COIN") {
    if (!product.priceCoins) throw new Error("Product has no coin price");
    const ok = await debitCoins(playerId, BigInt(product.priceCoins), "buy");
    if (!ok) throw new Error("Insufficient coins");
  } else {
    if (!product.priceCents) throw new Error("Product has no cash price");
    // real payment processing is out of scope here — assumed successful
  }

  const [txn] = await prisma.$transaction([
    prisma.transaction.create({
      data: { accountId: playerId, productId, receiptId, state: "PAID" },
    }),
    prisma.entitlement.create({
      data: { accountId: playerId, productId },
    }),
  ]);

  if (payWith === "CASH" && product.priceCents) {
    const earnRate = Math.floor(product.priceCents / 10);
    await creditCoins(playerId, BigInt(earnRate), "earn");
  }

  return txn;
}

export async function topup(playerId: string, amountCents: bigint) {
  await prisma.wallet.upsert({
    where: { accountId: playerId },
    create: { accountId: playerId, cashCents: amountCents, coinUnits: 0n },
    update: { cashCents: { increment: amountCents } },
  });
  await creditCoins(playerId, amountCents / 10n, "earn");
}

export async function verifyReceipt(playerId: string, receiptId: string) {
  const txn = await prisma.transaction.findUnique({ where: { receiptId } });
  if (!txn || txn.accountId !== playerId) {
    throw new Error("Invalid receipt");
  }
  return txn;
}

export async function restorePurchases(playerId: string) {
  return prisma.entitlement.findMany({ where: { accountId: playerId } });
}

export async function handlePaymentFailure(receiptId: string) {
  await prisma.transaction.updateMany({
    where: { receiptId },
    data: { state: "REFUNDED" },
  });
}

export async function writeReview(
  playerId: string,
  productId: string,
  rating: number,
  body: string
) {
  const owned = await prisma.entitlement.findUnique({
    where: { accountId_productId: { accountId: playerId, productId } },
  });
  if (!owned) throw new Error("Must own product to review");
  if (rating < 1 || rating > 5) throw new Error("Invalid rating");
  return prisma.review.upsert({
    where: { accountId_productId: { accountId: playerId, productId } },
    create: { accountId: playerId, productId, rating, body },
    update: { rating, body },
  });
}

export async function viewOwnTransactions(playerId: string) {
  return prisma.transaction.findMany({
    where: { accountId: playerId },
    orderBy: { occurredAt: "desc" },
  });
}

export async function tryDemo(demoId: string) {
  const demo = await prisma.demo.findUnique({ where: { id: demoId } });
  if (!demo) throw new Error("Demo not found");
  return demo;
}

export async function claimDemoReward(
  playerId: string,
  demoId: string,
  answers: Prisma.InputJsonValue
) {
  const existing = await prisma.demoParticipation.findUnique({
    where: { demoId_accountId: { demoId, accountId: playerId } },
  });
  if (existing) throw new Error("Already claimed");
  await prisma.demoParticipation.create({
    data: { demoId, accountId: playerId, answers },
  });
  await creditCoins(playerId, 1n, "demo");
}

export async function redeemCode(playerId: string, code: string) {
  const rc = await prisma.redeemCode.findUnique({ where: { code } });
  if (!rc || (rc.expiry && rc.expiry < new Date())) {
    throw new Error("Invalid or expired code");
  }
  const existing = await prisma.redeemGrant.findUnique({
    where: { codeId_accountId: { codeId: rc.id, accountId: playerId } },
  });
  if (existing) throw new Error("Already redeemed");

  const updated = await prisma.redeemCode.updateMany({
    where: { id: rc.id, usesLeft: { gt: 0 } },
    data: { usesLeft: { decrement: 1 } },
  });
  if (updated.count === 0) throw new Error("Code exhausted");

  await prisma.redeemGrant.create({ data: { codeId: rc.id, accountId: playerId } });
  return rc.reward;
}
