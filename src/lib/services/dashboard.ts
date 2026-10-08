import "server-only";

import { EstadoContrato } from "@/generated/prisma/enums";
import {
  getOwnerScope,
  READ_ROLES,
  requireSystemRole,
} from "@/lib/auth/authorization";
import { currentCollectionDate } from "@/lib/calculations/collection";
import { prisma } from "@/lib/db/prisma";

/** Contratos activos cuya renovación conviene preparar desde Inicio. */
export async function listarProximosVencimientosContrato(
  now = currentCollectionDate(),
) {
  await requireSystemRole(READ_ROLES);
  const ownerId = await getOwnerScope();
  const limit = new Date(now);
  limit.setUTCDate(limit.getUTCDate() + 90);
  const where = {
    estado: EstadoContrato.ACTIVO,
    fechaFin: { gte: now, lte: limit },
    ...(ownerId ? { unidad: { propietarioId: ownerId } } : {}),
  };

  const [total, contracts] = await Promise.all([
    prisma.contrato.count({ where }),
    prisma.contrato.findMany({
      where,
      orderBy: { fechaFin: "asc" },
      take: 5,
      select: {
        id: true,
        arrendatario: true,
        fechaFin: true,
        unidad: {
          select: {
            id: true,
            identificador: true,
            propiedad: { select: { id: true, direccion: true } },
          },
        },
      },
    }),
  ]);

  return { total, contracts };
}
