import "server-only";

import { Prisma } from "@/generated/prisma/client";
import { EstadoContrato } from "@/generated/prisma/enums";
import {
  ADMIN_ROLES,
  READ_ROLES,
  getOwnerScope,
  requirePropertyAccess,
  requireSystemRole,
  WRITE_ROLES,
} from "@/lib/auth/authorization";
import { prisma } from "@/lib/db/prisma";
import { DomainError } from "@/lib/domain/errors";
import { isCancellationDateAllowed } from "@/lib/contracts";
import {
  criteriosCoincidenciaPropiedad,
  normalizarDireccion,
  type CriterioCoincidenciaPropiedad,
} from "@/lib/property-duplicates";
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
  propiedadConConfirmacionDuplicadoSchema,
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

type ClientePropietarios = Pick<typeof prisma, "propietario">;
type ClientePropiedades = Pick<Prisma.TransactionClient, "propiedad">;

export type OpcionPropietario = {
  value: string;
  nombre: string;
  detalle: string;
};

export type CoincidenciaPropiedad = {
  id: string;
  direccion: string;
  archivadaEn: string | null;
  unidades: number;
  criterios: CriterioCoincidenciaPropiedad[];
};

type BusquedaCoincidenciaPropiedad = {
  direccion: string;
  googlePlaceId?: string | null;
  excluirPropiedadId?: string;
};

function normalizarGooglePlaceId(value?: string | null) {
  const placeId = value?.trim() ?? "";
  return placeId || null;
}

async function buscarCoincidenciasPropiedadEnCliente(
  client: ClientePropiedades,
  { direccion, googlePlaceId, excluirPropiedadId }: BusquedaCoincidenciaPropiedad,
): Promise<CoincidenciaPropiedad[]> {
  const direccionNormalizada = normalizarDireccion(direccion);
  const placeId = normalizarGooglePlaceId(googlePlaceId);
  const where: Prisma.PropiedadWhereInput[] = [];

  if (direccionNormalizada) where.push({ direccionNormalizada });
  if (placeId) where.push({ googlePlaceId: placeId });
  if (where.length === 0) return [];

  const properties = await client.propiedad.findMany({
    where: {
      id: excluirPropiedadId ? { not: excluirPropiedadId } : undefined,
      OR: where,
    },
    orderBy: [{ archivadaEn: "asc" }, { creadoEn: "asc" }],
    select: {
      id: true,
      direccion: true,
      direccionNormalizada: true,
      googlePlaceId: true,
      archivadaEn: true,
      _count: { select: { unidades: true } },
    },
  });

  return properties.flatMap((property) => {
    const criterios = criteriosCoincidenciaPropiedad({
      direccionNormalizada,
      googlePlaceId: placeId,
      candidataDireccionNormalizada: property.direccionNormalizada,
      candidataGooglePlaceId: property.googlePlaceId,
    });
    if (criterios.length === 0) return [];

    return [{
      id: property.id,
      direccion: property.direccion,
      archivadaEn: property.archivadaEn?.toISOString() ?? null,
      unidades: property._count.unidades,
      criterios,
    }];
  });
}

export async function buscarCoincidenciasPropiedad(input: BusquedaCoincidenciaPropiedad) {
  await requireSystemRole(WRITE_ROLES);
  const excluirPropiedadId = input.excluirPropiedadId
    ? recordIdSchema.parse(input.excluirPropiedadId)
    : undefined;

  return buscarCoincidenciasPropiedadEnCliente(prisma, {
    direccion: input.direccion.slice(0, 500),
    googlePlaceId: input.googlePlaceId?.slice(0, 255),
    excluirPropiedadId,
  });
}

export async function listarOpcionesPropietario(): Promise<OpcionPropietario[]> {
  await requireSystemRole(WRITE_ROLES);

  const propietarios = await prisma.propietario.findMany({
    orderBy: { nombre: "asc" },
    select: { id: true, nombre: true, telefono: true, correo: true },
  });

  return propietarios.map((propietario) => ({
    value: propietario.id,
    nombre: propietario.nombre,
    detalle: propietario.correo || propietario.telefono || "Sin datos de contacto",
  }));
}

