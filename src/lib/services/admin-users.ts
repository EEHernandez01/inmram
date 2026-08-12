import "server-only";

import { RolUsuario } from "@/generated/prisma/enums";
import { prisma } from "@/lib/db/prisma";
import { type UsuarioAdministradorInput, usuarioAdministradorInputSchema } from "@/lib/validation/foundation";

export async function registrarUsuarioAdministrador(input: UsuarioAdministradorInput) {
  const data = usuarioAdministradorInputSchema.parse(input);

  return prisma.usuarioSistema.upsert({
      where: { neonAuthUserId: data.neonAuthUserId },
      create: {
        neonAuthUserId: data.neonAuthUserId,
        rol: RolUsuario.ADMINISTRADOR,
        activo: true,
      },
      update: {
        rol: RolUsuario.ADMINISTRADOR,
        activo: true,
      },
    });
}