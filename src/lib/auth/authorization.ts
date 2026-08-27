import "server-only";

import { cache } from "react";

import { RolUsuario, type RolUsuario as RolUsuarioType } from "@/generated/prisma/enums";
import { prisma } from "@/lib/db/prisma";
import {
  AuthenticationError,
  AuthorizationError,
} from "@/lib/domain/errors";

import { getCurrentSession } from "./session";
import {
  ADMIN_ROLES,
  OPERATION_ROLES,
  READ_ROLES,
  REPORT_ROLES,
} from "./role-policy";

export { ADMIN_ROLES, OPERATION_ROLES, READ_ROLES, REPORT_ROLES };

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
