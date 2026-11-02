import "server-only";

import { Document, renderToBuffer } from "@react-pdf/renderer";

import { getOwnerScope, READ_ROLES, requireSystemRole } from "@/lib/auth/authorization";
import { calculateReceiptDueDate, calculateReceiptTotal, receiptPeriodFromValue } from "@/lib/calculations/collection";
import { prisma } from "@/lib/db/prisma";
import { DomainError } from "@/lib/domain/errors";
import { formatContractReceiptPeriodRange, formatCurrency } from "@/lib/format";
import { PaymentReceiptDocument } from "@/lib/pdf/payment-receipt-document";
import { ReceiptDocument, ReceiptPage } from "@/lib/pdf/receipt-document";
import { listarCobranzaMensual } from "@/lib/services/collection";
import { recordIdSchema } from "@/lib/validation/foundation";
import type { EstadoRecibo } from "@/generated/prisma/enums";

export async function generarReciboPdf(receiptId: string) {
  const { user, session } = await requireSystemRole(READ_ROLES);
  const ownerId = await getOwnerScope();
  const id = recordIdSchema.parse(receiptId);
  const receipt = await prisma.recibo.findFirst({ where: { id, contrato: ownerId ? { unidad: { propietarioId: ownerId } } : undefined }, include: { contrato: { include: { unidad: { include: { propiedad: true, propietario: true } } } } } });
  if (!receipt) throw new DomainError("NOT_FOUND", "El recibo no existe.");
  if (receipt.contrato.formaPago === "TRANSFERENCIA") throw new DomainError("PAYMENT_REQUEST_UNAVAILABLE", "Los contratos con pago por transferencia no tienen solicitud de pago en PDF.");
  const total = calculateReceiptTotal({ rent: Number(receipt.monto) });
  const issuer = user.perfil?.razonSocial || user.perfil?.nombreCompleto || session.user.name || "Administración de rentas";
  const data = {
    issuer,
    owner: receipt.contrato.unidad.propietario.nombre,
    tenant: receipt.contrato.arrendatario,
    total: formatCurrency(total),
    totalInWords: amountInWords(total),
    property: receipt.contrato.unidad.propiedad.direccion.replace(/\s+/g, " ").trim(),
    unit: receipt.contrato.unidad.identificador,
    rentalPeriod: formatContractReceiptPeriodRange(receipt.periodo, receipt.contrato.periodicidadCobro, receipt.contrato.fechaInicio, receipt.contrato.fechaFin),
    issuedAt: formatLetterDate(calculateReceiptDueDate(receipt.periodo, receipt.contrato.diaPago)),
  };
  return renderToBuffer(<ReceiptDocument data={data} />);
}

export async function generarRecibosCobranzaPdf({
  periodValue,
  status,
  search,
  ids,
}: {
  periodValue: string;
  status?: EstadoRecibo;
  search?: string;
  ids?: string[];
}) {
  const { user, session } = await requireSystemRole(READ_ROLES);
  const period = receiptPeriodFromValue(periodValue);
  const { receipts } = await listarCobranzaMensual({ period, status, search });
  const selectedIds = ids ? new Set(ids.map((id) => recordIdSchema.parse(id))) : null;
  const included = receipts.filter((receipt) =>
    receipt.contrato.formaPago === "EFECTIVO" && (!selectedIds || selectedIds.has(receipt.id))
  );
  if (included.length === 0) throw new DomainError("NOT_FOUND", "No hay recibos para imprimir con los criterios seleccionados.");
  const orderedReceipts = [...included].sort((a, b) => {
    const dueDateDifference = calculateReceiptDueDate(a.periodo, a.contrato.diaPago).getTime()
      - calculateReceiptDueDate(b.periodo, b.contrato.diaPago).getTime();
    if (dueDateDifference) return dueDateDifference;
    const propertyDifference = a.contrato.unidad.propiedad.direccion.localeCompare(b.contrato.unidad.propiedad.direccion, "es-MX", { sensitivity: "base", numeric: true });
    return propertyDifference || a.contrato.unidad.identificador.localeCompare(b.contrato.unidad.identificador, "es-MX", { sensitivity: "base", numeric: true });
  });

  const issuer = user.perfil?.razonSocial || user.perfil?.nombreCompleto || session.user.name || "Administración de rentas";
  const ownerIds = [...new Set(orderedReceipts.map((receipt) => receipt.contrato.unidad.propietarioId))];
  const owners = await prisma.propietario.findMany({ where: { id: { in: ownerIds } }, select: { id: true, nombre: true } });
  const ownerNames = new Map(owners.map((owner) => [owner.id, owner.nombre]));
  const pages = orderedReceipts.map((receipt) => {
    const total = calculateReceiptTotal({ rent: Number(receipt.monto) });
    return {
      issuer,
      owner: ownerNames.get(receipt.contrato.unidad.propietarioId) ?? "Propietario",
      tenant: receipt.contrato.arrendatario,
      total: formatCurrency(total),
      totalInWords: amountInWords(total),
      property: receipt.contrato.unidad.propiedad.direccion.replace(/\s+/g, " ").trim(),
      unit: receipt.contrato.unidad.identificador,
      rentalPeriod: formatContractReceiptPeriodRange(receipt.periodo, receipt.contrato.periodicidadCobro, receipt.contrato.fechaInicio, receipt.contrato.fechaFin),
      issuedAt: formatLetterDate(calculateReceiptDueDate(receipt.periodo, receipt.contrato.diaPago)),
    };
  });
  return renderToBuffer(<Document title="Recibos de cobranza" author={issuer}>{pages.map((data, index) => <ReceiptPage data={data} key={`${orderedReceipts[index].id}-${index}`} />)}</Document>);
}

