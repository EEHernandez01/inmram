import "server-only";

import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "@/generated/prisma/client";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL no está configurada.");
}

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
  prismaSchemaVersion?: string;
};

const prismaSchemaVersion = "20261013000200";

function createPrismaClient() {
  const adapter = new PrismaPg({ connectionString });

  return new PrismaClient({ adapter });
}

const cachedPrisma =
  globalForPrisma.prismaSchemaVersion === prismaSchemaVersion
    ? globalForPrisma.prisma
    : undefined;

export const prisma = cachedPrisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
  globalForPrisma.prismaSchemaVersion = prismaSchemaVersion;
}
