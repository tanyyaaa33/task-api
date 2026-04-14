import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "../../db.js";
import { config } from "../../config.js";
import { httpError } from "../../middleware/errorHandler.js";

export async function registerUser({ email, password }) {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    throw httpError(409, "Email already registered", "EMAIL_IN_USE");
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({
    data: { email, passwordHash, role: "USER" },
    select: { id: true, email: true, role: true, createdAt: true },
  });

  return user;
}

export async function loginUser({ email, password }) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    throw httpError(401, "Invalid email or password", "INVALID_CREDENTIALS");
  }

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) {
    throw httpError(401, "Invalid email or password", "INVALID_CREDENTIALS");
  }

  const token = jwt.sign(
    { role: user.role },
    config.jwtSecret,
    { subject: user.id, expiresIn: config.jwtExpiresIn }
  );

  return {
    accessToken: token,
    tokenType: "Bearer",
    expiresIn: config.jwtExpiresIn,
    user: { id: user.id, email: user.email, role: user.role },
  };
}
