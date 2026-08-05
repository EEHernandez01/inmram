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
    include: { perfil: true },
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

export const READ_ROLES = [
  RolUsuario.DUENO,
  RolUsuario.ADMINISTRADOR,
  RolUsuario.SOLO_LECTURA,
] as const;

export const WRITE_ROLES = [
  RolUsuario.DUENO,
  RolUsuario.ADMINISTRADOR,
] as const;
