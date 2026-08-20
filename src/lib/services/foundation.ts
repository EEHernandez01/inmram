import "server-only";

import { Prisma } from "@/generated/prisma/client";
import { EstadoContrato } from "@/generated/prisma/enums";
import {
  READ_ROLES,
  requireSystemRole,
  WRITE_ROLES,
} from "@/lib/auth/authorization";
import { prisma } from "@/lib/db/prisma";
import { DomainError } from "@/lib/domain/errors";
import { registrarAuditoria } from "@/lib/services/audit";
import {
  calculateReceiptDueDate,
  calculateReceiptStatus,
  contractOverlapsPeriod,
  currentCollectionDate,
  currentReceiptPeriod,
} from "@/lib/calculations/collection";
import {
  contratoInputSchema,
  propiedadInputSchema,
  propietarioInputSchema,
  recordIdSchema,
  toDatabaseDate,
  unidadInputSchema,
  type ContratoInput,
  type PropiedadInput,
  type PropietarioInput,
  type UnidadInput,
} from "@/lib/validation/foundation";

export async function listarPropietarios() {
  await requireSystemRole(READ_ROLES);

  return prisma.propietario.findMany({
    orderBy: { nombre: "asc" },
    include: { _count: { select: { propiedades: true } } },
  });
}

export async function obtenerPropietario(propietarioId: string) {
  await requireSystemRole(READ_ROLES);
  const id = recordIdSchema.parse(propietarioId);

  return prisma.propietario.findUnique({
    where: { id },
    include: { _count: { select: { propiedades: true } } },
  });
}

export async function crearPropietario(input: PropietarioInput) {
  await requireSystemRole(WRITE_ROLES);
  const data = propietarioInputSchema.parse(input);

  return prisma.propietario.create({ data });
}

export async function actualizarPropietario(
  propietarioId: string,
  input: PropietarioInput,
) {
  await requireSystemRole(WRITE_ROLES);
  const id = recordIdSchema.parse(propietarioId);
  const data = propietarioInputSchema.parse(input);

  return prisma.propietario.update({ where: { id }, data });
}

export async function eliminarPropietario(propietarioId: string) {
  await requireSystemRole(WRITE_ROLES);
  const id = recordIdSchema.parse(propietarioId);
  const propietario = await prisma.propietario.findUnique({
    where: { id },
    select: { _count: { select: { propiedades: true } } },
  });

  if (!propietario) {
    throw new DomainError("NOT_FOUND", "El propietario no existe.");
  }

  if (propietario._count.propiedades > 0) {
    throw new DomainError(
      "OWNER_HAS_PROPERTIES",
      "No se puede eliminar un propietario que tiene propiedades.",
    );
  }

  return prisma.propietario.delete({ where: { id } });
}

export async function listarPropiedades() {
  await requireSystemRole(READ_ROLES);

  return prisma.propiedad.findMany({
    orderBy: { direccion: "asc" },
    include: {
      propietario: true,
      marca: true,
      archivos: { where: { tipo: "FOTO_PROPIEDAD" }, orderBy: { orden: "asc" }, take: 1 },
      _count: { select: { unidades: true } },
    },
  });
}

export async function obtenerPropiedad(propiedadId: string) {
  await requireSystemRole(READ_ROLES);
  const id = recordIdSchema.parse(propiedadId);

  return prisma.propiedad.findUnique({
    where: { id },
    include: {
      propietario: true,
      marca: true,
      archivos: { where: { tipo: "FOTO_PROPIEDAD" }, orderBy: { orden: "asc" } },
      unidades: { orderBy: { identificador: "asc" } },
    },
  });
}

export async function crearPropiedad(input: PropiedadInput) {
  await requireSystemRole(WRITE_ROLES);
  const data = propiedadInputSchema.parse(input);

  return prisma.propiedad.create({ data });
}

export async function actualizarPropiedad(
  propiedadId: string,
  input: PropiedadInput,
) {
  await requireSystemRole(WRITE_ROLES);
  const id = recordIdSchema.parse(propiedadId);
  const data = propiedadInputSchema.parse(input);

  return prisma.propiedad.update({ where: { id }, data });
}

