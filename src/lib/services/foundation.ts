import "server-only";

import { Prisma } from "@/generated/prisma/client";
import { EstadoContrato } from "@/generated/prisma/enums";
import {
  READ_ROLES,
  getOwnerScope,
  requirePropertyAccess,
  requireSystemRole,
  WRITE_ROLES,
} from "@/lib/auth/authorization";
import { prisma } from "@/lib/db/prisma";
import { DomainError } from "@/lib/domain/errors";
import { isCancellationDateAllowed } from "@/lib/contracts";
import { registrarAuditoria } from "@/lib/services/audit";
import { eliminarFotosBlob } from "@/lib/property-photos";
import {
  calculateReceiptDueDate,
  calculateReceiptStatus,
  contractOverlapsPeriod,
  currentCollectionDate,
  currentReceiptPeriod,
} from "@/lib/calculations/collection";
import {
  cancelacionContratoInputSchema,
  contratoInputSchema,
  propiedadConPropietarioSeleccionadoSchema,
  propietarioInputSchema,
  recordIdSchema,
  toDatabaseDate,
  unidadInputSchema,
  type ContratoInput,
  type CancelacionContratoInput,
  type PropietarioInput,
  type PropietarioSeleccionado,
  type UnidadInput,
} from "@/lib/validation/foundation";

type ClientePropietarios = Pick<typeof prisma, "propietario" | "usuarioSistema">;

export type OpcionPropietario = {
  value: string;
  nombre: string;
  detalle: string;
};

export async function listarOpcionesPropietario(): Promise<OpcionPropietario[]> {
  await requireSystemRole(WRITE_ROLES);

  const [propietariosSinUsuario, usuarios] = await Promise.all([
    prisma.propietario.findMany({
      where: { usuarioSistemaId: null },
      select: { id: true, nombre: true },
    }),
    prisma.usuarioSistema.findMany({
      where: { puedeSerPropietario: true },
      select: {
        id: true,
        activo: true,
        perfil: { select: { nombreCompleto: true, razonSocial: true } },
        propietario: { select: { id: true, nombre: true } },
      },
    }),
  ]);

  return [
    ...propietariosSinUsuario.map((propietario) => ({
      value: `propietario:${propietario.id}`,
      nombre: propietario.nombre,
      detalle: "Registro de propietario sin usuario asociado",
    })),
    ...usuarios.map((usuario) => ({
      value: usuario.propietario
        ? `propietario:${usuario.propietario.id}`
        : `usuario:${usuario.id}`,
      nombre:
        usuario.perfil?.razonSocial ||
        usuario.perfil?.nombreCompleto ||
        usuario.propietario?.nombre ||
        `Usuario ${usuario.id.slice(0, 8)}`,
      detalle: usuario.activo ? "Usuario del sistema" : "Usuario sin acceso",
    })),
  ].sort((first, second) => first.nombre.localeCompare(second.nombre, "es-MX"));
}

export async function resolverPropietarioSeleccionado(
  seleccion: PropietarioSeleccionado,
  client: ClientePropietarios = prisma,
) {
  if (seleccion.tipo === "propietario") {
    const propietario = await client.propietario.findUnique({
      where: { id: seleccion.id },
      select: { id: true },
    });
    if (!propietario) {
      throw new DomainError("NOT_FOUND", "El propietario seleccionado no existe.");
    }
    return propietario.id;
  }

  const usuario = await client.usuarioSistema.findFirst({
    where: { id: seleccion.id, puedeSerPropietario: true },
    select: {
      id: true,
      perfil: { select: { nombreCompleto: true, razonSocial: true } },
      propietario: { select: { id: true, nombre: true } },
    },
  });
  if (!usuario) {
    throw new DomainError("NOT_FOUND", "El usuario seleccionado no existe.");
  }
  if (usuario.propietario) return usuario.propietario.id;

  const nombre =
    usuario.perfil?.razonSocial ||
    usuario.perfil?.nombreCompleto ||
    `Usuario ${usuario.id.slice(0, 8)}`;
  const propietario = await client.propietario.create({
    data: { usuarioSistemaId: usuario.id, nombre },
    select: { id: true },
  });
  return propietario.id;
}