export async function resolverPropietarioSeleccionado(
  seleccion: PropietarioSeleccionado,
  client: ClientePropietarios = prisma,
) {
  const propietario = await client.propietario.findUnique({
    where: { id: seleccion },
    select: { id: true },
  });
  if (!propietario) {
    throw new DomainError("NOT_FOUND", "El propietario seleccionado no existe.");
  }
  return propietario.id;
}

export async function listarPropietarios() {
  await requireSystemRole(ADMIN_ROLES);

  return prisma.propietario.findMany({
    orderBy: { nombre: "asc" },
    include: { _count: { select: { propiedades: true, unidades: true, cuentas: true } } },
  });
}

export async function obtenerPropietario(propietarioId: string) {
  await requireSystemRole(ADMIN_ROLES);
  const id = recordIdSchema.parse(propietarioId);

  return prisma.propietario.findUnique({
    where: { id },
    include: { _count: { select: { propiedades: true, unidades: true, cuentas: true } } },
  });
}

export async function crearPropietario(input: PropietarioInput) {
  const { user } = await requireSystemRole(ADMIN_ROLES);
  const data = propietarioInputSchema.parse(input);

  return prisma.$transaction(async (tx) => {
    const propietario = await tx.propietario.create({ data });
    await registrarAuditoria(tx, { usuarioSistemaId: user.id, accion: "CREAR", entidad: "Propietario", entidadId: propietario.id, despues: { nombre: propietario.nombre, telefono: propietario.telefono, correo: propietario.correo } });
    return propietario;
  });
}

export async function actualizarPropietario(
  propietarioId: string,
  input: PropietarioInput,
) {
  const { user } = await requireSystemRole(ADMIN_ROLES);
  const id = recordIdSchema.parse(propietarioId);
  const data = propietarioInputSchema.parse(input);

  return prisma.$transaction(async (tx) => {
    const before = await tx.propietario.findUnique({ where: { id } });
    if (!before) throw new DomainError("NOT_FOUND", "El propietario no existe.");
    const propietario = await tx.propietario.update({ where: { id }, data });
    await registrarAuditoria(tx, { usuarioSistemaId: user.id, accion: "ACTUALIZAR", entidad: "Propietario", entidadId: id, antes: { nombre: before.nombre, telefono: before.telefono, correo: before.correo }, despues: { nombre: propietario.nombre, telefono: propietario.telefono, correo: propietario.correo } });
    return propietario;
  });
}

export async function eliminarPropietario(propietarioId: string) {
  const { user } = await requireSystemRole(ADMIN_ROLES);
  const id = recordIdSchema.parse(propietarioId);
  const propietario = await prisma.propietario.findUnique({
    where: { id },
    select: { nombre: true, telefono: true, correo: true, _count: { select: { propiedades: true, unidades: true, cuentas: true } } },
  });

  if (!propietario) {
    throw new DomainError("NOT_FOUND", "El propietario no existe.");
  }

  if (propietario._count.propiedades > 0 || propietario._count.unidades > 0 || propietario._count.cuentas > 0) {
    throw new DomainError(
      "OWNER_HAS_PROPERTIES",
      "No se puede eliminar un propietario que tiene propiedades, unidades o cuentas vinculadas.",
    );
  }

  return prisma.$transaction(async (tx) => {
    const deleted = await tx.propietario.delete({ where: { id } });
    await registrarAuditoria(tx, { usuarioSistemaId: user.id, accion: "ELIMINAR", entidad: "Propietario", entidadId: id, antes: { nombre: propietario.nombre, telefono: propietario.telefono, correo: propietario.correo }, despues: { eliminado: true } });
    return deleted;
  });
}

export type FiltroDisponibilidadPropiedad = "TODAS" | "CON_DISPONIBILIDAD" | "SIN_DISPONIBILIDAD";
export type OrdenPropiedades = "DIRECCION_ASC" | "DIRECCION_DESC" | "VALOR_DESC" | "VALOR_ASC" | "DISPONIBILIDAD_DESC";

