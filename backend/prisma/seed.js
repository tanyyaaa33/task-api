import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const adminEmail = "admin@demo.local";
  const userEmail = "user@demo.local";
  const password = "demo1234";

  const passwordHash = await bcrypt.hash(password, 12);

  await prisma.user.upsert({
    where: { email: adminEmail },
    update: { passwordHash, role: "ADMIN" },
    create: {
      email: adminEmail,
      passwordHash,
      role: "ADMIN",
    },
  });

  await prisma.user.upsert({
    where: { email: userEmail },
    update: { passwordHash, role: "USER" },
    create: {
      email: userEmail,
      passwordHash,
      role: "USER",
    },
  });

  console.log("Seed OK. Demo accounts:");
  console.log(`  ADMIN  ${adminEmail} / ${password}`);
  console.log(`  USER   ${userEmail} / ${password}`);
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
