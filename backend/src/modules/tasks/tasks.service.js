import { prisma } from "../../db.js";
import { httpError } from "../../middleware/errorHandler.js";

const ALLOWED_STATUS = new Set(["TODO", "DOING", "DONE"]);

export function assertValidStatus(status) {
  if (!ALLOWED_STATUS.has(status)) {
    throw httpError(400, "Invalid status. Use TODO, DOING, or DONE.", "INVALID_STATUS");
  }
}

export async function createTask({ userId, title, description, status }) {
  const s = status || "TODO";
  assertValidStatus(s);
  const task = await prisma.task.create({
    data: {
      title: title.trim(),
      description: description == null ? null : String(description).trim() || null,
      status: s,
      userId,
    },
  });
  return task;
}

export async function listMyTasks(userId) {
  return prisma.task.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
  });
}

export async function listAllTasks() {
  return prisma.task.findMany({
    orderBy: { updatedAt: "desc" },
    include: { user: { select: { id: true, email: true, role: true } } },
  });
}

export async function getTaskForUser({ taskId, userId, isAdmin }) {
  const task = await prisma.task.findUnique({ where: { id: taskId } });
  if (!task) throw httpError(404, "Task not found", "NOT_FOUND");
  if (!isAdmin && task.userId !== userId) {
    throw httpError(403, "You cannot access this task", "FORBIDDEN");
  }
  return task;
}

export async function updateTaskForUser({ taskId, userId, isAdmin, patch }) {
  const task = await getTaskForUser({ taskId, userId, isAdmin });

  const data = {};
  if (patch.title !== undefined) data.title = String(patch.title).trim();
  if (patch.description !== undefined) {
    data.description =
      patch.description == null ? null : String(patch.description).trim() || null;
  }
  if (patch.status !== undefined) {
    assertValidStatus(patch.status);
    data.status = patch.status;
  }

  if (Object.keys(data).length === 0) {
    throw httpError(400, "No valid fields to update", "EMPTY_UPDATE");
  }

  return prisma.task.update({ where: { id: task.id }, data });
}

export async function deleteTaskForUser({ taskId, userId, isAdmin }) {
  const task = await getTaskForUser({ taskId, userId, isAdmin });
  await prisma.task.delete({ where: { id: task.id } });
  return { id: task.id };
}
