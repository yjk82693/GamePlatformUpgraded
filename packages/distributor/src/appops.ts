import { prisma, requirePermission, logAction } from "@game-platform/commons";
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
  await logAction(actorId, "PUBLISH", "APP", build.appId, { buildId }, true);
  return updated;
}

export async function maintenanceMode(actorId: string, appId: string, on: boolean) {
  await requirePermission(actorId, "UPDATE", "APP");
  const app = await prisma.app.update({
    where: { id: appId },
    data: { status: on ? "MAINTENANCE" : "PUBLISHED" },
  });
  await logAction(actorId, "UPDATE", "APP", appId, { maintenance: on }, true);
  return app;
}

export async function authorNotice(
  actorId: string,
  appId: string,
  content: string,
  audience: string,
  schedule?: Date
) {
  await requirePermission(actorId, "CREATE", "NOTIFICATION_SETTING");
  const notice = await prisma.notice.create({
    data: {
      appId,
      content,
      audience,
      ...(schedule ? { schedule } : {}),
    },
  });
  await logAction(actorId, "CREATE", "NOTIFICATION_SETTING", notice.id, { appId, audience }, true);
  return notice;
}

export async function configureLiveEvent(
  actorId: string,
  appId: string,
  config: Prisma.InputJsonValue,
  startsAt: Date,
  endsAt: Date
) {
  await requirePermission(actorId, "PUBLISH", "APP");
  const event = await prisma.liveEvent.create({
    data: { appId, config, startsAt, endsAt },
  });
  await logAction(actorId, "PUBLISH", "APP", appId, { liveEventId: event.id, startsAt, endsAt }, true);
  return event;
}

export async function createBuild(actorId: string, appId: string, version: string, checksum: string) {
  await requirePermission(actorId, "PUBLISH", "APP");
  const build = await prisma.build.create({ data: { appId, version, checksum } });
  await logAction(actorId, "PUBLISH", "APP", appId, { buildId: build.id, version }, true);
  return build;
}

export async function listBuildsForApp(actorId: string, appId: string) {
  await requirePermission(actorId, "READ", "SETTING");
  return prisma.build.findMany({ where: { appId }, orderBy: { id: "desc" } });
}