function amountInWords(value: number) {
  const units = ["cero", "uno", "dos", "tres", "cuatro", "cinco", "seis", "siete", "ocho", "nueve"];
  const teens = ["diez", "once", "doce", "trece", "catorce", "quince", "dieciseis", "diecisiete", "dieciocho", "diecinueve"];
  const tens = ["", "", "veinte", "treinta", "cuarenta", "cincuenta", "sesenta", "setenta", "ochenta", "noventa"];
  const hundreds = ["", "ciento", "doscientos", "trescientos", "cuatrocientos", "quinientos", "seiscientos", "setecientos", "ochocientos", "novecientos"];
  const underThousand = (number: number): string => {
    if (number === 0) return "";
    if (number === 100) return "cien";
    const hundred = Math.floor(number / 100);
    const remainder = number % 100;
    const prefix = hundreds[hundred];
    if (remainder < 10) return [prefix, units[remainder]].filter(Boolean).join(" ");
    if (remainder < 20) return [prefix, teens[remainder - 10]].filter(Boolean).join(" ");
    if (remainder < 30) return [prefix, remainder === 20 ? "veinte" : `veinti${units[remainder - 20]}`].filter(Boolean).join(" ");
    return [prefix, tens[Math.floor(remainder / 10)], remainder % 10 ? `y ${units[remainder % 10]}` : ""].filter(Boolean).join(" ");
  };
  const pesos = Math.floor(value);
  const cents = Math.round((value - pesos) * 100);
  const thousands = Math.floor(pesos / 1000);
  const remainder = pesos % 1000;
  const pesoWords = thousands
    ? `${thousands === 1 ? "mil" : `${underThousand(thousands)} mil`}${remainder ? ` ${underThousand(remainder)}` : ""}`
    : underThousand(remainder) || "cero";
  return `${pesoWords.toUpperCase()} PESOS ${String(cents).padStart(2, "0")}/100 M.N.`;
}

function formatLetterDate(value: Date) {
  const day = String(value.getUTCDate()).padStart(2, "0");
  const monthName = new Intl.DateTimeFormat("es-MX", { month: "long", timeZone: "UTC" }).format(value);
  return `Ciudad de México ${day} de ${monthName} del ${value.getUTCFullYear()}`;
}

function formatReceiptPlaceAndDate(value: Date) {
  const date = new Intl.DateTimeFormat("es-MX", { day: "2-digit", month: "long", year: "numeric", timeZone: "UTC" }).format(value);
  return `Ciudad de México, ${date}`;
}

export async function generarComprobantePagoPdf(receiptId: string) {
  const { user, session } = await requireSystemRole(READ_ROLES);
  const ownerId = await getOwnerScope();
  const id = recordIdSchema.parse(receiptId);
  const receipt = await prisma.recibo.findFirst({ where: { id, contrato: ownerId ? { unidad: { propietarioId: ownerId } } : undefined }, include: { contrato: { include: { unidad: { include: { propiedad: true } } } } } });
  if (!receipt) throw new DomainError("NOT_FOUND", "El recibo no existe.");
  if (receipt.estatus !== "PAGADO" || !receipt.fechaPago) throw new DomainError("INVALID_STATE", "El comprobante solo se puede generar para un recibo pagado.");
  const total = calculateReceiptTotal({ rent: Number(receipt.monto) });
  const issuer = user.perfil?.razonSocial || user.perfil?.nombreCompleto || session.user.name || "Administración de rentas";
  const property = receipt.contrato.unidad.propiedad.direccion.replace(/\s+/g, " ").trim();
  const data = { issuer, folio: receipt.id.slice(0, 8).toUpperCase(), tenant: receipt.contrato.arrendatario, concept: "renta", total: formatCurrency(total), totalInWords: amountInWords(total), property, unit: receipt.contrato.unidad.identificador, period: formatContractReceiptPeriodRange(receipt.periodo, receipt.contrato.periodicidadCobro, receipt.contrato.fechaInicio, receipt.contrato.fechaFin), paymentDate: formatReceiptPlaceAndDate(receipt.fechaPago) };
  return renderToBuffer(<PaymentReceiptDocument data={data} />);
}