export type OpcionesListadoPropiedades = {
  archivadas?: boolean;
  busqueda?: string;
  propietarioId?: string;
  disponibilidad?: FiltroDisponibilidadPropiedad;
  orden?: OrdenPropiedades;
};

export async function listarPropiedades({
  archivadas = false,
  busqueda,
  propietarioId,
  disponibilidad = "TODAS",
  orden = "DIRECCION_ASC",
}: OpcionesListadoPropiedades = {}) {
  await requireSystemRole(READ_ROLES);
  const ownerId = await getOwnerScope();
  const busquedaNormalizada = busqueda?.trim();
  const unidadesDelUsuario = ownerId ? { propietarioId: ownerId } : {};
  const unidadesDisponibles = {
    ...unidadesDelUsuario,
    contratos: { none: { estado: EstadoContrato.ACTIVO } },
  };
  const conditions: Prisma.PropiedadWhereInput[] = [
    { archivadaEn: archivadas ? { not: null } : null },
  ];

  if (ownerId) conditions.push({ unidades: { some: { propietarioId: ownerId } } });
  if (propietarioId && !ownerId) conditions.push({ propietarioId });
  if (busquedaNormalizada) {
    conditions.push({
      OR: [
        { direccion: { contains: busquedaNormalizada, mode: Prisma.QueryMode.insensitive } },
        { propietario: { nombre: { contains: busquedaNormalizada, mode: Prisma.QueryMode.insensitive } } },
        { marca: { nombreComercial: { contains: busquedaNormalizada, mode: Prisma.QueryMode.insensitive } } },
      ],
    });
  }
  if (disponibilidad === "CON_DISPONIBILIDAD") conditions.push({ unidades: { some: unidadesDisponibles } });
  if (disponibilidad === "SIN_DISPONIBILIDAD") conditions.push({ unidades: { none: unidadesDisponibles } });

  const orderBy = orden === "DIRECCION_DESC"
    ? { direccion: "desc" as const }
    : orden === "VALOR_DESC"
      ? { valorComercialTotal: "desc" as const }
      : orden === "VALOR_ASC"
        ? { valorComercialTotal: "asc" as const }
        : { direccion: "asc" as const };

  const propiedades = await prisma.propiedad.findMany({
    where: { AND: conditions },
    orderBy,
    include: {
      propietario: true,
      marca: true,
      archivos: { where: { tipo: "FOTO_PROPIEDAD" }, orderBy: { orden: "asc" }, take: 1 },
      unidades: { where: unidadesDisponibles, select: { id: true } },
      _count: { select: { unidades: ownerId ? { where: { propietarioId: ownerId } } : true } },
    },
  });

  if (orden !== "DISPONIBILIDAD_DESC") return propiedades;

  return propiedades.toSorted((a, b) => {
    const diferencia = b.unidades.length - a.unidades.length;
    return diferencia || a.direccion.localeCompare(b.direccion, "es");
  });
}

