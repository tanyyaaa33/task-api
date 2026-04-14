import { Router } from "express";
import { z } from "zod";
import { authRequired, requireAdmin } from "../../middleware/auth.js";
import * as tasksService from "./tasks.service.js";

export const tasksRouter = Router();

tasksRouter.use(authRequired);

const createSchema = z.object({
  title: z.string().trim().min(1).max(200),
  description: z.string().trim().max(2000).optional().nullable(),
  status: z.enum(["TODO", "DOING", "DONE"]).optional(),
});

const updateSchema = z
  .object({
    title: z.string().trim().min(1).max(200).optional(),
    description: z.string().trim().max(2000).optional().nullable(),
    status: z.enum(["TODO", "DOING", "DONE"]).optional(),
  })
  .strict();

/**
 * @openapi
 * /api/v1/tasks:
 *   post:
 *     tags: [Tasks]
 *     summary: Create a task (owned by current user)
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/TaskCreate'
 *     responses:
 *       201:
 *         description: Created
 *   get:
 *     tags: [Tasks]
 *     summary: List my tasks
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: OK
 */
tasksRouter.post("/", async (req, res, next) => {
  try {
    const body = createSchema.parse(req.body);
    const task = await tasksService.createTask({
      userId: req.user.id,
      title: body.title,
      description: body.description,
      status: body.status,
    });
    res.status(201).json({ data: { task } });
  } catch (e) {
    next(e);
  }
});

tasksRouter.get("/", async (req, res, next) => {
  try {
    const tasks = await tasksService.listMyTasks(req.user.id);
    res.json({ data: { tasks } });
  } catch (e) {
    next(e);
  }
});

/**
 * @openapi
 * /api/v1/tasks/{taskId}:
 *   get:
 *     tags: [Tasks]
 *     summary: Get a task (owner or admin)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: taskId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: OK
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Not found
 *   patch:
 *     tags: [Tasks]
 *     summary: Update a task (owner or admin)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: taskId
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/TaskUpdate'
 *     responses:
 *       200:
 *         description: OK
 *   delete:
 *     tags: [Tasks]
 *     summary: Delete a task (owner or admin)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: taskId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: OK
 */
tasksRouter.get("/:taskId", async (req, res, next) => {
  try {
    const task = await tasksService.getTaskForUser({
      taskId: req.params.taskId,
      userId: req.user.id,
      isAdmin: req.user.role === "ADMIN",
    });
    res.json({ data: { task } });
  } catch (e) {
    next(e);
  }
});

tasksRouter.patch("/:taskId", async (req, res, next) => {
  try {
    const body = updateSchema.parse(req.body);
    const task = await tasksService.updateTaskForUser({
      taskId: req.params.taskId,
      userId: req.user.id,
      isAdmin: req.user.role === "ADMIN",
      patch: body,
    });
    res.json({ data: { task } });
  } catch (e) {
    next(e);
  }
});

tasksRouter.delete("/:taskId", async (req, res, next) => {
  try {
    const result = await tasksService.deleteTaskForUser({
      taskId: req.params.taskId,
      userId: req.user.id,
      isAdmin: req.user.role === "ADMIN",
    });
    res.status(200).json({ data: { deleted: true, ...result } });
  } catch (e) {
    next(e);
  }
});

export const adminTasksRouter = Router();

adminTasksRouter.use(authRequired, requireAdmin);

/**
 * @openapi
 * /api/v1/admin/tasks:
 *   get:
 *     tags: [Admin]
 *     summary: List all tasks (ADMIN only)
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: OK
 *       403:
 *         description: Forbidden
 */
adminTasksRouter.get("/", async (req, res, next) => {
  try {
    const tasks = await tasksService.listAllTasks();
    res.json({ data: { tasks } });
  } catch (e) {
    next(e);
  }
});
