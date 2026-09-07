import "server-only";

import { renderToBuffer, type DocumentProps } from "@react-pdf/renderer";
import { createElement, type ReactElement } from "react";

import { EstadoContrato } from "@/generated/prisma/enums";
import { getOwnerScope, getSystemUser, READ_ROLES, requireSystemRole, WRITE_ROLES } from "@/lib/auth/authorization";
import { calculateInflationFromIndexLevels, calculateRenewedRent, contractExpirationAlertDays, expirationAlertLevel, isRenewalProposalWindow, renewalTermDates } from "@/lib/calculations/inflation";
import { currentCollectionDate } from "@/lib/calculations/collection";
import { prisma } from "@/lib/db/prisma";
import { DomainError } from "@/lib/domain/errors";
import { recordIdSchema } from "@/lib/validation/foundation";
import { registrarAuditoria } from "@/lib/services/audit";
import { formatCurrency, formatDate, formatPercent } from "@/lib/format";
import { RenewalProposalDocument } from "@/lib/pdf/renewal-proposal-document";
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
    where: { estado: EstadoContrato.ACTIVO, fechaFin: { gte: hoy, lte: limite }, unidad: { propiedad: { archivadaEn: null } } },
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
  return prisma.contrato.count({ where: { estado: EstadoContrato.ACTIVO, fechaFin: { gte: hoy, lte: limite }, unidad: { propiedad: { archivadaEn: null } } } });
}

type ProposalContract = {
  fechaFin: Date;
  rentaMensualBase: { toString(): string };
  diaPago: number;
};

function previousYearMonth(value: Date) {
  return new Date(Date.UTC(value.getUTCFullYear() - 1, value.getUTCMonth(), 1));
}

async function latestAnnualInpc() {
  const levels = await prisma.indiceInflacion.findMany({ where: { indice: "INPC" }, orderBy: { mes: "desc" }, take: 48 });
  const byMonth = new Map(levels.map((level) => [level.mes.getTime(), level]));
  for (const final of levels) {
    const base = byMonth.get(previousYearMonth(final.mes).getTime());
    if (base) return { base, final, inflation: calculateInflationFromIndexLevels(Number(base.valor), Number(final.valor)) };
  }
  return null;
}

function proposalCalculation(contract: ProposalContract, levels: Awaited<ReturnType<typeof latestAnnualInpc>>) {
  if (!levels) return null;
  const rent = calculateRenewedRent(Number(contract.rentaMensualBase), levels.inflation);
  const term = renewalTermDates(contract.fechaFin);
  return { ...levels, rent, ...term };
}

function amountInWords(value: number) {
  const units = ["cero", "uno", "dos", "tres", "cuatro", "cinco", "seis", "siete", "ocho", "nueve"];
  const teens = ["diez", "once", "doce", "trece", "catorce", "quince", "dieciseis", "diecisiete", "dieciocho", "diecinueve"];
  const tens = ["", "", "veinte", "treinta", "cuarenta", "cincuenta", "sesenta", "setenta", "ochenta", "noventa"];
  const hundreds = ["", "ciento", "doscientos", "trescientos", "cuatrocientos", "quinientos", "seiscientos", "setecientos", "ochocientos", "novecientos"];
  const belowThousand = (amount: number): string => {
    if (amount === 0) return "";
    if (amount === 100) return "cien";
    const hundred = Math.floor(amount / 100);
    const rest = amount % 100;
    if (rest < 10) return [hundreds[hundred], units[rest]].filter(Boolean).join(" ");
    if (rest < 20) return [hundreds[hundred], teens[rest - 10]].filter(Boolean).join(" ");
    if (rest < 30) return [hundreds[hundred], rest === 20 ? "veinte" : `veinti${units[rest - 20]}`].filter(Boolean).join(" ");
    return [hundreds[hundred], tens[Math.floor(rest / 10)], rest % 10 ? `y ${units[rest % 10]}` : ""].filter(Boolean).join(" ");
  };
  const pesos = Math.floor(value);
  const thousands = Math.floor(pesos / 1000);
  const remainder = pesos % 1000;
  const words = thousands ? `${thousands === 1 ? "mil" : `${belowThousand(thousands)} mil`}${remainder ? ` ${belowThousand(remainder)}` : ""}` : belowThousand(remainder) || "cero";
  return `${words.toUpperCase()} PESOS ${String(Math.round((value - pesos) * 100)).padStart(2, "0")}/100 M.N.`;
}

