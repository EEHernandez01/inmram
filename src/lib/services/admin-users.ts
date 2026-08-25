import "server-only";

import { RolUsuario } from "@/generated/prisma/enums";
import { ADMIN_ROLES, requireSystemRole } from "@/lib/auth/authorization";
import { prisma } from "@/lib/db/prisma";
import { registrarAuditoria } from "@/lib/services/audit";
import { z } from "zod";

const userInputSchema = z.object({
  neonAuthUserId: z.string().trim().min(1).max(255),
  rol: z.enum(RolUsuario),
  propietarioId: z.uuid().nullable().optional(),
  nombreCompleto: z.string().trim().min(1).max(250),
});

function normalizarRolLegacy(input: unknown) {
  if (input === "ASISTENTE") return RolUsuario.GESTOR;
  if (input === "ADMINISTRADOR_GENERAL") return RolUsuario.ADMINISTRADOR;
  return input;
}

export async function registrarUsuario(input: unknown) {
  const { user: actor } = await requireSystemRole(ADMIN_ROLES);
  const data = userInputSchema.parse({
    ...(input as Record<string, unknown>),
    rol: normalizarRolLegacy((input as { rol?: unknown }).rol),
  });
  if (data.rol === RolUsuario.PROPIETARIO && !data.propietarioId) throw new Error("Selecciona el propietario vinculado.");

  return prisma.$transaction(async (tx) => {
    if (data.propietarioId) {
      const owner = await tx.propietario.findUnique({ where: { id: data.propietarioId } });
      if (!owner) throw new Error("El propietario seleccionado no existe.");
      const existingUser = await tx.usuarioSistema.findUnique({
        where: { neonAuthUserId: data.neonAuthUserId },
        select: { id: true },
      });
      if (owner.usuarioSistemaId && owner.usuarioSistemaId !== existingUser?.id) {
        throw new Error("El propietario ya tiene una cuenta vinculada.");
      }
    }
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
    if (data.propietarioId) await tx.propietario.update({ where: { id: data.propietarioId }, data: { usuarioSistemaId: registered.id } });
    await registrarAuditoria(tx, { usuarioSistemaId: actor.id, accion: "CREAR_USUARIO", entidad: "UsuarioSistema", entidadId: registered.id, despues: { rol: registered.rol, propietarioId: data.propietarioId ?? null } });
    return registered;
  });
}

export async function actualizarUsuarioSistema(id: string, input: unknown) {
  const { user: actor } = await requireSystemRole(ADMIN_ROLES);
  const parsed = z.object({ rol: z.enum(RolUsuario), activo: z.boolean(), propietarioId: z.uuid().nullable().optional() }).parse({
    ...(input as Record<string, unknown>),
    rol: normalizarRolLegacy((input as { rol?: unknown }).rol),
  });
  const data = { ...parsed, propietarioId: parsed.rol === RolUsuario.PROPIETARIO ? parsed.propietarioId : null };
  const target = await prisma.usuarioSistema.findUnique({ where: { id }, include: { propietario: true } });
  if (!target) throw new Error("Usuario no encontrado.");
  if (target.id === actor.id && !data.activo) throw new Error("No puedes desactivar tu propia cuenta.");
  if (target.rol === RolUsuario.ADMINISTRADOR && (!data.activo || data.rol !== RolUsuario.ADMINISTRADOR)) {
    const activeAdmins = await prisma.usuarioSistema.count({ where: { rol: RolUsuario.ADMINISTRADOR, activo: true } });
    if (activeAdmins <= 1) throw new Error("Debe permanecer un administrador activo.");
  }
  if (data.rol === RolUsuario.PROPIETARIO && !data.propietarioId) throw new Error("Un propietario requiere vínculo con su registro.");
  return prisma.$transaction(async (tx) => {
    if (target.propietario && target.propietario.id !== data.propietarioId) await tx.propietario.update({ where: { id: target.propietario.id }, data: { usuarioSistemaId: null } });
    if (data.propietarioId) await tx.propietario.update({ where: { id: data.propietarioId }, data: { usuarioSistemaId: id } });
    const updated = await tx.usuarioSistema.update({ where: { id }, data: { rol: data.rol, activo: data.activo } });
    await registrarAuditoria(tx, { usuarioSistemaId: actor.id, accion: "ACTUALIZAR_USUARIO", entidad: "UsuarioSistema", entidadId: id, antes: { rol: target.rol, activo: target.activo }, despues: { rol: updated.rol, activo: updated.activo, propietarioId: data.propietarioId ?? null } });
    return updated;
  });
}

export async function registrarRestablecimientoContrasena(id: string) {
  const { user: actor } = await requireSystemRole(ADMIN_ROLES);
  const target = await prisma.usuarioSistema.findUnique({ where: { id }, select: { id: true } });
  if (!target) throw new Error("Usuario no encontrado.");
  await prisma.registroAuditoria.create({ data: { usuarioSistemaId: actor.id, accion: "RESTABLECER_CONTRASENA", entidad: "UsuarioSistema", entidadId: id, despues: { solicitado: true } } });
}