export async function listarPropietariosParaFiltroPropiedades({ archivadas = false }: { archivadas?: boolean } = {}) {
  await requireSystemRole(READ_ROLES);
  const ownerId = await getOwnerScope();

  if (ownerId) return [];

  return prisma.propietario.findMany({
    where: { propiedades: { some: { archivadaEn: archivadas ? { not: null } : null } } },
    orderBy: { nombre: "asc" },
    select: { id: true, nombre: true },
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

export async function crearPropiedad(
  input: unknown,
  despuesDeCrear?: (transaction: Prisma.TransactionClient, propiedad: { id: string }) => Promise<void>,
) {
  const { user } = await requireSystemRole(WRITE_ROLES);
  const { propietarioId: seleccion, confirmarDuplicado, ...data } = propiedadConConfirmacionDuplicadoSchema.parse(input);
  const direccionNormalizada = normalizarDireccion(data.direccion);

  return prisma.$transaction(async (transaction) => {
    const coincidencias = await buscarCoincidenciasPropiedadEnCliente(transaction, {
      direccion: data.direccion,
      googlePlaceId: data.googlePlaceId,
    });
    if (coincidencias.length > 0 && !confirmarDuplicado) {
      throw new DomainError(
        "PROPERTY_POSSIBLE_DUPLICATE",
        "Ya existe una propiedad con esta dirección o ubicación. Abre la ficha existente para agregar una unidad o confirma que es un inmueble distinto.",
      );
    }

    const propietarioId = await resolverPropietarioSeleccionado(seleccion, transaction);
    const propiedad = await transaction.propiedad.create({
      data: { ...data, propietarioId, direccionNormalizada },
    });
    await despuesDeCrear?.(transaction, propiedad);

    if (coincidencias.length > 0) {
      await registrarAuditoria(transaction, {
        usuarioSistemaId: user.id,
        accion: "CREAR_DUPLICADO_CONFIRMADO",
        entidad: "Propiedad",
        entidadId: propiedad.id,
        antes: { coincidencias },
        despues: { direccion: propiedad.direccion, direccionNormalizada },
      });
    }

    return propiedad;
  });
}

export async function actualizarPropiedad(
  propiedadId: string,
  input: unknown,
) {
  const { user } = await requireSystemRole(WRITE_ROLES);
  const id = recordIdSchema.parse(propiedadId);
  const { propietarioId: seleccion, confirmarDuplicado, ...data } = propiedadConConfirmacionDuplicadoSchema.parse(input);
  const direccionNormalizada = normalizarDireccion(data.direccion);

  await asegurarPropiedadActiva(id);

  return prisma.$transaction(async (transaction) => {
    const coincidencias = await buscarCoincidenciasPropiedadEnCliente(transaction, {
      direccion: data.direccion,
      googlePlaceId: data.googlePlaceId,
      excluirPropiedadId: id,
    });
    if (coincidencias.length > 0 && !confirmarDuplicado) {
      throw new DomainError(
        "PROPERTY_POSSIBLE_DUPLICATE",
        "Ya existe una propiedad con esta dirección o ubicación. Abre la ficha existente para agregar una unidad o confirma que es un inmueble distinto.",
      );
    }

    const propietarioId = await resolverPropietarioSeleccionado(seleccion, transaction);
    const propiedad = await transaction.propiedad.update({
      where: { id },
      data: { ...data, propietarioId, direccionNormalizada },
    });

    if (coincidencias.length > 0) {
      await registrarAuditoria(transaction, {
        usuarioSistemaId: user.id,
        accion: "ACTUALIZAR_DUPLICADO_CONFIRMADO",
        entidad: "Propiedad",
        entidadId: id,
        antes: { coincidencias },
        despues: { direccion: propiedad.direccion, direccionNormalizada },
      });
    }

    return propiedad;
  });
}

function resumenPropiedadParaUnificacion(propiedad: {
  id: string;
  direccion: string;
  direccionNormalizada: string;
  googlePlaceId: string | null;
  propietarioId: string;
  marcaId: string | null;
  creadoEn: Date;
  valorCatastral: { toString(): string };
  valorComercialTotal: { toString(): string };
  predialAnual: { toString(): string };
  mantenimientoAnual: { toString(): string };
}) {
  return {
    id: propiedad.id,
    direccion: propiedad.direccion,
    direccionNormalizada: propiedad.direccionNormalizada,
    googlePlaceId: propiedad.googlePlaceId,
    propietarioId: propiedad.propietarioId,
    marcaId: propiedad.marcaId,
    creadoEn: propiedad.creadoEn.toISOString(),
    valores: {
      valorCatastral: propiedad.valorCatastral.toString(),
      valorComercialTotal: propiedad.valorComercialTotal.toString(),
      predialAnual: propiedad.predialAnual.toString(),
      mantenimientoAnual: propiedad.mantenimientoAnual.toString(),
    },
  };
}

export async function unificarPropiedades(
  primeraPropiedadId: string,
  segundaPropiedadId: string,
) {
  const { user } = await requireSystemRole(WRITE_ROLES);
  const firstId = recordIdSchema.parse(primeraPropiedadId);
  const secondId = recordIdSchema.parse(segundaPropiedadId);
  if (firstId === secondId) {
    throw new DomainError("PROPERTY_MERGE_SAME", "Selecciona dos propiedades distintas para unificarlas.");
  }

  return prisma.$transaction(async (transaction) => {
    const properties = await transaction.propiedad.findMany({
      where: { id: { in: [firstId, secondId] } },
      select: {
        id: true,
        direccion: true,
        direccionNormalizada: true,
        googlePlaceId: true,
        propietarioId: true,
        marcaId: true,
        valorCatastral: true,
        valorComercialTotal: true,
        predialAnual: true,
        mantenimientoAnual: true,
        archivadaEn: true,
        creadoEn: true,
        archivos: { select: { id: true, orden: true }, orderBy: { orden: "asc" } },
        unidades: { select: { id: true, identificador: true } },
      },
    });

    if (properties.length !== 2) {
      throw new DomainError("NOT_FOUND", "Una de las propiedades seleccionadas ya no existe.");
    }
    if (properties.some((property) => property.archivadaEn)) {
      throw new DomainError("PROPERTY_ARCHIVED", "No se pueden unificar propiedades archivadas.");
    }

    const [principal, duplicada] = properties.toSorted((a, b) => {
      const difference = a.creadoEn.getTime() - b.creadoEn.getTime();
      return difference || a.id.localeCompare(b.id);
    });
    const criterios = criteriosCoincidenciaPropiedad({
      direccionNormalizada: principal.direccionNormalizada,
      googlePlaceId: principal.googlePlaceId,
      candidataDireccionNormalizada: duplicada.direccionNormalizada,
      candidataGooglePlaceId: duplicada.googlePlaceId,
    });
    if (criterios.length === 0) {
      throw new DomainError("PROPERTY_NOT_DUPLICATE", "Las propiedades no coinciden por dirección ni por ubicación de Google Maps.");
    }

    const identifiers = new Set(principal.unidades.map((unit) => unit.identificador.trim().toLocaleLowerCase("es-MX")));
    const repeatedIdentifiers = duplicada.unidades
      .map((unit) => unit.identificador)
      .filter((identifier) => identifiers.has(identifier.trim().toLocaleLowerCase("es-MX")));
    if (repeatedIdentifiers.length > 0) {
      throw new DomainError(
        "PROPERTY_MERGE_UNIT_IDENTIFIER_CONFLICT",
        `No se pueden unificar porque ambas propiedades tienen la unidad ${repeatedIdentifiers.join(", ")}. Renombra una unidad antes de continuar.`,
      );
    }

    const maxPhotoOrder = principal.archivos.reduce((maximum, file) => Math.max(maximum, file.orden), -1);
    await Promise.all(duplicada.archivos.map((file, index) => transaction.archivoExpediente.update({
      where: { id: file.id },
      data: { propiedadId: principal.id, orden: maxPhotoOrder + index + 1 },
    })));
    await transaction.unidad.updateMany({
      where: { id: { in: duplicada.unidades.map((unit) => unit.id) } },
      data: { propiedadId: principal.id },
    });
    await transaction.propiedad.delete({ where: { id: duplicada.id } });
    await registrarAuditoria(transaction, {
      usuarioSistemaId: user.id,
      accion: "UNIFICAR",
      entidad: "Propiedad",
      entidadId: principal.id,
      antes: {
        principal: resumenPropiedadParaUnificacion(principal),
        duplicada: resumenPropiedadParaUnificacion(duplicada),
        unidadesMovidas: duplicada.unidades.map((unit) => ({ id: unit.id, identificador: unit.identificador })),
        archivosMovidos: duplicada.archivos.map((file) => file.id),
      },
      despues: {
        propiedadConservadaId: principal.id,
        propiedadEliminadaId: duplicada.id,
        criterios,
      },
    });

    return { propiedadId: principal.id, propiedadEliminadaId: duplicada.id };
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

