import { neonConfig } from "@neondatabase/serverless";
import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "../src/generated/prisma/client.ts";
import ws from "ws";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error("Error: DATABASE_URL no está configurada en el archivo .env.");
  process.exit(1);
}

neonConfig.webSocketConstructor = ws;

const prisma = new PrismaClient({
  adapter: new PrismaNeon({ connectionString }),
});

try {
  await prisma.$queryRaw`SELECT 1`;
  console.log("Conexión a la base de datos establecida correctamente.");
} catch (error) {
  console.error("No se pudo conectar a la base de datos.");
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}
