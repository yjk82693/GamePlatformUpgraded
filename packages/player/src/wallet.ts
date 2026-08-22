import { prisma } from "@game-platform/commons";

export function renderDenominations(units: bigint) {
  const gold = units / 100n;
  const silver = (units % 100n) / 50n;
  return { gold, silver, raw: units };
}

export async function viewWallet(actorId: string, targetAccountId: string) {
  if (actorId !== targetAccountId) {
    throw new Error("Forbidden: wallet is owner-only");
  }
  const wallet = await prisma.wallet.findUnique({ where: { accountId: targetAccountId } });
  const coinUnits = wallet?.coinUnits ?? 0n;
  const cashCents = wallet?.cashCents ?? 0n;
  return { cash: cashCents, coins: renderDenominations(coinUnits) };
}

export async function creditCoins(accountId: string, amount: bigint, reason: string) {
  await prisma.$transaction([
    prisma.wallet.upsert({
      where: { accountId },
      create: { accountId, cashCents: 0n, coinUnits: amount },
      update: { coinUnits: { increment: amount } },
    }),
    prisma.coinLedger.create({
      data: { accountId, delta: amount, reason },
    }),
  ]);
}

export async function debitCoins(accountId: string, amount: bigint, reason: string): Promise<boolean> {
  const result = await prisma.wallet.updateMany({
    where: { accountId, coinUnits: { gte: amount } },
    data: { coinUnits: { decrement: amount } },
  });
  if (result.count === 0) {
    return false;
  }
  await prisma.coinLedger.create({
    data: { accountId, delta: -amount, reason },
  });
  return true;
}
