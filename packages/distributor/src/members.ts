import { prisma, requirePermission, getMyOrgId } from "@game-platform/commons";
import type { RoleLevel } from "@game-platform/commons";

function generateToken(): string {
  return crypto.randomUUID();
}

export async function inviteMember(actorId: string, email: string, scope: { level: RoleLevel; scopeId: string }) {
  await requirePermission(actorId, "INVITE", "MEMBER");
  const account = await prisma.account.findUnique({ where: { email } });
  if (!account) throw new Error("No account with that email");

  const existing = await prisma.member.findFirst({
    where: {
      accountId: account.id,
      ...(scope.level === "ORG" ? { orgId: scope.scopeId } : {}),
      ...(scope.level === "PROJECT" ? { projectId: scope.scopeId } : {}),
      ...(scope.level === "SERVICE" ? { appServiceId: scope.scopeId } : {}),
    },
  });
  if (existing) return existing;

  return prisma.member.create({
    data: {
      accountId: account.id,
      ...(scope.level === "ORG" ? { orgId: scope.scopeId } : {}),
      ...(scope.level === "PROJECT" ? { projectId: scope.scopeId } : {}),
      ...(scope.level === "SERVICE" ? { appServiceId: scope.scopeId } : {}),
    },
  });
}

export async function grantRole(actorId: string, memberId: string, roleId: string) {
  await requirePermission(actorId, "GRANT_ROLE", "ROLE");
  const existing = await prisma.memberRole.findUnique({
    where: { memberId_roleId: { memberId, roleId } },
  });
  if (existing) return existing;
  return prisma.memberRole.create({ data: { memberId, roleId } });
}

export async function revokeRole(actorId: string, memberId: string, roleId: string) {
  await requirePermission(actorId, "REVOKE_ROLE", "ROLE");
  await prisma.memberRole.delete({
    where: { memberId_roleId: { memberId, roleId } },
  });
}

export async function resetMemberPassword(actorId: string, memberAccountId: string) {
  await requirePermission(actorId, "RESET_PASSWORD", "MEMBER");
  const account = await prisma.account.findUnique({ where: { id: memberAccountId } });
  if (!account) throw new Error("Account not found");
  const code = Math.random().toString().slice(2, 8);
  await prisma.account.update({
    where: { id: memberAccountId },
    data: { resetCode: code, resetCodeExpiresAt: new Date(Date.now() + 1000 * 60 * 15) },
  });
  return { resetCode: code };
}

export async function sanctionMember(actorId: string, playerId: string) {
  await requirePermission(actorId, "SUSPEND_MEMBER", "MEMBER");
  await prisma.account.update({ where: { id: playerId }, data: { status: "SUSPENDED" } });
  await prisma.session.deleteMany({ where: { accountId: playerId } });
}

export async function unsanctionMember(actorId: string, playerId: string) {
  await requirePermission(actorId, "UNSUSPEND_MEMBER", "MEMBER");
  await prisma.account.update({ where: { id: playerId }, data: { status: "ACTIVE" } });
}

export async function kickMember(actorId: string, playerId: string, appId: string) {
  await requirePermission(actorId, "REVOKE_MEMBER", "MEMBER");
  await prisma.account.update({ where: { id: playerId }, data: { status: "KICKED" } });
  await prisma.accountApp.deleteMany({ where: { accountId: playerId, appId } });
  await prisma.session.deleteMany({ where: { accountId: playerId } });
}

export async function listMembers(actorId: string) {
  const myOrgId = await getMyOrgId(actorId);
  await requirePermission(actorId, "READ", "MEMBER", myOrgId ?? undefined);
  return prisma.member.findMany({
    where: { ...(myOrgId ? { orgId: myOrgId } : {}) },
    include: { account: true, org: true, roles: { include: { role: true } } },
  });
}

export async function listRoles(actorId: string) {
  const myOrgId = await getMyOrgId(actorId);
  await requirePermission(actorId, "READ", "ROLE", myOrgId ?? undefined);
  return prisma.role.findMany({
    where: { ...(myOrgId ? { orgId: myOrgId } : {}) },
  });
}
