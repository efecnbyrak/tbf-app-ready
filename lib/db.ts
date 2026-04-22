import { PrismaClient } from "@prisma/client";

const createPrismaClient = () => {
  return new PrismaClient({
    log: process.env.NODE_ENV === "production" ? ["error"] : ["warn"],
    datasourceUrl: process.env.DATABASE_URL
      ? `${process.env.DATABASE_URL}${process.env.DATABASE_URL.includes("?") ? "&" : "?"}connection_limit=5&pool_timeout=15`
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
