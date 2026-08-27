import "server-only";

import { EstadoContrato } from "@/generated/prisma/enums";
import { getSystemUser, requireSystemRole, WRITE_ROLES } from "@/lib/auth/authorization";
import { calculateInflationFromIndexLevels, calculateRenewedRent, contractExpirationAlertDays, expirationAlertLevel } from "@/lib/calculations/inflation";
import { currentCollectionDate } from "@/lib/calculations/collection";
import { prisma } from "@/lib/db/prisma";
import { DomainError } from "@/lib/domain/errors";
import { recordIdSchema } from "@/lib/validation/foundation";
import { registrarAuditoria } from "@/lib/services/audit";
import { inflationDate, inflationIndexInputSchema, inflationMonthDate, inflationYearSchema, renewalInputSchema } from "@/lib/validation/inflation";

export async function guardarIndiceInflacion(input: unknown) {
  const { user } = await requireSystemRole(WRITE_ROLES);
  const data = inflationIndexInputSchema.parse(input);
  const fechaCorte = inflationDate(data.fechaCorte);
  if (fechaCorte > currentCollectionDate()) throw new DomainError("FUTURE_INDEX", "No se puede capturar un índice con fecha de corte futura.");
  return prisma.$transaction(async (tx) => {
    const result = await tx.indiceInflacion.upsert({ where: { indice_mes: { indice: data.indice, mes: inflationMonthDate(data.mes) } }, create: { indice: data.indice, mes: inflationMonthDate(data.mes), valor: data.valor, fechaCorte }, update: { valor: data.valor, fechaCorte } });
    await registrarAuditoria(tx, { usuarioSistemaId: user.id, accion: "GUARDAR", entidad: "IndiceInflacion", entidadId: result.id, despues: { indice: result.indice, mes: data.mes, valor: result.valor.toString(), fechaCorte: result.fechaCorte.toISOString() } });
    return result;
  });
}

export async function obtenerReporteInflacion(anioInput: unknown, indice = "INPC") {
  await requireSystemRole(WRITE_ROLES);
  const anio = inflationYearSchema.parse(anioInput);
  const inicio = new Date(Date.UTC(anio - 1, 11, 1));
  const fin = new Date(Date.UTC(anio + 1, 0, 1));
  const registros = await prisma.indiceInflacion.findMany({ where: { indice, mes: { gte: inicio, lt: fin } }, orderBy: { mes: "asc" } });
  const base = registros.find((item) => item.mes.getUTCFullYear() === anio - 1 && item.mes.getUTCMonth() === 11);
  const meses = registros.filter((item) => item.mes.getUTCFullYear() === anio);
  const ultimo = meses.at(-1);
  const acumulado = base && ultimo ? calculateInflationFromIndexLevels(Number(base.valor), Number(ultimo.valor)) : null;
  return { anio, indice, base, meses, acumulado, completo: Boolean(base && meses.length === 12) };
}

export async function listarIndicesInflacion(indice = "INPC") {
  await requireSystemRole(WRITE_ROLES);
  return prisma.indiceInflacion.findMany({ where: { indice }, orderBy: { mes: "desc" }, take: 36 });
}

export async function listarAlertasRenovacion() {
  const { user } = await getSystemUser();
  if (!WRITE_ROLES.includes(user.rol as (typeof WRITE_ROLES)[number])) return [];
  const hoy = currentCollectionDate();
  const limite = new Date(hoy); limite.setUTCDate(limite.getUTCDate() + 90);
  const contratos = await prisma.contrato.findMany({
    where: { estado: EstadoContrato.ACTIVO, fechaFin: { gte: hoy, lte: limite } },
    include: { unidad: { include: { propiedad: true } } }, orderBy: { fechaFin: "asc" },
  });
  return contratos.map((contrato) => {
    const dias = contractExpirationAlertDays(contrato.fechaFin, hoy);
    return { ...contrato, dias, nivel: expirationAlertLevel(dias) };
  });
}

export async function contarAlertasRenovacionSistema() {
  const hoy = currentCollectionDate();
  const limite = new Date(hoy); limite.setUTCDate(limite.getUTCDate() + 90);
  return prisma.contrato.count({ where: { estado: EstadoContrato.ACTIVO, fechaFin: { gte: hoy, lte: limite } } });
}

