import "server-only";

import { cache } from "react";

import { RolUsuario, type RolUsuario as RolUsuarioType } from "@/generated/prisma/enums";
import { prisma } from "@/lib/db/prisma";
import {
  AuthenticationError,
  AuthorizationError,
} from "@/lib/domain/errors";

import { getCurrentSession } from "./session";

export const getSystemUser = cache(async () => {
  const session = await getCurrentSession();

  if (!session?.user) {
    throw new AuthenticationError();
  }

  const user = await prisma.usuarioSistema.findUnique({
    where: { neonAuthUserId: session.user.id },
    include: { perfil: true, propietario: true },
  });

  if (!user?.activo) {
    throw new AuthorizationError();
  }

  return { session, user };
});

export async function requireSystemRole(allowedRoles: readonly RolUsuarioType[]) {
  const context = await getSystemUser();

  if (!allowedRoles.includes(context.user.rol)) {
    throw new AuthorizationError();
  }

  return context;
}

export const ADMIN_ROLES = [RolUsuario.ADMINISTRADOR] as const;
export const OPERATION_ROLES = [
  RolUsuario.ADMINISTRADOR,
  RolUsuario.GESTOR,
] as const;
export const READ_ROLES = [
  RolUsuario.ADMINISTRADOR,
  RolUsuario.GESTOR,
  RolUsuario.PROPIETARIO,
  RolUsuario.SOLO_LECTURA,
] as const;
export const WRITE_ROLES = OPERATION_ROLES;

export async function getOwnerScope() {
  const context = await getSystemUser();
  if (context.user.rol !== RolUsuario.PROPIETARIO) return null;
  if (!context.user.propietario) throw new AuthorizationError();
  return context.user.propietario.id;
}

export async function requirePropertyAccess(propertyId: string) {
  const ownerId = await getOwnerScope();
  if (!ownerId) return;
  const property = await prisma.propiedad.findFirst({
    where: { id: propertyId, propietarioId: ownerId },
    select: { id: true },
  });
  if (!property) throw new AuthorizationError();
}

export async function requireReceiptPaymentAccess(receiptId: string) {
  const { user } = await getSystemUser();
  if (WRITE_ROLES.includes(user.rol as (typeof WRITE_ROLES)[number])) return;
  if (user.rol !== RolUsuario.PROPIETARIO || !user.propietario) {
    throw new AuthorizationError();
  }
  const receipt = await prisma.recibo.findFirst({
    where: {
      id: receiptId,
      contrato: { unidad: { propiedad: { propietarioId: user.propietario.id } } },
    },
    select: { id: true },
  });
  if (!receipt) throw new AuthorizationError();
}
