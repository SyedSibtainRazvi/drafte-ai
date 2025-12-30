import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const globalForPrisma = global as unknown as {
  prisma: PrismaClient | undefined;
};

// NOTE: Prisma 7.x requires either accelerateUrl OR adapter
// Since we're not using accelerate, we use the PostgreSQL adapter for Neon
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL environment variable is required");
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ["error"],
    adapter: new PrismaPg(new Pool({ connectionString })),
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
