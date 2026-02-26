import { PrismaClient } from "@prisma/client";

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const db =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === "production" ? [] : ["query"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;

// 10/10 Tip: Prisma handles connections lazily, so this won't throw until the first query.
