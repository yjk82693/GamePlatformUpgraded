import { prisma } from "./db.js";
import type { Action, Target } from "./db.js";

export async function can(
  actorId: string,
  action: Action,
  targetType: Target
): Promise<boolean> {
  const memberships = await prisma.member.findMany({
    where: { accountId: actorId },
    include: {
      roles: {
        include: {
          role: { include: { permissions: true } },
        },
      },
    },
  });

  for (const membership of memberships) {
    for (const memberRole of membership.roles) {
      const hasPermission = memberRole.role.permissions.some(
        (p: { action: Action; targetType: Target }) => p.action === action && p.targetType === targetType
      );
      if (hasPermission) return true;
    }
  }

  return false;
}

export class PermissionDeniedError extends Error {
  constructor(action: Action, targetType: Target) {
    super(`Permission denied: ${action} on ${targetType}`);
    this.name = "PermissionDeniedError";
  }
}

export async function requirePermission(
  actorId: string,
  action: Action,
  targetType: Target
): Promise<void> {
  const allowed = await can(actorId, action, targetType);
  if (!allowed) {
    throw new PermissionDeniedError(action, targetType);
  }
}

export function isOwner(
  actorId: string,
  resource: { accountId?: string; ownerId?: string; authorId?: string }
): boolean {
  return (
    resource.accountId === actorId ||
    resource.ownerId === actorId ||
    resource.authorId === actorId
  );
}
