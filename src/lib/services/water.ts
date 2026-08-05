import "server-only";

import { EstadoRecibo } from "@/generated/prisma/enums";
import { READ_ROLES, requireSystemRole, WRITE_ROLES } from "@/lib/auth/authorization";
import { currentReceiptPeriod } from "@/lib/calculations/collection";
import { calculateWaterCharge, calculateWaterConsumption } from "@/lib/calculations/water";
import { prisma } from "@/lib/db/prisma";
import { DomainError } from "@/lib/domain/errors";
import { registrarAuditoria } from "@/lib/services/audit";
import { waterMeterInputSchema, waterPeriodDate, waterReadingInputSchema } from "@/lib/validation/water";

export async function listarAgua() {
  await requireSystemRole(READ_ROLES);
  const [meters, availableUnits] = await Promise.all([
    prisma.medidorAgua.findMany({ orderBy: { unidad: { propiedad: { direccion: "asc" } } }, include: { unidad: { include: { propiedad: true } }, lecturas: { orderBy: { periodo: "desc" }, take: 13 } } }),
    prisma.unidad.findMany({ where: { medidorAgua: null }, orderBy: [{ propiedad: { direccion: "asc" } }, { identificador: "asc" }], include: { propiedad: true } }),
  ]);
  return { meters, availableUnits };
}

export async function crearMedidorAgua(input: unknown) {
  const { user } = await requireSystemRole(WRITE_ROLES);
  const data = waterMeterInputSchema.parse(input);
  return prisma.$transaction(async (tx) => {
    const meter = await tx.medidorAgua.create({ data });
    await registrarAuditoria(tx, { usuarioSistemaId: user.id, accion: "CREAR", entidad: "MedidorAgua", entidadId: meter.id, despues: { unidadId: meter.unidadId, cuotaFija: meter.cuotaFija.toString(), tarifaPorMetroCubico: meter.tarifaPorMetroCubico.toString() } });
    return meter;
  });
}

export async function registrarLecturaAgua(input: unknown, now = new Date()) {
  const { user } = await requireSystemRole(WRITE_ROLES);
  const data = waterReadingInputSchema.parse(input);
  const period = waterPeriodDate(data.periodo);
  if (period > currentReceiptPeriod(now)) throw new DomainError("FUTURE_WATER_READING", "No se pueden registrar lecturas de periodos futuros.");
  const meter = await prisma.medidorAgua.findUnique({ where: { id: data.medidorAguaId }, include: { lecturas: { orderBy: { periodo: "desc" }, take: 1 } } });
  if (!meter) throw new DomainError("NOT_FOUND", "El medidor no existe.");
  const latest = meter.lecturas[0];
  if (latest && period <= latest.periodo) throw new DomainError("READING_ORDER", "Las lecturas deben registrarse en orden mensual y sin duplicados.");
  if (!latest && !data.lecturaAnterior) throw new DomainError("FIRST_READING_REQUIRED", "Captura la lectura anterior para inicializar el medidor.");
  const previous = latest ? Number(latest.lecturaActual) : Number(data.lecturaAnterior);
  const current = Number(data.lecturaActual);
  const consumption = calculateWaterConsumption(previous, current);
  const charge = calculateWaterCharge(Number(meter.cuotaFija), Number(meter.tarifaPorMetroCubico), consumption);
  const receipt = await prisma.recibo.findFirst({ where: { periodo: period, contrato: { unidadId: meter.unidadId } } });
  if (!receipt) throw new DomainError("MISSING_RECEIPT", "Primero genera el recibo de cobranza para este periodo.");
  if (receipt.estatus === EstadoRecibo.PAGADO) throw new DomainError("PAID_RECEIPT", "No se puede agregar agua a un recibo que ya fue pagado.");
  return prisma.$transaction(async (tx) => {
    const readingRecord = await tx.lecturaAgua.create({ data: { medidorAguaId: meter.id, periodo: period, lecturaAnterior: previous.toFixed(3), lecturaActual: current.toFixed(3), metrosCubicosConsumidos: consumption.toFixed(3) } });
    await tx.recibo.update({ where: { id: receipt.id }, data: { cargoAgua: charge.toFixed(2) } });
    await registrarAuditoria(tx, { usuarioSistemaId: user.id, accion: "REGISTRAR_LECTURA", entidad: "LecturaAgua", entidadId: readingRecord.id, despues: { medidorAguaId: meter.id, periodo: data.periodo, lecturaAnterior: previous, lecturaActual: current, consumo: consumption, cargoAgua: charge, reciboId: receipt.id } });
    return { lectura: readingRecord, cargo: charge, reciboId: receipt.id };
  });
}
