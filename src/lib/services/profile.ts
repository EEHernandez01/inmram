import "server-only";

import { getSystemUser } from "@/lib/auth/authorization";
import { prisma } from "@/lib/db/prisma";
import {
  decryptProfileValue,
  encryptProfileValue,
} from "@/lib/security/profile-encryption";
import {
  perfilUsuarioInputSchema,
  type PerfilUsuarioInput,
} from "@/lib/validation/foundation";

export async function obtenerPerfilActual() {
  const { user } = await getSystemUser();
  const profile = await prisma.perfilUsuario.findUnique({
    where: { usuarioSistemaId: user.id },
  });

  if (!profile) return null;

  return {
    ...profile,
    rfc: profile.rfcCifrado ? decryptProfileValue(profile.rfcCifrado) : null,
  };
}

export async function guardarPerfilActual(input: PerfilUsuarioInput) {
  const { user } = await getSystemUser();
  const data = perfilUsuarioInputSchema.parse(input);
  return prisma.$transaction(async (transaction) => {
    const profile = await transaction.perfilUsuario.upsert({
      where: { usuarioSistemaId: user.id },
      create: {
        usuarioSistemaId: user.id,
        nombreCompleto: data.nombreCompleto,
        alias: data.alias,
        razonSocial: data.razonSocial,
        telefono: data.telefono,
        rfcCifrado: data.rfc ? encryptProfileValue(data.rfc) : null,
      },
      update: {
        nombreCompleto: data.nombreCompleto,
        alias: data.alias,
        razonSocial: data.razonSocial,
        telefono: data.telefono,
        rfcCifrado: data.rfc ? encryptProfileValue(data.rfc) : null,
      },
    });

    return profile;
  });
}
