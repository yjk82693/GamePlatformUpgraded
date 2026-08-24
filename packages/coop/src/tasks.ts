import { prisma } from "@game-platform/commons";
import type { TaskPriority } from "@game-platform/commons";

export async function addTask(
  actorId: string,
  scope: string,
  title: string,
  priority: TaskPriority,
  due?: Date
) {
  const member = await prisma.member.findFirst({ where: { accountId: actorId } });
  if (!member) throw new Error("Forbidden: staff only");

  return prisma.task.create({
    data: {
      scope,
      title,
      priority,
      ...(due ? { dueDate: due } : {}),
    },
  });
}

export async function assignTask(actorId: string, taskId: string, assigneeId: string) {
  const assigneeIsMember = await prisma.member.findFirst({ where: { accountId: assigneeId } });
  if (!assigneeIsMember) throw new Error("Assignee is not a staff member");
  return prisma.task.update({ where: { id: taskId }, data: { assigneeId } });
}

export async function setPriority(actorId: string, taskId: string, priority: TaskPriority) {
  return prisma.task.update({ where: { id: taskId }, data: { priority } });
}

export async function completeTask(actorId: string, taskId: string) {
  const result = await prisma.task.updateMany({
    where: { id: taskId, status: { not: "DONE" } },
    data: { status: "DONE", completedAt: new Date() },
  });
  if (result.count === 0) throw new Error("Task already complete or not found");
  return prisma.task.findUnique({ where: { id: taskId } });
}

export async function listTasks(scope: string, filter?: { assigneeId?: string }) {
  return prisma.task.findMany({
    where: {
      scope,
      ...(filter?.assigneeId ? { assigneeId: filter.assigneeId } : {}),
    },
    orderBy: [{ priority: "desc" }, { dueDate: "asc" }],
  });
}
