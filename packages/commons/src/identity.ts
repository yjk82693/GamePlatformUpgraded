import crypto from "node:crypto";
import bcrypt from "bcrypt";
import { prisma } from "./db.js";
import type { AuthProvider } from "./db.js";

const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 30; // 30 days
const RESET_TTL_MS = 1000 * 60 * 15; // 15 minutes

export function checkStrong(password: string): boolean {
  return password.length >= 8 && /[A-Za-z]/.test(password) && /[0-9]/.test(password);
}

export async function registerManual(email: string, password: string) {
  if (!checkStrong(password)) {
    throw new Error("Password too weak");
  }
  const existing = await prisma.account.findUnique({ where: { email } });
  if (existing) {
    throw new Error("Account already exists");
  }
  const passwordHash = await bcrypt.hash(password, 10);
  return prisma.account.create({
    data: { email, passwordHash, authProvider: "MANUAL" },
  });
}

export async function registerSocial(
  provider: AuthProvider,
  externalId: string,
  email: string
) {
  const existing = await prisma.account.findUnique({ where: { externalId } });
  if (existing) {
    return existing;
  }
  return prisma.account.create({
    data: { email, authProvider: provider, externalId },
  });
}

async function createSession(accountId: string) {
  const token = crypto.randomBytes(32).toString("hex");
  return prisma.session.create({
    data: {
      accountId,
      token,
      expiresAt: new Date(Date.now() + SESSION_TTL_MS),
    },
  });
}

export async function login(email: string, password: string) {
  const account = await prisma.account.findUnique({ where: { email } });
  if (!account || !account.passwordHash) {
    throw new Error("Invalid credentials");
  }
  if (account.status !== "ACTIVE") {
    throw new Error("Account not active");
  }
  const valid = await bcrypt.compare(password, account.passwordHash);
  if (!valid) {
    throw new Error("Invalid credentials");
  }
  return createSession(account.id);
}

export async function loginSocial(provider: AuthProvider, externalId: string) {
  const account = await prisma.account.findUnique({ where: { externalId } });
  if (!account || account.authProvider !== provider) {
    throw new Error("Account not found");
  }
  if (account.status !== "ACTIVE") {
    throw new Error("Account not active");
  }
  return createSession(account.id);
}

export async function logout(token: string): Promise<void> {
  await prisma.session.deleteMany({ where: { token } });
}

export async function requestReset(email: string): Promise<void> {
  const account = await prisma.account.findUnique({ where: { email } });
  if (!account) return; // don't reveal account existence
  const code = crypto.randomInt(100000, 999999).toString();
  await prisma.account.update({
    where: { id: account.id },
    data: {
      resetCode: code,
      resetCodeExpiresAt: new Date(Date.now() + RESET_TTL_MS),
    },
  });
  // sending the code via email is out of scope here — handled upstream
}

export async function verifyCode(email: string, code: string): Promise<string> {
  const account = await prisma.account.findUnique({ where: { email } });
  if (
    !account ||
    account.resetCode !== code ||
    !account.resetCodeExpiresAt ||
    account.resetCodeExpiresAt < new Date()
  ) {
    throw new Error("Invalid or expired code");
  }
  return account.id; // the "claim" passed into changePw
}

export async function changePw(claim: string, newPassword: string): Promise<void> {
  if (!checkStrong(newPassword)) {
    throw new Error("Password too weak");
  }
  const passwordHash = await bcrypt.hash(newPassword, 10);
  await prisma.account.update({
    where: { id: claim },
    data: { passwordHash, resetCode: null, resetCodeExpiresAt: null },
  });
}

export async function validateSession(token: string): Promise<string> {
  const session = await prisma.session.findUnique({ where: { token } });
  if (!session || session.expiresAt < new Date()) {
    throw new Error("Invalid or expired session");
  }
  return session.accountId;
}

export async function getAccountType(accountId: string) {
  const [playerProfile, membership] = await Promise.all([
    prisma.playerProfile.findUnique({ where: { accountId } }),
    prisma.member.findFirst({ where: { accountId } }),
  ]);
  return { isPlayer: !!playerProfile, isStaff: !!membership };
}

