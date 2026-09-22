import "server-only";

import { RolUsuario } from "@/generated/prisma/enums";
import { ADMIN_ROLES, requireSystemRole } from "@/lib/auth/authorization";
import { prisma } from "@/lib/db/prisma";
import { registrarAuditoria } from "@/lib/services/audit";
import { propietarioCuentaSchema } from "@/lib/validation/owners";
import { z } from "zod";

const userInputSchema = z.object({
  neonAuthUserId: z.string().trim().min(1).max(255),
  nombreCompleto: z.string().trim().min(1).max(250),
}).and(propietarioCuentaSchema);

const userUpdateSchema = z.object({
  activo: z.boolean(),
}).and(propietarioCuentaSchema);

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
    if (data.propietarioId) {
      const propietario = await tx.propietario.findUnique({
        where: { id: data.propietarioId },
        select: { id: true },
      });
      if (!propietario) throw new Error("El propietario seleccionado no existe.");
    }

    const registered = await tx.usuarioSistema.upsert({
      where: { neonAuthUserId: data.neonAuthUserId },
      create: {
        neonAuthUserId: data.neonAuthUserId,
        rol: data.rol,
        activo: true,
        propietarioId: data.propietarioId ?? null,
        perfil: { create: { nombreCompleto: data.nombreCompleto } },
      },
      update: {
        rol: data.rol,
        activo: true,
        propietarioId: data.propietarioId ?? null,
        perfil: { upsert: { create: { nombreCompleto: data.nombreCompleto }, update: { nombreCompleto: data.nombreCompleto } } },
      },
    });
    await registrarAuditoria(tx, { usuarioSistemaId: actor.id, accion: "CREAR_USUARIO", entidad: "UsuarioSistema", entidadId: registered.id, despues: { rol: registered.rol, activo: registered.activo, propietarioId: registered.propietarioId } });
    return registered;
  });
}

export async function actualizarUsuarioSistema(id: string, input: unknown) {
  const { user: actor } = await requireSystemRole(ADMIN_ROLES);
  const data = userUpdateSchema.parse({
    ...(input as Record<string, unknown>),
    rol: normalizarRolLegacy((input as { rol?: unknown }).rol),
  });
  const target = await prisma.usuarioSistema.findUnique({ where: { id }, include: { perfil: true } });
  if (!target) throw new Error("Usuario no encontrado.");
  if (target.id === actor.id && !data.activo) throw new Error("No puedes desactivar tu propia cuenta.");
  if (target.rol === RolUsuario.ADMINISTRADOR && (!data.activo || data.rol !== RolUsuario.ADMINISTRADOR)) {
    const activeAdmins = await prisma.usuarioSistema.count({ where: { rol: RolUsuario.ADMINISTRADOR, activo: true } });
    if (activeAdmins <= 1) throw new Error("Debe permanecer un administrador activo.");
  }
  return prisma.$transaction(async (tx) => {
    if (data.propietarioId) {
      const propietario = await tx.propietario.findUnique({
        where: { id: data.propietarioId },
        select: { id: true },
      });
      if (!propietario) throw new Error("El propietario seleccionado no existe.");
    }

    const updated = await tx.usuarioSistema.update({
      where: { id },
      data: {
        rol: data.rol,
        activo: data.activo,
        propietarioId: data.propietarioId ?? null,
      },
    });
    await registrarAuditoria(tx, { usuarioSistemaId: actor.id, accion: "ACTUALIZAR_USUARIO", entidad: "UsuarioSistema", entidadId: id, antes: { rol: target.rol, activo: target.activo, propietarioId: target.propietarioId }, despues: { rol: updated.rol, activo: updated.activo, propietarioId: updated.propietarioId } });
    return updated;
  });
}

export async function registrarRestablecimientoContrasena(id: string) {
  const { user: actor } = await requireSystemRole(ADMIN_ROLES);
  const target = await prisma.usuarioSistema.findUnique({ where: { id }, select: { id: true } });
  if (!target) throw new Error("Usuario no encontrado.");
  await prisma.registroAuditoria.create({ data: { usuarioSistemaId: actor.id, accion: "RESTABLECER_CONTRASENA", entidad: "UsuarioSistema", entidadId: id, despues: { solicitado: true } } });
}
