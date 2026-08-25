import "server-only";

import { RolUsuario } from "@/generated/prisma/enums";
import { getSystemUser } from "@/lib/auth/authorization";
import { prisma } from "@/lib/db/prisma";
import { DomainError } from "@/lib/domain/errors";
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
  const legalName = data.razonSocial || data.nombreCompleto;

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

    if (user.rol === RolUsuario.ADMINISTRADOR || user.rol === RolUsuario.PROPIETARIO) {
      const linkedOwner = await transaction.propietario.findUnique({
        where: { usuarioSistemaId: user.id },
      });

      if (linkedOwner) {
        await transaction.propietario.update({
          where: { id: linkedOwner.id },
          data: { nombre: legalName },
        });
      } else {
        const unlinkedOwners = await transaction.propietario.findMany({
          where: { usuarioSistemaId: null },
          take: 2,
        });

        if (unlinkedOwners.length === 1) {
          await transaction.propietario.update({
            where: { id: unlinkedOwners[0].id },
            data: { usuarioSistemaId: user.id, nombre: legalName },
          });
        } else {
          await transaction.propietario.create({
            data: { usuarioSistemaId: user.id, nombre: legalName },
          });
        }
      }
    }

    return profile;
  });
}

export async function obtenerPropietarioActual() {
  const { user } = await getSystemUser();
  const ownOwner = await prisma.propietario.findUnique({
    where: { usuarioSistemaId: user.id },
  });

  const owner =
    ownOwner ??
    (user.rol === RolUsuario.GESTOR
      ? await prisma.propietario.findFirst({
          where: {
            usuarioSistema: { rol: RolUsuario.ADMINISTRADOR, activo: true },
          },
          orderBy: { creadoEn: "asc" },
        })
      : null);

  if (!owner) {
    throw new DomainError(
      "PROFILE_REQUIRED",
      "Completa tu perfil antes de registrar propiedades.",
    );
  }

  return owner;
}