export async function obtenerPropietario(propietarioId: string) {
  await requireSystemRole(WRITE_ROLES);
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
    select: { _count: { select: { propiedades: true, unidades: true } } },
  });

  if (!propietario) {
    throw new DomainError("NOT_FOUND", "El propietario no existe.");
  }

  if (propietario._count.propiedades > 0 || propietario._count.unidades > 0) {
    throw new DomainError(
      "OWNER_HAS_PROPERTIES",
      "No se puede eliminar un propietario que tiene propiedades o unidades.",
    );
  }

  return prisma.propietario.delete({ where: { id } });
}

export async function listarPropiedades({ archivadas = false }: { archivadas?: boolean } = {}) {
  await requireSystemRole(READ_ROLES);
  const ownerId = await getOwnerScope();

  return prisma.propiedad.findMany({
    where: {
      unidades: ownerId ? { some: { propietarioId: ownerId } } : undefined,
      archivadaEn: archivadas ? { not: null } : null,
    },
    orderBy: { direccion: "asc" },
    include: {
      propietario: true,
      marca: true,
      archivos: { where: { tipo: "FOTO_PROPIEDAD" }, orderBy: { orden: "asc" }, take: 1 },
      _count: { select: { unidades: ownerId ? { where: { propietarioId: ownerId } } : true } },
    },
  });
}

export async function obtenerPropiedad(propiedadId: string) {
  await requireSystemRole(READ_ROLES);
  const id = recordIdSchema.parse(propiedadId);
  await requirePropertyAccess(id);
  const ownerId = await getOwnerScope();

  return prisma.propiedad.findUnique({
    where: { id },
    include: {
      propietario: true,
      marca: true,
      archivos: { where: { tipo: "FOTO_PROPIEDAD" }, orderBy: { orden: "asc" } },
      unidades: { where: { propietarioId: ownerId ?? undefined }, orderBy: { identificador: "asc" }, include: { propietario: true } },
    },
  });
}

export async function crearPropiedad(input: unknown) {
  await requireSystemRole(WRITE_ROLES);
  const { propietarioId: seleccion, ...data } = propiedadConPropietarioSeleccionadoSchema.parse(input);

  return prisma.$transaction(async (transaction) => {
    const propietarioId = await resolverPropietarioSeleccionado(seleccion, transaction);
    return transaction.propiedad.create({ data: { ...data, propietarioId } });
  });
}

export async function actualizarPropiedad(
  propiedadId: string,
  input: unknown,
) {
  await requireSystemRole(WRITE_ROLES);
  const id = recordIdSchema.parse(propiedadId);
  const { propietarioId: seleccion, ...data } = propiedadConPropietarioSeleccionadoSchema.parse(input);

  await asegurarPropiedadActiva(id);

  return prisma.$transaction(async (transaction) => {
    const propietarioId = await resolverPropietarioSeleccionado(seleccion, transaction);
    return transaction.propiedad.update({ where: { id }, data: { ...data, propietarioId } });
  });
}

export async function archivarPropiedad(propiedadId: string) {
  const { user } = await requireSystemRole(WRITE_ROLES);
  const id = recordIdSchema.parse(propiedadId);
  const propiedad = await prisma.propiedad.findUnique({
    where: { id },
    select: { direccion: true, archivadaEn: true, _count: { select: { unidades: true } } },
  });

  if (!propiedad) {
    throw new DomainError("NOT_FOUND", "La propiedad no existe.");
  }

  if (propiedad.archivadaEn) {
    throw new DomainError("PROPERTY_ARCHIVED", "La propiedad ya está archivada.");
  }

  return prisma.$transaction(async (tx) => {
    const archived = await tx.propiedad.update({ where: { id }, data: { archivadaEn: new Date() } });
    await registrarAuditoria(tx, {
      usuarioSistemaId: user.id,
      accion: "ARCHIVAR",
      entidad: "Propiedad",
      entidadId: id,
      antes: { direccion: propiedad.direccion, unidades: propiedad._count.unidades },
      despues: { archivadaEn: archived.archivadaEn?.toISOString() ?? null },
    });
    return archived;
  });
}

