import { PrismaClient } from "@prisma/client";

// Base, unscoped Prisma client.
// Use this ONLY for auth, tenant creation, and platform-admin work that must legitimately
// cross tenants. For all tenant-owned data, use tenantDb() from lib/tenant-db.ts so the
// tenantId filter is applied automatically and no query can leak across tenants.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ["warn", "error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
