import { prisma, requirePermission } from "@game-platform/commons";
import type { CalScope, TaskPriority } from "@game-platform/commons";

export async function checkOverlap(scope: CalScope, start: Date, end: Date) {
  return prisma.calendarEvent.findMany({
    where: {
      scope,
      start: { lt: end },
      end: { gt: start },
    },
  });
}

export async function createEvent(
  actorId: string,
  scope: CalScope,
  title: string,
  start: Date,
  end: Date
) {
  if (end < start) throw new Error("End must be after start");
  if (scope === "COMPANY") {
    await requirePermission(actorId, "CREATE", "SETTING");
  }
  const warn = await checkOverlap(scope, start, end);
  const event = await prisma.calendarEvent.create({
    data: { scope, title, start, end, ownerId: actorId },
  });
  return { event, warn };
}

export async function updateEvent(
  actorId: string,
  eventId: string,
  fields: Partial<{ title: string; start: Date; end: Date }>
) {
  const event = await prisma.calendarEvent.findUnique({ where: { id: eventId } });
  if (!event) throw new Error("Event not found");
  if (event.scope === "PERSONAL" && event.ownerId !== actorId) {
    throw new Error("Forbidden: personal events are private to their owner");
  }
  if (event.scope === "COMPANY") {
    await requirePermission(actorId, "UPDATE", "SETTING");
  }
  return prisma.calendarEvent.update({ where: { id: eventId }, data: fields });
}

export async function deleteEvent(actorId: string, eventId: string) {
  const event = await prisma.calendarEvent.findUnique({ where: { id: eventId } });
  if (!event) throw new Error("Event not found");
  if (event.scope === "PERSONAL" && event.ownerId !== actorId) {
    throw new Error("Forbidden: personal events are private to their owner");
  }
  if (event.scope === "COMPANY") {
    await requirePermission(actorId, "UPDATE", "SETTING");
  }
  return prisma.calendarEvent.delete({ where: { id: eventId } });
}

export async function listEvents(actorId: string, range: { start: Date; end: Date }) {
  const company = await prisma.calendarEvent.findMany({
    where: { scope: "COMPANY", start: { lte: range.end }, end: { gte: range.start } },
  });
  const personal = await prisma.calendarEvent.findMany({
    where: {
      scope: "PERSONAL",
      ownerId: actorId,
      start: { lte: range.end },
      end: { gte: range.start },
    },
  });
  return [...company, ...personal].sort((a, b) => a.start.getTime() - b.start.getTime());
}

export async function suggestSlot(priority: TaskPriority, durationMinutes: number) {
  const now = new Date();
  const rangeEnd = new Date(now.getTime() + 1000 * 60 * 60 * 24 * 14); // next 2 weeks
  const busy = await prisma.calendarEvent.findMany({
    where: { scope: "COMPANY", start: { lte: rangeEnd }, end: { gte: now } },
    orderBy: { start: "asc" },
  });

  const gaps: { start: Date; end: Date }[] = [];
  let cursor = now;
  for (const b of busy) {
    if (b.start > cursor) {
      gaps.push({ start: cursor, end: b.start });
    }
    if (b.end > cursor) cursor = b.end;
  }
  gaps.push({ start: cursor, end: rangeEnd });

  const durationMs = durationMinutes * 60 * 1000;
  const validGaps = gaps.filter((g) => g.end.getTime() - g.start.getTime() >= durationMs);

  // HIGH -> earliest; MEDIUM -> near-term after HIGH slots; LOW -> later/flexible
  if (priority === "HIGH") return validGaps.slice(0, 3);
  if (priority === "MEDIUM") return validGaps.slice(1, 4);
  return validGaps.slice(-3);
}

export async function remindersOnLoad(actorId: string) {
  const soon = new Date(Date.now() + 1000 * 60 * 60 * 24);
  const dueTasks = await prisma.task.findMany({
    where: { assigneeId: actorId, dueDate: { lte: soon }, priority: { not: "LOW" } },
  });
  const upcomingEvents = await prisma.calendarEvent.findMany({
    where: {
      OR: [{ scope: "COMPANY" }, { scope: "PERSONAL", ownerId: actorId }],
      start: { lte: soon, gte: new Date() },
    },
  });
  return { dueTasks, upcomingEvents };
}