export async function eliminarPropiedad(propiedadId: string) {
  await requireSystemRole(WRITE_ROLES);
  const id = recordIdSchema.parse(propiedadId);
  const propiedad = await prisma.propiedad.findUnique({
    where: { id },
    select: { _count: { select: { unidades: true } } },
  });

  if (!propiedad) {
    throw new DomainError("NOT_FOUND", "La propiedad no existe.");
  }

  if (propiedad._count.unidades > 0) {
    throw new DomainError(
      "PROPERTY_HAS_UNITS",
      "No se puede eliminar una propiedad que tiene unidades.",
    );
  }

  return prisma.propiedad.delete({ where: { id } });
}

export async function listarUnidades(propiedadId: string) {
  await requireSystemRole(READ_ROLES);
  const id = recordIdSchema.parse(propiedadId);

  return prisma.unidad.findMany({
    where: { propiedadId: id },
    orderBy: { identificador: "asc" },
    include: {
      medidorAgua: true,
      _count: { select: { contratos: true } },
    },
  });
}

export async function obtenerUnidad(unidadId: string) {
  await requireSystemRole(READ_ROLES);
  const id = recordIdSchema.parse(unidadId);

  return prisma.unidad.findUnique({
    where: { id },
    include: {
      propiedad: { include: { propietario: true } },
      medidorAgua: true,
      contratos: { orderBy: { fechaInicio: "desc" } },
    },
  });
}

export async function crearUnidad(input: UnidadInput) {
  await requireSystemRole(WRITE_ROLES);
  const data = unidadInputSchema.parse(input);

  return prisma.unidad.create({
    data: {
      ...data,
      atributos: normalizarAtributos(data.atributos),

      amenidades: normalizarAtributos(data.amenidades),

      amenidades: normalizarAmenidades(data.amenidades),

    },
  });
}

export async function actualizarUnidad(unidadId: string, input: UnidadInput) {
  await requireSystemRole(WRITE_ROLES);
  const id = recordIdSchema.parse(unidadId);
  const data = unidadInputSchema.parse(input);

  return prisma.unidad.update({
    where: { id },
    data: {
      ...data,
      atributos: normalizarAtributos(data.atributos),
      amenidades: normalizarAtributos(data.amenidades),
    },
  });
}

export async function eliminarUnidad(unidadId: string) {
  await requireSystemRole(WRITE_ROLES);
  const id = recordIdSchema.parse(unidadId);
  const unidad = await prisma.unidad.findUnique({
    where: { id },
    select: {
      medidorAgua: { select: { id: true } },
      _count: { select: { contratos: true } },
    },
  });

  if (!unidad) {
    throw new DomainError("NOT_FOUND", "La unidad no existe.");
  }

  if (unidad.medidorAgua || unidad._count.contratos > 0) {
    throw new DomainError(
      "UNIT_HAS_HISTORY",
      "No se puede eliminar una unidad con medidor o historial de contratos.",
    );
  }

  return prisma.unidad.delete({ where: { id } });
}

export async function listarContratos(unidadId?: string) {
  await requireSystemRole(READ_ROLES);
  const parsedUnidadId = unidadId ? recordIdSchema.parse(unidadId) : undefined;

  return prisma.contrato.findMany({
    where: parsedUnidadId ? { unidadId: parsedUnidadId } : undefined,
    orderBy: { fechaInicio: "desc" },
    include: {
      unidad: { include: { propiedad: true } },
      _count: { select: { recibos: true, ajustesInflacion: true } },
    },
  });
}

export async function obtenerContrato(contratoId: string) {
  await requireSystemRole(READ_ROLES);
  const id = recordIdSchema.parse(contratoId);

  return prisma.contrato.findUnique({
    where: { id },
    include: {
      unidad: { include: { propiedad: { include: { propietario: true } } } },
      recibos: { orderBy: { periodo: "desc" } },
      ajustesInflacion: { orderBy: { fechaAplicacion: "desc" } },
    },
  });
}

