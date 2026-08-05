import "server-only";

import { renderToBuffer } from "@react-pdf/renderer";

import { READ_ROLES, requireSystemRole } from "@/lib/auth/authorization";
import { prisma } from "@/lib/db/prisma";
import { DomainError } from "@/lib/domain/errors";
import { formatCurrency, formatDate } from "@/lib/format";
import { ReceiptDocument } from "@/lib/pdf/receipt-document";
import { recordIdSchema } from "@/lib/validation/foundation";

export async function generarReciboPdf(receiptId: string) {
  const { user, session } = await requireSystemRole(READ_ROLES);
  const id = recordIdSchema.parse(receiptId);
  const receipt = await prisma.recibo.findUnique({ where: { id }, include: { contrato: { include: { unidad: { include: { propiedad: true } } } } } });
  if (!receipt) throw new DomainError("NOT_FOUND", "El recibo no existe.");
  const total = Number(receipt.monto) + Number(receipt.cargoAgua ?? 0);
  const issuer = user.perfil?.razonSocial || user.perfil?.nombreCompleto || session.user.name || "Administración de rentas";
  const data = { issuer, folio: receipt.id.slice(0, 8).toUpperCase(), period: receipt.periodo.toISOString().slice(0, 7), tenant: receipt.contrato.arrendatario, property: receipt.contrato.unidad.propiedad.direccion, unit: receipt.contrato.unidad.identificador, rent: formatCurrency(receipt.monto), water: formatCurrency(receipt.cargoAgua ?? 0), total: formatCurrency(total), status: receipt.estatus === "PAGADO" ? "Pagado" : receipt.estatus === "VENCIDO" ? "Vencido" : "Pendiente", dueDate: formatDate(receipt.fechaVencimiento), paymentDate: receipt.fechaPago ? formatDate(receipt.fechaPago) : undefined, paymentMethod: receipt.formaPago === "EFECTIVO" ? "Efectivo" : receipt.formaPago === "TRANSFERENCIA" ? "Transferencia" : undefined };
  return renderToBuffer(<ReceiptDocument data={data} />);
}
