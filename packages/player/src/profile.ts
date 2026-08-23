import { prisma } from "@game-platform/commons";
import type { Visibility } from "@game-platform/commons";

async function canView(viewerId: string, targetId: string): Promise<boolean> {
  const profile = await prisma.playerProfile.findUnique({ where: { accountId: targetId } });
  if (!profile) return false;
  if (profile.visibility === "PUBLIC") return true;
  if (profile.visibility === "PRIVATE") return viewerId === targetId;
  // FRIENDS
  const friendship = await prisma.friendship.findFirst({
    where: {
      status: "ACCEPTED",
      OR: [
        { requesterId: viewerId, addresseeId: targetId },
        { requesterId: targetId, addresseeId: viewerId },
      ],
    },
  });
  return !!friendship;
}

export async function viewProfile(viewerId: string, targetId: string) {
  const allowed = await canView(viewerId, targetId);
  if (!allowed) throw new Error("Forbidden");

  const profile = await prisma.playerProfile.findUnique({ where: { accountId: targetId } });
  if (!profile) throw new Error("Profile not found");

  return {
    name: profile.displayName,
    avatar: profile.avatarRef,
    solo: await viewSoloGallery(targetId),
  };
}

export async function editProfile(
  me: string,
  fields: { displayName?: string; avatarRef?: string; selectedPersonaId?: string }
) {
  return prisma.playerProfile.update({
    where: { accountId: me },
    data: fields,
  });
}

export async function setVisibility(me: string, level: Visibility) {
  return prisma.playerProfile.update({
    where: { accountId: me },
    data: { visibility: level },
  });
}

function unguessableCode(): string {
  return Math.random().toString(36).slice(2, 10).toUpperCase();
}

export async function regenerateFriendCode(me: string) {
  return prisma.playerProfile.update({
    where: { accountId: me },
    data: { friendCode: unguessableCode() },
  });
}

export async function viewSoloGallery(targetId: string, appId?: string) {
  return prisma.gameStatus.findMany({
    where: {
      accountId: targetId,
      gameType: "SOLO",
      ...(appId ? { appId } : {}),
    },
  });
}

export async function exportSoloGallery(me: string, appId?: string) {
  const gallery = await viewSoloGallery(me, appId);
  return { shareArtifact: gallery };
}