export async function eliminarPropiedadArchivadaPermanentemente(propiedadId: string) {
  const { user } = await requireSystemRole(WRITE_ROLES);
  const id = recordIdSchema.parse(propiedadId);
  const property = await prisma.propiedad.findUnique({
    where: { id },
    select: {
      direccion: true,
      archivadaEn: true,
      archivos: { select: { url: true } },
      unidades: { select: { contratos: { select: { archivos: { select: { url: true } } } } } },
    },
  });

  if (!property) throw new DomainError("NOT_FOUND", "La propiedad no existe.");
  const archivedAt = property.archivadaEn;
  if (!archivedAt) throw new DomainError("PROPERTY_NOT_ARCHIVED", "Primero archiva la propiedad antes de eliminarla permanentemente.");

  const files = [
    ...property.archivos,
    ...property.unidades.flatMap((unit) => unit.contratos.flatMap((contract) => contract.archivos)),
  ];

  await prisma.$transaction(async (tx) => {
    const contractScope = { unidad: { propiedadId: id } };
    await tx.pagoRecibo.deleteMany({ where: { recibo: { contrato: contractScope } } });
    await tx.recibo.deleteMany({ where: { contrato: contractScope } });
    await tx.ajusteInflacion.deleteMany({ where: { contrato: contractScope } });
    await tx.lecturaAgua.deleteMany({ where: { medidorAgua: { unidad: { propiedadId: id } } } });
    await tx.medidorAgua.deleteMany({ where: { unidad: { propiedadId: id } } });
    await tx.contrato.deleteMany({ where: contractScope });
    await tx.unidad.deleteMany({ where: { propiedadId: id } });
    await tx.propiedad.delete({ where: { id } });
    await registrarAuditoria(tx, {
      usuarioSistemaId: user.id,
      accion: "ELIMINAR_PERMANENTE",
      entidad: "Propiedad",
      entidadId: id,
      antes: { direccion: property.direccion, archivadaEn: archivedAt.toISOString() },
      despues: { eliminadoPermanentemente: true },
    });
  });

  await eliminarFotosBlob(files);
}

