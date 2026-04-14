import jwt from "jsonwebtoken";
import { config } from "../config.js";
import { httpError } from "./errorHandler.js";

export function authRequired(req, res, next) {
  const header = req.headers.authorization || "";
  const [type, token] = header.split(" ");

  if (type !== "Bearer" || !token) {
    return next(httpError(401, "Missing or invalid Authorization header", "UNAUTHORIZED"));
  }

  try {
    const payload = jwt.verify(token, config.jwtSecret);
    req.user = {
      id: payload.sub,
      role: payload.role,
    };
    return next();
  } catch {
    return next(httpError(401, "Invalid or expired token", "UNAUTHORIZED"));
  }
}

export function requireAdmin(req, res, next) {
  if (!req.user) return next(httpError(401, "Unauthorized", "UNAUTHORIZED"));
  if (req.user.role !== "ADMIN") {
    return next(httpError(403, "Admin only", "FORBIDDEN"));
  }
  return next();
}
