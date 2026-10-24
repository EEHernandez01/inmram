import { NextResponse } from "next/server";
import { z } from "zod";

import { Prisma } from "@/generated/prisma/client";
import { requireSystemRole, WRITE_ROLES } from "@/lib/auth/authorization";
import { DomainError } from "@/lib/domain/errors";
import { isSameOrigin } from "@/lib/http/route-security";
import { prisma } from "@/lib/db/prisma";

const draftSchema = z.object({
  id: z.string().uuid().optional(),
  nombre: z.string().trim().min(1).max(300),
  contenido: z.record(z.string(), z.unknown()),
});

function errorResponse(error: unknown) {
  if (error instanceof DomainError) {
    return NextResponse.json({ error: error.message }, { status: error.code === "UNAUTHENTICATED" ? 401 : 403 });
  }
  return NextResponse.json({ error: "No fue posible completar la operación con el borrador." }, { status: 500 });
}

export async function GET() {
  try {
    const { user } = await requireSystemRole(WRITE_ROLES);
    const borradores = await prisma.borradorAltaPropiedad.findMany({
      where: { usuarioSistemaId: user.id },
      orderBy: { actualizadoEn: "desc" },
      select: { id: true, nombre: true, contenido: true, actualizadoEn: true },
    });
    return NextResponse.json({ borradores });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: Request) {
  if (!isSameOrigin(request)) return new NextResponse("Origen no permitido.", { status: 403 });

  try {
    const { user } = await requireSystemRole(WRITE_ROLES);
    const parsed = draftSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Revisa los datos del borrador." }, { status: 422 });
    }

    const contenido = parsed.data.contenido as Prisma.InputJsonValue;
    if (parsed.data.id) {
      const updated = await prisma.borradorAltaPropiedad.updateMany({
        where: { id: parsed.data.id, usuarioSistemaId: user.id },
        data: { nombre: parsed.data.nombre, contenido },
      });
      if (updated.count > 0) return NextResponse.json({ id: parsed.data.id });
    }

    const borrador = await prisma.borradorAltaPropiedad.create({
      data: { usuarioSistemaId: user.id, nombre: parsed.data.nombre, contenido },
      select: { id: true },
    });
    return NextResponse.json({ id: borrador.id }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(request: Request) {
  if (!isSameOrigin(request)) return new NextResponse("Origen no permitido.", { status: 403 });

  const id = new URL(request.url).searchParams.get("id");
  if (!id || !z.string().uuid().safeParse(id).success) {
    return NextResponse.json({ error: "El borrador seleccionado no es válido." }, { status: 400 });
  }

  try {
    const { user } = await requireSystemRole(WRITE_ROLES);
    await prisma.borradorAltaPropiedad.deleteMany({ where: { id, usuarioSistemaId: user.id } });
    return NextResponse.json({ eliminado: true });
  } catch (error) {
    return errorResponse(error);
  }
}
