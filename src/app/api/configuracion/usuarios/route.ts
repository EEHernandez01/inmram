import { NextResponse } from "next/server";

import { ADMIN_ROLES, requireSystemRole } from "@/lib/auth/authorization";
import { isSameOrigin, safeRouteError } from "@/lib/http/route-security";
import { actualizarUsuarioSistema, registrarRestablecimientoContrasena, registrarUsuario } from "@/lib/services/admin-users";

export async function POST(request: Request) {
  if (!isSameOrigin(request)) {
    return new NextResponse("Origen no permitido.", { status: 403 });
  }

  try {
    await requireSystemRole(ADMIN_ROLES);
    const user = await registrarUsuario(await request.json());

    return NextResponse.json({
      id: user.id,
    });
  } catch (error) {
    return NextResponse.json({ error: safeRouteError(error) }, { status: 400 });
  }
}

export async function PATCH(request: Request) {
  if (!isSameOrigin(request)) return new NextResponse("Origen no permitido.", { status: 403 });
  try {
    await requireSystemRole(ADMIN_ROLES);
    const payload = await request.json() as { id?: string; rol?: string; activo?: boolean; propietarioId?: string | null };
    if (!payload.id) throw new Error("Usuario no válido.");
    if ((payload as { action?: string }).action === "PASSWORD_RESET") {
      await registrarRestablecimientoContrasena(payload.id);
      return NextResponse.json({ id: payload.id });
    }
    const user = await actualizarUsuarioSistema(payload.id, payload);
    return NextResponse.json({ id: user.id });
  } catch (error) {
    return NextResponse.json({ error: safeRouteError(error) }, { status: 400 });
  }
}