export async function renovarContrato(contratoId: string, input: unknown) {
  const { user } = await requireSystemRole(WRITE_ROLES);
  const id = recordIdSchema.parse(contratoId);
  const data = renewalInputSchema.parse(input);
  const baseDate = inflationMonthDate(data.mesBase);
  const finalDate = inflationMonthDate(data.mesFinal);
  const monthDifference = (finalDate.getUTCFullYear() - baseDate.getUTCFullYear()) * 12 + finalDate.getUTCMonth() - baseDate.getUTCMonth();
  if (monthDifference !== 12) throw new DomainError("INVALID_INFLATION_WINDOW", "La renovación debe comparar niveles separados por 12 meses.");

  const [contract, levels] = await Promise.all([
    prisma.contrato.findUnique({ where: { id } }),
    prisma.indiceInflacion.findMany({ where: { indice: data.indice, mes: { in: [baseDate, finalDate] } } }),
  ]);
  if (!contract) throw new DomainError("NOT_FOUND", "El contrato no existe.");
  if (contract.estado !== EstadoContrato.ACTIVO) throw new DomainError("CONTRACT_NOT_ACTIVE", "Solo se puede renovar un contrato activo.");
  if (currentCollectionDate() < contract.fechaFin) throw new DomainError("EARLY_RENEWAL", "La renovación puede aplicarse cuando llegue la fecha de finalización; antes puedes preparar los niveles INPC.");
  const expectedStart = new Date(contract.fechaFin); expectedStart.setUTCDate(expectedStart.getUTCDate() + 1);
  const startDate = inflationDate(data.fechaInicio);
  if (startDate.getTime() !== expectedStart.getTime()) throw new DomainError("INVALID_RENEWAL_START", "La renovación debe iniciar el día siguiente al vencimiento del contrato actual.");
  const expectedEnd = new Date(startDate); expectedEnd.setUTCMonth(expectedEnd.getUTCMonth() + data.plazoMeses); expectedEnd.setUTCDate(expectedEnd.getUTCDate() - 1);
  if (inflationDate(data.fechaFin).getTime() !== expectedEnd.getTime()) throw new DomainError("INVALID_RENEWAL_END", "La fecha final no coincide con el plazo de la renovación.");
  const base = levels.find((level) => level.mes.getTime() === baseDate.getTime());
  const final = levels.find((level) => level.mes.getTime() === finalDate.getTime());
  if (!base || !final) throw new DomainError("MISSING_INDEX", "Falta el nivel INPC base o final para calcular la renovación.");
  const inflation = calculateInflationFromIndexLevels(Number(base.valor), Number(final.valor));
  const rent = calculateRenewedRent(Number(contract.rentaMensualBase), inflation);

  return prisma.$transaction(async (tx) => {
    await tx.contrato.update({ where: { id }, data: { estado: EstadoContrato.VENCIDO } });
    const renewed = await tx.contrato.create({ data: {
      unidadId: contract.unidadId, arrendatario: contract.arrendatario, aval: contract.aval, tipoGarantia: contract.tipoGarantia,
      valorGarantia: contract.valorGarantia,
      emailArrendatario: contract.emailArrendatario, telefonoArrendatario: contract.telefonoArrendatario,
      avalTelefono: contract.avalTelefono, avalCorreo: contract.avalCorreo,
      fechaInicio: startDate, fechaFin: inflationDate(data.fechaFin), plazoMeses: data.plazoMeses,
      rentaMensualBase: rent.toFixed(2), diaPago: contract.diaPago,
      depositoGarantia: contract.depositoGarantia, cargoFijoMensual: contract.cargoFijoMensual,
      estado: EstadoContrato.ACTIVO,
    } });
    await tx.ajusteInflacion.create({ data: {
      contratoId: renewed.id, fechaAplicacion: startDate,
      indiceUsado: `${data.indice} ${data.mesBase}–${data.mesFinal}`,
      porcentajeAplicado: inflation.toFixed(6), rentaResultante: rent.toFixed(2),
    } });
    await registrarAuditoria(tx, { usuarioSistemaId: user.id, accion: "RENOVAR", entidad: "Contrato", entidadId: renewed.id, antes: { contratoAnteriorId: contract.id, rentaMensualBase: contract.rentaMensualBase.toString(), estado: contract.estado }, despues: { rentaMensualBase: renewed.rentaMensualBase.toString(), estado: renewed.estado, inflacionAplicada: inflation } });
    return { contrato: renewed, inflacion: inflation, renta: rent };
  });
}
