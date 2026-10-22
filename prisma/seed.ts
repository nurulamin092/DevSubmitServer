import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { PrismaClient, Role } from "../src/generated/prisma/client.js";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is not set");
}

const pool = new Pool({ connectionString });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

async function main() {
  const email = process.env.ADMIN_EMAIL ?? "admin@devsubmit.local";
  const password = process.env.ADMIN_PASSWORD ?? "Admin@12345";
  const name = process.env.ADMIN_NAME ?? "System Admin";
  const rounds = Number(process.env.BCRYPT_ROUNDS ?? 12);

  const passwordHash = await bcrypt.hash(password, rounds);

  const admin = await prisma.user.upsert({
    where: { email },
    update: {},
    create: { email, name, passwordHash, role: Role.ADMIN },
  });

  const mentorEmail = "mentor@devsubmit.local";
  await prisma.user.upsert({
    where: { email: mentorEmail },
    update: {},
    create: {
      email: mentorEmail,
      name: "Demo Mentor",
      passwordHash: await bcrypt.hash("Mentor@12345", rounds),
      role: Role.MENTOR,
    },
  });

  console.log(` Admin seeded: ${admin.email}`);
  console.log(` Mentor seeded: ${mentorEmail}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