export async function crearContrato(input: ContratoInput) {
  const { user } = await requireSystemRole(WRITE_ROLES);
  const data = contratoInputSchema.parse(input);

  if (data.estado === EstadoContrato.ACTIVO) {
    await asegurarUnidadSinContratoActivo(data.unidadId);
  }

  const startDate = toDatabaseDate(data.fechaInicio);
  const endDate = toDatabaseDate(data.fechaFin);
  const period = currentReceiptPeriod();

  return prisma.$transaction(async (transaction) => {
    const contract = await transaction.contrato.create({
      data: {
        ...data,
        fechaInicio: startDate,
        fechaFin: endDate,
      },
    });
    await registrarAuditoria(transaction, { usuarioSistemaId: user.id, accion: "CREAR", entidad: "Contrato", entidadId: contract.id, despues: { estado: contract.estado, fechaInicio: contract.fechaInicio.toISOString(), fechaFin: contract.fechaFin.toISOString(), rentaMensualBase: contract.rentaMensualBase.toString(), diaPago: contract.diaPago } });

    if (
      data.estado === EstadoContrato.ACTIVO &&
      contractOverlapsPeriod({ startDate, endDate, period })
    ) {
      const dueDate = calculateReceiptDueDate(period, data.diaPago);
      await transaction.recibo.create({
        data: {
          contratoId: contract.id,
          periodo: period,
          fechaVencimiento: dueDate,
          monto: data.rentaMensualBase,
          estatus: calculateReceiptStatus({
            currentDate: currentCollectionDate(),
            dueDate,
            paid: false,
          }),
        },
      });
    }

    return contract;
  });
}

export async function actualizarContrato(
  contratoId: string,
  input: ContratoInput,
) {
  const { user } = await requireSystemRole(WRITE_ROLES);
  const id = recordIdSchema.parse(contratoId);
  const data = contratoInputSchema.parse(input);

  if (data.estado === EstadoContrato.ACTIVO) {
    await asegurarUnidadSinContratoActivo(data.unidadId, id);
  }

  const before = await prisma.contrato.findUnique({ where: { id } });
  if (!before) throw new DomainError("NOT_FOUND", "El contrato no existe.");
  return prisma.$transaction(async (tx) => {
    const updated = await tx.contrato.update({ where: { id }, data: { ...data, fechaInicio: toDatabaseDate(data.fechaInicio), fechaFin: toDatabaseDate(data.fechaFin) } });
    await registrarAuditoria(tx, { usuarioSistemaId: user.id, accion: "ACTUALIZAR", entidad: "Contrato", entidadId: id, antes: { estado: before.estado, fechaInicio: before.fechaInicio.toISOString(), fechaFin: before.fechaFin.toISOString(), rentaMensualBase: before.rentaMensualBase.toString(), diaPago: before.diaPago }, despues: { estado: updated.estado, fechaInicio: updated.fechaInicio.toISOString(), fechaFin: updated.fechaFin.toISOString(), rentaMensualBase: updated.rentaMensualBase.toString(), diaPago: updated.diaPago } });
    return updated;
  });
}

export async function vencerContrato(contratoId: string) {
  const { user } = await requireSystemRole(WRITE_ROLES);
  const id = recordIdSchema.parse(contratoId);

  return prisma.$transaction(async (tx) => {
    const updated = await tx.contrato.update({ where: { id }, data: { estado: EstadoContrato.VENCIDO } });
    await registrarAuditoria(tx, { usuarioSistemaId: user.id, accion: "VENCER", entidad: "Contrato", entidadId: id, antes: { estado: EstadoContrato.ACTIVO }, despues: { estado: EstadoContrato.VENCIDO } });
    return updated;
  });
}

async function asegurarUnidadSinContratoActivo(
  unidadId: string,
  contratoIdExcluido?: string,
) {
  const contratoActivo = await prisma.contrato.findFirst({
    where: {
      unidadId,
      estado: EstadoContrato.ACTIVO,
      id: contratoIdExcluido ? { not: contratoIdExcluido } : undefined,
    },
    select: { id: true },
  });

  if (contratoActivo) {
    throw new DomainError(
      "UNIT_HAS_ACTIVE_CONTRACT",
      "La unidad ya tiene un contrato activo.",
    );
  }
}

function normalizarAtributos(value: UnidadInput["atributos"] | UnidadInput["amenidades"]) {
  if (value === null) {
    return Prisma.JsonNull;
  }

  return value;
}

function normalizarAmenidades(amenidades: UnidadInput["amenidades"]) {
  if (amenidades === null) {
    return Prisma.JsonNull;
  }

  return amenidades;
}
