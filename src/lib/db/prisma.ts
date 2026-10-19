import "server-only";

import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "@/generated/prisma/client";

const databaseUrl =
  process.env.DATABASE_URL ?? process.env.POSTGRES_PRISMA_URL;

if (!databaseUrl) {
  throw new Error(
    "DATABASE_URL o POSTGRES_PRISMA_URL no está configurada.",
  );
}
const connectionString: string = databaseUrl;

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
  prismaSchemaVersion?: string;
};

const prismaSchemaVersion = "20261013000200";
const sslRootCertificate = process.env.SUPABASE_DB_SSL_ROOT_CERT;

function createPrismaClient() {
  const connectionConfig: {
    connectionString: string;
    ssl?: { ca: string };
  } = { connectionString };

  if (sslRootCertificate) {
    const url = new URL(connectionString);
    for (const parameter of [
      "sslmode",
      "sslrootcert",
      "sslcert",
      "sslkey",
      "uselibpqcompat",
    ]) {
      url.searchParams.delete(parameter);
    }

    connectionConfig.connectionString = url.toString();
    connectionConfig.ssl = { ca: sslRootCertificate };
  }

  const adapter = new PrismaPg(connectionConfig);

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
