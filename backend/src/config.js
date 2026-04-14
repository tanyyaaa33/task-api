import dotenv from "dotenv";

dotenv.config();

export const config = {
  port: Number(process.env.PORT || 4000),
  jwtSecret: process.env.JWT_SECRET || "dev-only-change-me",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "8h",
  frontendOrigin: process.env.FRONTEND_ORIGIN || "http://localhost:5173",
};

if (config.jwtSecret.length < 16) {
  console.warn("JWT_SECRET should be at least 16 characters for real use.");
}
