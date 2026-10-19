import { NextResponse } from "next/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";

import { ADMIN_ROLES, requireSystemRole } from "@/lib/auth/authorization";
import { prisma } from "@/lib/db/prisma";
import { isSameOrigin, safeRouteError } from "@/lib/http/route-security";
import { actualizarUsuarioSistema, registrarRestablecimientoContrasena, registrarUsuario } from "@/lib/services/admin-users";

const supabaseAdmin = createSupabaseClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } },
);

const newUserSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(8).max(128),
  nombreCompleto: z.string().trim().min(1).max(250),
  rol: z.string(),
  propietarioId: z.string().nullable().optional(),
});

export async function GET() {
  try {
    await requireSystemRole(ADMIN_ROLES);
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1000 });
    if (error) throw error;
    return NextResponse.json({ users: data.users.map(({ id, email }) => ({ id, email })) });
  } catch (error) {
    return NextResponse.json({ error: safeRouteError(error) }, { status: 400 });
  }
}

export async function POST(request: Request) {
  if (!isSameOrigin(request)) {
    return new NextResponse("Origen no permitido.", { status: 403 });
  }

  try {
    await requireSystemRole(ADMIN_ROLES);
    const input = newUserSchema.parse(await request.json());
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email: input.email,
      password: input.password,
      email_confirm: true,
      user_metadata: { name: input.nombreCompleto },
    });
    if (error) throw error;

    let user;
    try {
      user = await registrarUsuario({
        ...input,
        neonAuthUserId: data.user.id,
      });
    } catch (error) {
      await supabaseAdmin.auth.admin.deleteUser(data.user.id);
      throw error;
    }

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
    const payload = await request.json() as {
      id?: string;
      rol?: string;
      activo?: boolean;
      propietarioId?: string | null;
      action?: string;
      newPassword?: string;
    };
    if (!payload.id) throw new Error("Usuario no válido.");
    if (payload.action === "PASSWORD_RESET") {
      const reset = z.object({
        newPassword: z.string().min(8).max(128),
      }).parse(payload);
      const target = await prisma.usuarioSistema.findUnique({
        where: { id: payload.id },
        select: { neonAuthUserId: true },
      });
      if (!target) throw new Error("Usuario no encontrado.");
      const { error } = await supabaseAdmin.auth.admin.updateUserById(target.neonAuthUserId, {
        password: reset.newPassword,
      });
      if (error) throw error;
      await registrarRestablecimientoContrasena(payload.id);
      return NextResponse.json({ id: payload.id });
    }
    const user = await actualizarUsuarioSistema(payload.id, payload);
    return NextResponse.json({ id: user.id });
  } catch (error) {
    return NextResponse.json({ error: safeRouteError(error) }, { status: 400 });
  }
}
