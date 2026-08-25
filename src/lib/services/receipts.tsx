import "server-only";

import { renderToBuffer } from "@react-pdf/renderer";

import { getOwnerScope, READ_ROLES, requireSystemRole } from "@/lib/auth/authorization";
import { prisma } from "@/lib/db/prisma";
import { DomainError } from "@/lib/domain/errors";
import { formatCurrency, formatDate } from "@/lib/format";
import { PaymentReceiptDocument } from "@/lib/pdf/payment-receipt-document";
import { ReceiptDocument } from "@/lib/pdf/receipt-document";
import { recordIdSchema } from "@/lib/validation/foundation";

export async function generarReciboPdf(receiptId: string) {
  const { user, session } = await requireSystemRole(READ_ROLES);
  const ownerId = await getOwnerScope();
  const id = recordIdSchema.parse(receiptId);
  const receipt = await prisma.recibo.findFirst({ where: { id, contrato: ownerId ? { unidad: { propiedad: { propietarioId: ownerId } } } : undefined }, include: { contrato: { include: { unidad: { include: { propiedad: true } } } } } });
  if (!receipt) throw new DomainError("NOT_FOUND", "El recibo no existe.");
  const total = Number(receipt.monto) + Number(receipt.cargoAgua ?? 0);
  const issuer = user.perfil?.razonSocial || user.perfil?.nombreCompleto || session.user.name || "Administración de rentas";
  const data = { issuer, folio: receipt.id.slice(0, 8).toUpperCase(), period: receipt.periodo.toISOString().slice(0, 7), tenant: receipt.contrato.arrendatario, property: receipt.contrato.unidad.propiedad.direccion, unit: receipt.contrato.unidad.identificador, rent: formatCurrency(receipt.monto), water: formatCurrency(receipt.cargoAgua ?? 0), total: formatCurrency(total), status: receipt.estatus === "PAGADO" ? "Pagado" : receipt.estatus === "VENCIDO" ? "Vencido" : "Pendiente", dueDate: formatDate(receipt.fechaVencimiento), paymentDate: receipt.fechaPago ? formatDate(receipt.fechaPago) : undefined, paymentMethod: receipt.formaPago === "EFECTIVO" ? "Efectivo" : receipt.formaPago === "TRANSFERENCIA" ? "Transferencia" : undefined };
  return renderToBuffer(<ReceiptDocument data={data} />);
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

function formatMonthYear(value: Date) {
  return new Intl.DateTimeFormat("es-MX", { month: "long", year: "numeric", timeZone: "UTC" }).format(value);
}

function formatReceiptPlaceAndDate(value: Date) {
  const date = new Intl.DateTimeFormat("es-MX", { day: "2-digit", month: "long", year: "numeric", timeZone: "UTC" }).format(value);
  return `Ciudad de México, ${date}`;
}

export async function generarComprobantePagoPdf(receiptId: string) {
  const { user, session } = await requireSystemRole(READ_ROLES);
  const ownerId = await getOwnerScope();
  const id = recordIdSchema.parse(receiptId);
  const receipt = await prisma.recibo.findFirst({ where: { id, contrato: ownerId ? { unidad: { propiedad: { propietarioId: ownerId } } } : undefined }, include: { contrato: { include: { unidad: { include: { propiedad: true } } } } } });
  if (!receipt) throw new DomainError("NOT_FOUND", "El recibo no existe.");
  if (receipt.estatus !== "PAGADO" || !receipt.fechaPago) throw new DomainError("INVALID_STATE", "El comprobante solo se puede generar para un recibo pagado.");
  const total = Number(receipt.monto) + Number(receipt.cargoAgua ?? 0) + Number(receipt.cargoFijo);
  const issuer = user.perfil?.razonSocial || user.perfil?.nombreCompleto || session.user.name || "Administración de rentas";
  const property = receipt.contrato.unidad.propiedad.direccion.replace(/\s+/g, " ").trim();
  const data = { issuer, folio: receipt.id.slice(0, 8).toUpperCase(), tenant: receipt.contrato.arrendatario, total: formatCurrency(total), totalInWords: amountInWords(total), property, unit: receipt.contrato.unidad.identificador, period: formatMonthYear(receipt.periodo), paymentDate: formatReceiptPlaceAndDate(receipt.fechaPago) };
  return renderToBuffer(<PaymentReceiptDocument data={data} />);
}
