import "server-only";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "@/lib/generated/prisma/client";

function createPrismaClient() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");
  return new PrismaClient({ adapter: new PrismaMariaDb(url) });
}

// Reuse one client across hot reloads in development.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

// After `prisma generate` (e.g. a new migration) the regenerated client is a new class. A client
// cached from before still has the old schema and fails on new columns, so replace it.
const cached = globalForPrisma.prisma;
if (cached && !(cached instanceof PrismaClient)) void (cached as PrismaClient).$disconnect().catch(() => undefined);

export const prisma = cached instanceof PrismaClient ? cached : createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
