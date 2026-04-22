import { PrismaClient } from "@prisma/client";
import { ensureSchemaColumns } from "./db-heal";

const createPrismaClient = () => {
  return new PrismaClient({
    log: process.env.NODE_ENV === "production" ? ["error"] : ["warn"],
    datasourceUrl: process.env.DATABASE_URL
      ? `${process.env.DATABASE_URL}${process.env.DATABASE_URL.includes("?") ? "&" : "?"}connection_limit=10&pool_timeout=20`
      : undefined,
  }).$extends({
    result: {
      referee: {
        firstName: {
          needs: { firstName: true },
          compute(referee) {
            return referee.firstName ? referee.firstName.toLocaleUpperCase('tr-TR') : '';
          },
        },
        lastName: {
          needs: { lastName: true },
          compute(referee) {
            return referee.lastName ? referee.lastName.toLocaleUpperCase('tr-TR') : '';
          },
        },
      },
      generalOfficial: {
        firstName: {
          needs: { firstName: true },
          compute(official) {
            return official.firstName ? official.firstName.toLocaleUpperCase('tr-TR') : '';
          },
        },
        lastName: {
          needs: { lastName: true },
          compute(official) {
            return official.lastName ? official.lastName.toLocaleUpperCase('tr-TR') : '';
          },
        },
      },
    },
  });
};

const globalForPrisma = global as unknown as { prisma: ReturnType<typeof createPrismaClient> };

export const db = globalForPrisma.prisma || createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;

// Trigger self-healing in the background (delayed to break circular dependency)
setTimeout(() => {
  ensureSchemaColumns().catch(err => {
    console.error("[DB] Background schema healing failed:", err);
  });
}, 0);

// 10/10 Tip: Prisma handles connections lazily, so this won't throw until the first query.
