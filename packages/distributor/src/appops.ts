import { prisma, requirePermission } from "@game-platform/commons";
import type { Prisma } from "@game-platform/commons";

export async function publishBuild(actorId: string, buildId: string) {
  await requirePermission(actorId, "PUBLISH", "APP");
  const build = await prisma.build.findUnique({ where: { id: buildId } });
  if (!build) throw new Error("Build not found");
  if (!build.checksum) throw new Error("Build missing checksum");

  const alreadyCurrent = await prisma.build.findFirst({
    where: { appId: build.appId, published: true, id: { not: build.id } },
  });
  if (alreadyCurrent) {
    await prisma.build.update({ where: { id: alreadyCurrent.id }, data: { published: false } });
  }

  const updated = await prisma.build.update({ where: { id: build.id }, data: { published: true } });
  await prisma.app.update({ where: { id: build.appId }, data: { status: "PUBLISHED" } });
  return updated;
}

export async function maintenanceMode(actorId: string, appId: string, on: boolean) {
  await requirePermission(actorId, "UPDATE", "APP");
  return prisma.app.update({
    where: { id: appId },
    data: { status: on ? "MAINTENANCE" : "PUBLISHED" },
  });
}

export async function authorNotice(
  actorId: string,
  appId: string,
  content: string,
  audience: string,
  schedule?: Date
) {
  await requirePermission(actorId, "CREATE", "NOTIFICATION_SETTING");
  return prisma.notice.create({
    data: {
      appId,
      content,
      audience,
      ...(schedule ? { schedule } : {}),
    },
  });
}

export async function configureLiveEvent(
  actorId: string,
  appId: string,
  config: Prisma.InputJsonValue,
  startsAt: Date,
  endsAt: Date
) {
  await requirePermission(actorId, "PUBLISH", "APP");
  return prisma.liveEvent.create({
    data: { appId, config, startsAt, endsAt },
  });
}