const OWNER_PERMISSIONS: { action: string; targetType: string }[] = [
  { action: "CREATE", targetType: "PRODUCT" },
  { action: "UPDATE", targetType: "PRODUCT" },
  { action: "DELETE", targetType: "PRODUCT" },
  { action: "READ", targetType: "PRODUCT" },
  { action: "UPDATE", targetType: "CATEGORY" },
  { action: "READ", targetType: "MEMBER" },
  { action: "READ", targetType: "ROLE" },
  { action: "INVITE", targetType: "MEMBER" },
  { action: "GRANT_ROLE", targetType: "ROLE" },
  { action: "REVOKE_ROLE", targetType: "ROLE" },
  { action: "RESET_PASSWORD", targetType: "MEMBER" },
  { action: "SUSPEND_MEMBER", targetType: "MEMBER" },
  { action: "UNSUSPEND_MEMBER", targetType: "MEMBER" },
  { action: "REVOKE_MEMBER", targetType: "MEMBER" },
  { action: "PUBLISH", targetType: "APP" },
  { action: "UPDATE", targetType: "APP" },
  { action: "CREATE", targetType: "NOTIFICATION_SETTING" },
  { action: "UPDATE", targetType: "MERCHANT" },
  { action: "UPDATE", targetType: "PAYMENT_METHOD" },
  { action: "REFUND", targetType: "TRANSACTION" },
  { action: "APPROVE", targetType: "TRANSACTION" },
  { action: "READ", targetType: "SETTLEMENT" },
  { action: "UPDATE", targetType: "SETTLEMENT" },
  { action: "EXPORT", targetType: "TRANSACTION" },
  { action: "READ", targetType: "ANALYTICS" },
  { action: "EXPORT", targetType: "ANALYTICS" },
  { action: "UPDATE", targetType: "ANALYTICS" },
  { action: "CREATE", targetType: "ANALYTICS" },
  { action: "CREATE", targetType: "SETTING" },
  { action: "UPDATE", targetType: "SETTING" },
  { action: "READ", targetType: "SETTING" },
  { action: "EXPORT", targetType: "SETTING" },
];

export async function registerCompany(
  email: string,
  password: string,
  companyName: string,
  domain: string
) {
  if (!checkStrong(password)) {
    throw new Error("Password too weak");
  }
  const existingAccount = await prisma.account.findUnique({ where: { email } });
  if (existingAccount) {
    throw new Error("Account already exists");
  }
  const existingOrg = await prisma.org.findUnique({ where: { domain } });
  if (existingOrg) {
    throw new Error("A company with this domain already exists");
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const account = await prisma.account.create({
    data: { email, passwordHash, authProvider: "MANUAL" },
  });

  const org = await prisma.org.create({ data: { name: companyName, domain } });

  const role = await prisma.role.create({
    data: { name: "Owner", level: "ORG", orgId: org.id },
  });
  await prisma.permission.createMany({
    data: OWNER_PERMISSIONS.map((p) => ({
      roleId: role.id,
      action: p.action as any,
      targetType: p.targetType as any,
    })),
  });

  const member = await prisma.member.create({ data: { accountId: account.id, orgId: org.id } });
  await prisma.memberRole.create({ data: { memberId: member.id, roleId: role.id } });

  return { account, org };
}

export async function registerStaffByDomain(
  email: string,
  password: string,
  domain: string
) {
  if (!checkStrong(password)) {
    throw new Error("Password too weak");
  }
  const existingAccount = await prisma.account.findUnique({ where: { email } });
  if (existingAccount) {
    throw new Error("Account already exists");
  }
  const org = await prisma.org.findUnique({ where: { domain } });
  if (!org) {
    throw new Error("No company found with that domain");
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const account = await prisma.account.create({
    data: { email, passwordHash, authProvider: "MANUAL" },
  });

  const member = await prisma.member.create({ data: { accountId: account.id, orgId: org.id } });
  // No role granted yet — an existing Owner/Admin must grant one via
  // Members & Roles, matching how inviteMember/grantRole already work.

  return { account, org, member };
}