export async function prepararPropuestasRenovacionSistema(now = currentCollectionDate()) {
  const nextMonthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));
  const nextMonthEnd = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 2, 0));
  const [contracts, levels] = await Promise.all([
    prisma.contrato.findMany({ where: { estado: EstadoContrato.ACTIVO, renovacionNotificadaEn: null, fechaFin: { gte: nextMonthStart, lte: nextMonthEnd }, unidad: { propiedad: { archivadaEn: null } } }, select: { id: true, fechaFin: true, rentaMensualBase: true, diaPago: true } }),
    latestAnnualInpc(),
  ]);
  if (!levels) return { preparados: 0, pendientesInpc: contracts.length };
  const eligible = contracts.filter((contract) => isRenewalProposalWindow(contract.fechaFin, now) && proposalCalculation(contract, levels));
  if (eligible.length) await prisma.contrato.updateMany({ where: { id: { in: eligible.map((contract) => contract.id) }, renovacionNotificadaEn: null }, data: { renovacionNotificadaEn: now } });
  return { preparados: eligible.length, pendientesInpc: 0 };
}

export async function obtenerEstadoPropuestaRenovacion(contratoId: string) {
  await requireSystemRole(READ_ROLES);
  const id = recordIdSchema.parse(contratoId);
  const ownerId = await getOwnerScope();
  const contract = await prisma.contrato.findFirst({ where: { id, unidad: ownerId ? { propiedad: { propietarioId: ownerId } } : undefined }, select: { estado: true, fechaFin: true, renovacionNotificadaEn: true, rentaMensualBase: true, diaPago: true } });
  if (!contract || contract.estado !== EstadoContrato.ACTIVO || !isRenewalProposalWindow(contract.fechaFin, currentCollectionDate())) return { estado: "FUERA_DE_VENTANA" as const };
  const calculation = proposalCalculation(contract, await latestAnnualInpc());
  if (!calculation) return { estado: "PENDIENTE_INPC" as const };
  return { estado: contract.renovacionNotificadaEn ? "LISTA" as const : "PENDIENTE_PREPARACION" as const, preparadaEn: contract.renovacionNotificadaEn, ...calculation };
}

export async function generarPropuestaRenovacionPdf(contratoId: string) {
  await requireSystemRole(READ_ROLES);
  const id = recordIdSchema.parse(contratoId);
  const ownerId = await getOwnerScope();
  const contract = await prisma.contrato.findFirst({ where: { id, unidad: ownerId ? { propiedad: { propietarioId: ownerId } } : undefined }, include: { unidad: { include: { propiedad: true } } } });
  if (!contract) throw new DomainError("NOT_FOUND", "El contrato no existe.");
  const state = await obtenerEstadoPropuestaRenovacion(id);
  if (state.estado === "FUERA_DE_VENTANA") throw new DomainError("PROPOSAL_UNAVAILABLE", "La propuesta solo está disponible durante el mes previo al vencimiento.");
  if (state.estado === "PENDIENTE_INPC") throw new DomainError("MISSING_INDEX", "Faltan niveles INPC para preparar la propuesta.");
  if (state.estado === "PENDIENTE_PREPARACION") throw new DomainError("PROPOSAL_PENDING", "La propuesta aún no ha sido preparada por la tarea diaria.");
  const paymentNote = contract.diaPago !== state.start.getUTCDate() ? `Conservaremos el día ${contract.diaPago} como fecha habitual de pago.` : undefined;
  return renderToBuffer(createElement(RenewalProposalDocument, {
    data: {
      tenant: contract.arrendatario,
      property: contract.unidad.propiedad.direccion,
      unit: contract.unidad.identificador,
      preparedDate: formatDate(state.preparadaEn ?? new Date()),
      currentRent: formatCurrency(contract.rentaMensualBase),
      inflation: formatPercent(state.inflation * 100),
      proposedRent: formatCurrency(state.rent),
      proposedRentWords: amountInWords(state.rent),
      renewalStart: formatDate(state.start),
      renewalEnd: formatDate(state.end),
      paymentNote,
    },
  }) as unknown as ReactElement<DocumentProps>);
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
    prisma.contrato.findUnique({ where: { id }, include: { unidad: { include: { propiedad: { select: { archivadaEn: true } } } } } }),
    prisma.indiceInflacion.findMany({ where: { indice: data.indice, mes: { in: [baseDate, finalDate] } } }),
  ]);
  if (!contract) throw new DomainError("NOT_FOUND", "El contrato no existe.");
  if (contract.unidad.propiedad.archivadaEn) throw new DomainError("PROPERTY_ARCHIVED", "La propiedad está archivada y es de solo consulta.");
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
