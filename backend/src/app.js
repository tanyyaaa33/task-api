import express from "express";
import cors from "cors";
import swaggerUi from "swagger-ui-express";
import { config } from "./config.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { authRouter } from "./modules/auth/auth.routes.js";
import { adminTasksRouter, tasksRouter } from "./modules/tasks/tasks.routes.js";
import { buildOpenApiSpec } from "./lib/swagger.js";

/**
 * @openapi
 * /health:
 *   get:
 *     tags: [System]
 *     summary: Health check
 *     security: []
 *     responses:
 *       200:
 *         description: OK
 */
export function createApp() {
  const app = express();

  app.use(
    cors({
      origin: config.frontendOrigin,
      credentials: false,
    })
  );
  app.use(express.json({ limit: "1mb" }));

  app.get("/health", (req, res) => {
    res.json({ ok: true });
  });

  const v1 = express.Router();
  v1.use("/auth", authRouter);
  v1.use("/tasks", tasksRouter);
  v1.use("/admin/tasks", adminTasksRouter);

  app.use("/api/v1", v1);

  const openapi = buildOpenApiSpec();
  app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(openapi));
  app.get("/api/openapi.json", (req, res) => res.json(openapi));

  app.use(errorHandler);

  return app;
}
