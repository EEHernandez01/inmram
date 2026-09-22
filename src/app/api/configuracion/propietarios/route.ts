import { NextResponse } from "next/server";

import { ADMIN_ROLES, requireSystemRole } from "@/lib/auth/authorization";
import { isSameOrigin, safeRouteError } from "@/lib/http/route-security";
import {
  actualizarPropietario,
  crearPropietario,
  eliminarPropietario,
} from "@/lib/services/foundation";

export async function POST(request: Request) {
  if (!isSameOrigin(request)) return new NextResponse("Origen no permitido.", { status: 403 });

  try {
    await requireSystemRole(ADMIN_ROLES);
    const propietario = await crearPropietario(await request.json());
    return NextResponse.json({ id: propietario.id });
  } catch (error) {
    return NextResponse.json({ error: safeRouteError(error) }, { status: 400 });
  }
}

export async function PATCH(request: Request) {
  if (!isSameOrigin(request)) return new NextResponse("Origen no permitido.", { status: 403 });

  try {
    await requireSystemRole(ADMIN_ROLES);
    const payload = await request.json() as { id?: string; nombre?: string; telefono?: string | null; correo?: string | null };
    if (!payload.id) throw new Error("Propietario no válido.");
    const propietario = await actualizarPropietario(payload.id, {
      nombre: payload.nombre ?? "",
      telefono: payload.telefono,
      correo: payload.correo,
    });
    return NextResponse.json({ id: propietario.id });
  } catch (error) {
    return NextResponse.json({ error: safeRouteError(error) }, { status: 400 });
  }
}

export async function DELETE(request: Request) {
  if (!isSameOrigin(request)) return new NextResponse("Origen no permitido.", { status: 403 });

  try {
    await requireSystemRole(ADMIN_ROLES);
    const payload = await request.json() as { id?: string };
    if (!payload.id) throw new Error("Propietario no válido.");
    await eliminarPropietario(payload.id);
    return NextResponse.json({ id: payload.id });
  } catch (error) {
    return NextResponse.json({ error: safeRouteError(error) }, { status: 400 });
  }
}