export async function listarUnidades(propiedadId: string) {
  await requireSystemRole(READ_ROLES);
  const id = recordIdSchema.parse(propiedadId);
  await requirePropertyAccess(id);

  return prisma.unidad.findMany({
    where: { propiedadId: id, propietarioId: (await getOwnerScope()) ?? undefined },
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
  const ownerId = await getOwnerScope();

  return prisma.unidad.findFirst({
    where: { id, propietarioId: ownerId ?? undefined },
    include: {
      propiedad: { include: { propietario: true } },
      propietario: true,
      medidorAgua: true,
      contratos: {
        orderBy: { fechaInicio: "desc" },
        include: {
          recibos: {
            orderBy: { periodo: "desc" },
            include: { pagos: { where: { anuladoEn: null } } },
          },
        },
      },
    },
  });
}

export async function crearUnidad(input: unknown) {
  await requireSystemRole(WRITE_ROLES);
  const { propietarioId: seleccion, ...data } = unidadInputSchema.parse(input);
  await asegurarPropiedadActiva(data.propiedadId);

  return prisma.$transaction(async (transaction) => {
    const propietarioId = await resolverPropietarioSeleccionado(seleccion, transaction);
    return transaction.unidad.create({
      data: {
        ...data,
        propietarioId,
        atributos: normalizarAtributos(data.atributos),
        amenidades: normalizarAtributos(data.amenidades),
      },
    });
  });
}

export async function actualizarUnidad(unidadId: string, input: unknown) {
  await requireSystemRole(WRITE_ROLES);
  const id = recordIdSchema.parse(unidadId);
  const { propietarioId: seleccion, ...data } = unidadInputSchema.parse(input);
  await asegurarPropiedadActiva(data.propiedadId);

  return prisma.$transaction(async (transaction) => {
    const propietarioId = await resolverPropietarioSeleccionado(seleccion, transaction);
    return transaction.unidad.update({
      where: { id },
      data: {
        ...data,
        propietarioId,
        atributos: normalizarAtributos(data.atributos),
        amenidades: normalizarAtributos(data.amenidades),
      },
    });
  });
}

export async function eliminarUnidad(unidadId: string) {
  await requireSystemRole(WRITE_ROLES);
  const id = recordIdSchema.parse(unidadId);
  const unidad = await prisma.unidad.findUnique({
    where: { id },
    select: {
      medidorAgua: { select: { id: true } },
      propiedad: { select: { archivadaEn: true } },
      _count: { select: { contratos: true } },
    },
  });

  if (!unidad) {
    throw new DomainError("NOT_FOUND", "La unidad no existe.");
  }

  if (unidad.propiedad.archivadaEn) {
    throw new DomainError("PROPERTY_ARCHIVED", "La propiedad está archivada y es de solo consulta.");
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
  const ownerId = await getOwnerScope();

  return prisma.contrato.findMany({
    where: { unidadId: parsedUnidadId, unidad: ownerId ? { propietarioId: ownerId } : undefined },
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
  const ownerId = await getOwnerScope();

  return prisma.contrato.findFirst({
    where: { id, unidad: ownerId ? { propietarioId: ownerId } : undefined },
    include: {
      unidad: { include: { propiedad: { include: { propietario: true } } } },
      recibos: {
        orderBy: { periodo: "desc" },
        include: { pagos: { where: { anuladoEn: null } } },
      },
      ajustesInflacion: { orderBy: { fechaAplicacion: "desc" } },
    },
  });
}

export async function crearContrato(input: ContratoInput) {
  const { user } = await requireSystemRole(WRITE_ROLES);
  const data = contratoInputSchema.parse(input);
  if (data.estado === EstadoContrato.CANCELADO) {
    throw new DomainError("INVALID_CONTRACT_STATE", "Un contrato nuevo no puede crearse como cancelado.");
  }
  await asegurarUnidadEnPropiedadActiva(data.unidadId);

  if (data.estado === EstadoContrato.ACTIVO) {
    await asegurarUnidadSinContratoActivo(data.unidadId);
  }

  const startDate = toDatabaseDate(data.fechaInicio);
  const endDate = toDatabaseDate(data.fechaFin);
  const period = currentReceiptPeriod();
  const guarantee = normalizarGarantia(data);

  return prisma.$transaction(async (transaction) => {
    const contract = await transaction.contrato.create({
      data: {
        ...guarantee,
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
          cargoFijo: data.cargoFijoMensual,
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
  const before = await prisma.contrato.findUnique({ where: { id } });
  if (!before) throw new DomainError("NOT_FOUND", "El contrato no existe.");
  if (before.estado === EstadoContrato.CANCELADO) throw new DomainError("CONTRACT_CANCELLED", "Un contrato cancelado no se puede editar.");
  if (data.estado === EstadoContrato.CANCELADO) throw new DomainError("INVALID_CONTRACT_STATE", "Usa la acción de cancelación para registrar la fecha y el motivo.");
  await asegurarUnidadEnPropiedadActiva(data.unidadId);

  if (data.estado === EstadoContrato.ACTIVO) {
    await asegurarUnidadSinContratoActivo(data.unidadId, id);
  }

  const guarantee = normalizarGarantia(data);
  return prisma.$transaction(async (tx) => {
    const updated = await tx.contrato.update({ where: { id }, data: { ...guarantee, fechaInicio: toDatabaseDate(data.fechaInicio), fechaFin: toDatabaseDate(data.fechaFin) } });
    await registrarAuditoria(tx, { usuarioSistemaId: user.id, accion: "ACTUALIZAR", entidad: "Contrato", entidadId: id, antes: { estado: before.estado, fechaInicio: before.fechaInicio.toISOString(), fechaFin: before.fechaFin.toISOString(), rentaMensualBase: before.rentaMensualBase.toString(), diaPago: before.diaPago }, despues: { estado: updated.estado, fechaInicio: updated.fechaInicio.toISOString(), fechaFin: updated.fechaFin.toISOString(), rentaMensualBase: updated.rentaMensualBase.toString(), diaPago: updated.diaPago } });
    return updated;
  });
}

export async function vencerContrato(contratoId: string) {
  const { user } = await requireSystemRole(WRITE_ROLES);
  const id = recordIdSchema.parse(contratoId);
  const contract = await prisma.contrato.findUnique({ where: { id }, select: { unidadId: true, estado: true } });
  if (!contract) throw new DomainError("NOT_FOUND", "El contrato no existe.");
  if (contract.estado !== EstadoContrato.ACTIVO) throw new DomainError("CONTRACT_NOT_ACTIVE", "Solo se puede vencer un contrato activo.");
  await asegurarUnidadEnPropiedadActiva(contract.unidadId);

  return prisma.$transaction(async (tx) => {
    const updated = await tx.contrato.update({ where: { id }, data: { estado: EstadoContrato.VENCIDO } });
    await registrarAuditoria(tx, { usuarioSistemaId: user.id, accion: "VENCER", entidad: "Contrato", entidadId: id, antes: { estado: EstadoContrato.ACTIVO }, despues: { estado: EstadoContrato.VENCIDO } });
    return updated;
  });
}

export async function cancelarContrato(
  contratoId: string,
  input: CancelacionContratoInput,
  now = currentCollectionDate(),
) {
  const { user } = await requireSystemRole(WRITE_ROLES);
  const id = recordIdSchema.parse(contratoId);
  const data = cancelacionContratoInputSchema.parse(input);
  const fechaCancelacion = toDatabaseDate(data.fechaCancelacion);
  const contract = await prisma.contrato.findUnique({
    where: { id },
    select: { unidadId: true, estado: true, fechaInicio: true, fechaFin: true },
  });
  if (!contract) throw new DomainError("NOT_FOUND", "El contrato no existe.");
  if (contract.estado !== EstadoContrato.ACTIVO) throw new DomainError("CONTRACT_NOT_ACTIVE", "Solo se puede cancelar un contrato activo.");
  if (!isCancellationDateAllowed({ cancellationDate: fechaCancelacion, startDate: contract.fechaInicio, endDate: contract.fechaFin, today: now })) {
    throw new DomainError("INVALID_CANCELLATION_DATE", "La fecha de cancelación debe estar dentro de la vigencia y no puede ser futura.");
  }
  await asegurarUnidadEnPropiedadActiva(contract.unidadId);

  return prisma.$transaction(async (tx) => {
    const cancelled = await tx.contrato.update({
      where: { id },
      data: {
        estado: EstadoContrato.CANCELADO,
        canceladoEn: fechaCancelacion,
        motivoCancelacion: data.motivoCancelacion,
      },
    });
    await registrarAuditoria(tx, {
      usuarioSistemaId: user.id,
      accion: "CANCELAR",
      entidad: "Contrato",
      entidadId: id,
      antes: { estado: EstadoContrato.ACTIVO },
      despues: { estado: EstadoContrato.CANCELADO, canceladoEn: cancelled.canceladoEn?.toISOString() ?? null },
    });
    return cancelled;
  });
}

export async function asegurarPropiedadActiva(propiedadId: string) {
  const property = await prisma.propiedad.findUnique({
    where: { id: propiedadId },
    select: { archivadaEn: true },
  });
  if (!property) throw new DomainError("NOT_FOUND", "La propiedad no existe.");
  if (property.archivadaEn) throw new DomainError("PROPERTY_ARCHIVED", "La propiedad está archivada y es de solo consulta.");
}

export async function asegurarUnidadEnPropiedadActiva(unidadId: string) {
  const unit = await prisma.unidad.findUnique({
    where: { id: unidadId },
    select: { propiedad: { select: { archivadaEn: true } } },
  });
  if (!unit) throw new DomainError("NOT_FOUND", "La unidad no existe.");
  if (unit.propiedad.archivadaEn) throw new DomainError("PROPERTY_ARCHIVED", "La propiedad está archivada y es de solo consulta.");
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

function normalizarGarantia(data: ContratoInput) {
  const isPagare = data.tipoGarantia === "PAGARE";
  return {
    ...data,
    valorGarantia: data.tipoGarantia === "PRENDA" ? data.valorGarantia ?? null : null,
    avalTelefono: data.tipoGarantia === "AVAL" ? data.avalTelefono ?? null : null,
    avalCorreo: data.tipoGarantia === "AVAL" ? data.avalCorreo ?? null : null,
    pagareMonto: isPagare ? data.pagareMonto ?? null : null,
    pagareFechaEmision: isPagare && data.pagareFechaEmision ? toDatabaseDate(data.pagareFechaEmision) : null,
    pagareFechaVencimiento: isPagare && data.pagareFechaVencimiento ? toDatabaseDate(data.pagareFechaVencimiento) : null,
    pagareLugarPago: isPagare ? data.pagareLugarPago ?? null : null,
  };
}

