import "server-only";

import { RolUsuario } from "@/generated/prisma/enums";
import { ADMIN_ROLES, requireSystemRole } from "@/lib/auth/authorization";
import { prisma } from "@/lib/db/prisma";
import { registrarAuditoria } from "@/lib/services/audit";
import { z } from "zod";

const userInputSchema = z.object({
  neonAuthUserId: z.string().trim().min(1).max(255),
  rol: z.enum(RolUsuario),
  nombreCompleto: z.string().trim().min(1).max(250),
});

function normalizarRolLegacy(input: unknown) {
  if (input === "ASISTENTE") return RolUsuario.GESTOR;
  if (input === "ADMINISTRADOR_GENERAL") return RolUsuario.ADMINISTRADOR;
  return input;
}

export async function registrarUsuario(input: unknown) {
  const { user: actor } = await requireSystemRole(ADMIN_ROLES);
  const parsed = userInputSchema.parse({
    ...(input as Record<string, unknown>),
    rol: normalizarRolLegacy((input as { rol?: unknown }).rol),
  });
  const data = parsed;

  return prisma.$transaction(async (tx) => {
    const registered = await tx.usuarioSistema.upsert({
      where: { neonAuthUserId: data.neonAuthUserId },
      create: {
        neonAuthUserId: data.neonAuthUserId,
        rol: data.rol,
        activo: true,
        perfil: { create: { nombreCompleto: data.nombreCompleto } },
      },
      update: {
        rol: data.rol,
        activo: true,
        perfil: { upsert: { create: { nombreCompleto: data.nombreCompleto }, update: { nombreCompleto: data.nombreCompleto } } },
      },
    });
    const propietario = data.rol === RolUsuario.PROPIETARIO
      ? await tx.propietario.upsert({ where: { usuarioSistemaId: registered.id }, create: { usuarioSistemaId: registered.id, nombre: data.nombreCompleto }, update: {} })
      : null;
    await registrarAuditoria(tx, { usuarioSistemaId: actor.id, accion: "CREAR_USUARIO", entidad: "UsuarioSistema", entidadId: registered.id, despues: { rol: registered.rol, propietarioId: propietario?.id ?? null } });
    return registered;
  });
}

export async function actualizarUsuarioSistema(id: string, input: unknown) {
  const { user: actor } = await requireSystemRole(ADMIN_ROLES);
  const data = z.object({ rol: z.enum(RolUsuario), activo: z.boolean() }).parse({
    ...(input as Record<string, unknown>),
    rol: normalizarRolLegacy((input as { rol?: unknown }).rol),
  });
  const target = await prisma.usuarioSistema.findUnique({ where: { id }, include: { perfil: true, propietario: true } });
  if (!target) throw new Error("Usuario no encontrado.");
  if (target.id === actor.id && !data.activo) throw new Error("No puedes desactivar tu propia cuenta.");
  if (target.rol === RolUsuario.ADMINISTRADOR && (!data.activo || data.rol !== RolUsuario.ADMINISTRADOR)) {
    const activeAdmins = await prisma.usuarioSistema.count({ where: { rol: RolUsuario.ADMINISTRADOR, activo: true } });
    if (activeAdmins <= 1) throw new Error("Debe permanecer un administrador activo.");
  }
  return prisma.$transaction(async (tx) => {
    const updated = await tx.usuarioSistema.update({ where: { id }, data });
    const propietario = data.rol === RolUsuario.PROPIETARIO
      ? await tx.propietario.upsert({ where: { usuarioSistemaId: id }, create: { usuarioSistemaId: id, nombre: target.perfil?.nombreCompleto ?? `Usuario ${id.slice(0, 8)}` }, update: {} })
      : target.propietario;
    await registrarAuditoria(tx, { usuarioSistemaId: actor.id, accion: "ACTUALIZAR_USUARIO", entidad: "UsuarioSistema", entidadId: id, antes: { rol: target.rol, activo: target.activo }, despues: { rol: updated.rol, activo: updated.activo, propietarioId: propietario?.id ?? null } });
    return updated;
  });
}

export async function registrarRestablecimientoContrasena(id: string) {
  const { user: actor } = await requireSystemRole(ADMIN_ROLES);
  const target = await prisma.usuarioSistema.findUnique({ where: { id }, select: { id: true } });
  if (!target) throw new Error("Usuario no encontrado.");
  await prisma.registroAuditoria.create({ data: { usuarioSistemaId: actor.id, accion: "RESTABLECER_CONTRASENA", entidad: "UsuarioSistema", entidadId: id, despues: { solicitado: true } } });
}
