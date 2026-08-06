import { timingSafeEqual } from "node:crypto";

import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function isAuthorized(request: Request) {
  const secret = process.env.DATABASE_HEALTH_SECRET;
  const authorization = request.headers.get("authorization");

  if (!secret || !authorization?.startsWith("Bearer ")) return false;

  const expected = Buffer.from(secret);
  const provided = Buffer.from(authorization.slice("Bearer ".length));

  return (
    expected.length === provided.length && timingSafeEqual(expected, provided)
  );
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return Response.json({ error: "No autorizado." }, { status: 401 });
  }

  try {
    await prisma.$queryRaw`SELECT 1`;
    return Response.json({ status: "ok", service: "database" });
  } catch (error) {
    console.error("Falló la comprobación de conexión a la base de datos.", error);
    return Response.json(
      { status: "error", service: "database" },
      { status: 503 },
    );
  }
}
