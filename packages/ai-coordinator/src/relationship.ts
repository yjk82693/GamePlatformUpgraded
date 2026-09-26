import { prisma } from "@game-platform/commons";

// ─────────────────────────────────────────────────────────────────────────
// Stage-1 relationship layer for the player companion (Phase 2 design §4).
// The mechanism (dip / repair / resilience / stability) is real from stage
// 1; only the measurement gets richer later. These constants are stage-1
// placeholders — "learn the shape, not the constants." compute_warmth's
// real fact-count-driven base is deferred to stage where PlayerMemory
// exists (Phase 2 step 4); for now the caller supplies factCount directly.
// ─────────────────────────────────────────────────────────────────────────

const HOSTILITY_STING = 40; // points knocked off warmth right after a hostile message
const DECAY_WINDOW_MS = 24 * 60 * 60 * 1000; // dip fades to 0 over 24h without repair
const REPAIR_INCREMENT = 5; // resilience ratchets up by this much per repair event
const RESILIENCE_NORMALIZATION = 50; // resilience+stability points to reach near-full dampening
const RESILIENCE_FACTOR_CAP = 0.9; // dip never fully disappears from resilience alone
const STABLE_THRESHOLD = 60; // warmth needed to enter "stable" (starts the warmSince clock)
const STABLE_MAX_MS = 30 * 24 * 60 * 60 * 1000; // time in stable to reach full stability bonus
const STABILITY_CAP = 20; // max bonus points stability contributes to effective resilience

export interface PersonaRelationshipState {
  accountId: string;
  personaId: string;
  repairResilience: number;
  warmSince: Date | null;
  lastHostilityAt: Date | null;
}

export async function getOrCreateRelationship(
  accountId: string,
  personaId: string
): Promise<PersonaRelationshipState> {
  return prisma.personaRelationship.upsert({
    where: { accountId_personaId: { accountId, personaId } },
    create: { accountId, personaId },
    update: {},
  });
}

// base = compute_warmth(a, p): UNCHANGED base measure, f(fact_count) at stage 1.
// Placeholder shape until PlayerMemory exists to supply a real fact count.
export function computeWarmth(factCount: number): number {
  return Math.min(factCount * 5, 80);
}

function decay(msSinceHostility: number): number {
  return Math.max(0, 1 - msSinceHostility / DECAY_WINDOW_MS);
}

function resilienceFactor(rel: PersonaRelationshipState): number {
  const stabilityBonus = derivedStabilityBonus(rel.warmSince);
  const raw = (rel.repairResilience + stabilityBonus) / RESILIENCE_NORMALIZATION;
  return Math.min(raw, RESILIENCE_FACTOR_CAP);
}

export function hostilityDip(rel: PersonaRelationshipState): number {
  if (!rel.lastHostilityAt) return 0;
  const msSince = Date.now() - rel.lastHostilityAt.getTime();
  const raw = HOSTILITY_STING * decay(msSince);
  return raw * (1 - resilienceFactor(rel));
}

export function derivedStabilityBonus(warmSince: Date | null): number {
  if (!warmSince) return 0;
  const msSince = Date.now() - warmSince.getTime();
  return Math.min(msSince / STABLE_MAX_MS, 1.0) * STABILITY_CAP;
}

export function effectiveWarmth(rel: PersonaRelationshipState, factCount: number): number {
  const base = computeWarmth(factCount);
  const dip = hostilityDip(rel);
  return Math.max(0, Math.min(base - dip, 100));
}

export function effectiveResilience(rel: PersonaRelationshipState): number {
  return rel.repairResilience + derivedStabilityBonus(rel.warmSince);
}

// ─── crude stage-1 detectors — keyword lists now, learned later ───
const MEAN_KEYWORDS = ["shut up", "stupid", "useless", "hate you", "worthless", "idiot"];
const KIND_KEYWORDS = ["sorry", "thank you", "thanks", "appreciate", "love you", "good job"];

function isMeanStub(msg: string): boolean {
  const lower = msg.toLowerCase();
  return MEAN_KEYWORDS.some((kw) => lower.includes(kw));
}

function isKindStub(msg: string): boolean {
  const lower = msg.toLowerCase();
  return KIND_KEYWORDS.some((kw) => lower.includes(kw));
}

function maintainWarmSince(rel: PersonaRelationshipState, warmth: number): Date | null {
  if (warmth >= STABLE_THRESHOLD && !rel.warmSince) return new Date();
  if (warmth < STABLE_THRESHOLD) return null;
  return rel.warmSince;
}

// The event handler. factCount stands in for the real memory-driven fact
// count until PlayerMemory exists. Returns the updated relationship row
// plus the freshly computed effective warmth/resilience for convenience.
export async function onMessage(
  accountId: string,
  personaId: string,
  msg: string,
  factCount: number
): Promise<{ relationship: PersonaRelationshipState; warmth: number; resilience: number }> {
  let rel = await getOrCreateRelationship(accountId, personaId);

  if (isMeanStub(msg)) {
    rel = await prisma.personaRelationship.update({
      where: { accountId_personaId: { accountId, personaId } },
      data: { lastHostilityAt: new Date() },
    });
  } else if (rel.lastHostilityAt && isKindStub(msg)) {
    rel = await prisma.personaRelationship.update({
      where: { accountId_personaId: { accountId, personaId } },
      data: {
        repairResilience: rel.repairResilience + REPAIR_INCREMENT,
        lastHostilityAt: null,
      },
    });
  }

  const warmth = effectiveWarmth(rel, factCount);
  const newWarmSince = maintainWarmSince(rel, warmth);
  if (newWarmSince !== rel.warmSince) {
    rel = await prisma.personaRelationship.update({
      where: { accountId_personaId: { accountId, personaId } },
      data: { warmSince: newWarmSince },
    });
  }

  return { relationship: rel, warmth, resilience: effectiveResilience(rel) };
}

// ─── expression palette — warmth sets what's available, emotion picks ───
const EXPRESSION_TIERS: Record<string, number> = {
  neutral: 0,
  reserved: 0,
  curious: 20,
  friendly: 40,
  playful: 60,
  warm: 80,
  joyful: 95,
};

const FALLBACK_EXPRESSION = "neutral";

export function availableExpressions(warmth: number): string[] {
  return Object.entries(EXPRESSION_TIERS)
    .filter(([, threshold]) => threshold <= warmth)
    .map(([emotion]) => emotion);
}

export function pickExpression(taggedEmotion: string, warmth: number): string {
  const available = availableExpressions(warmth);
  return available.includes(taggedEmotion) ? taggedEmotion : FALLBACK_EXPRESSION;
}
