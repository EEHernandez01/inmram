import { NextResponse } from "next/server";

import { RolUsuario } from "@/generated/prisma/enums";
import { requireSystemRole } from "@/lib/auth/authorization";
import { isSameOrigin, safeRouteError } from "@/lib/http/route-security";
import { registrarUsuarioAdministrador } from "@/lib/services/admin-users";
import { usuarioAdministradorInputSchema } from "@/lib/validation/foundation";

export async function POST(request: Request) {
  if (!isSameOrigin(request)) {
    return new NextResponse("Origen no permitido.", { status: 403 });
  }

  try {
    await requireSystemRole([RolUsuario.DUENO]);

    const payload = usuarioAdministradorInputSchema.parse(await request.json());
    const user = await registrarUsuarioAdministrador(payload);

    return NextResponse.json({
      id: user.id,
    });
  } catch (error) {
    return NextResponse.json({ error: safeRouteError(error) }, { status: 400 });
  }
}