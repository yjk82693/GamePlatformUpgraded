import { prisma } from "./db.js";

export async function getActiveTerms() {
  return prisma.terms.findFirst({ where: { active: true } });
}

export async function needsConsent(accountId: string): Promise<boolean> {
  const active = await getActiveTerms();
  if (!active) return false;
  const consent = await prisma.consent.findUnique({
    where: { accountId_termsId: { accountId, termsId: active.id } },
  });
  return !consent;
}

export async function recordConsent(accountId: string, termsId: string) {
  return prisma.consent.upsert({
    where: { accountId_termsId: { accountId, termsId } },
    create: { accountId, termsId },
    update: {},
  });
}
