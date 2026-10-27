import "server-only";

import { renderToBuffer } from "@react-pdf/renderer";

import { getOwnerScope, READ_ROLES, requireSystemRole } from "@/lib/auth/authorization";
import { calculateReceiptPaymentBalance, receiptPeriodEnd, receiptPeriodFromValue } from "@/lib/calculations/collection";
import { formatReceiptPeriodRange } from "@/lib/format";
import { CollectionSummaryDocument } from "@/lib/pdf/collection-summary-document";
import { prisma } from "@/lib/db/prisma";

export async function generarResumenCobranzaMensualPdf(periodValue: string) {
  const { user, session } = await requireSystemRole(READ_ROLES);
  const ownerId = await getOwnerScope();
  const period = receiptPeriodFromValue(periodValue);
  const receipts = await prisma.recibo.findMany({
    where: {
      OR: [
        { periodo: { lte: period }, periodoFin: { gte: period } },
        { fechaVencimiento: { gte: period, lte: receiptPeriodEnd(period) } },
      ],
      contrato: ownerId ? { unidad: { propietarioId: ownerId } } : undefined,
    },
    orderBy: [
      { fechaVencimiento: "asc" },
      { contrato: { unidad: { propiedad: { direccion: "asc" } } } },
      { contrato: { unidad: { identificador: "asc" } } },
      { id: "asc" },
    ],
    include: {
      contrato: { include: { unidad: { include: { propiedad: true } } } },
      pagos: { where: { anuladoEn: null } },
    },
  });

  const rows = receipts.map((receipt) => {
    const balance = calculateReceiptPaymentBalance({
      total: Number(receipt.monto),
      payments: receipt.pagos.map((payment) => ({ amount: Number(payment.monto) })),
    });
    return {
      id: receipt.id,
      address: receipt.contrato.unidad.propiedad.direccion,
      unit: receipt.contrato.unidad.identificador,
      tenant: receipt.contrato.arrendatario,
      amountDue: balance.saldoPendiente,
      dueDate: receipt.fechaVencimiento,
      status: receipt.estatus,
    };
  });
  const confirmedRows = rows.filter((row) => row.status !== "REVISION" && row.status !== "OMITIDO");
  const totalDue = Math.round(confirmedRows.reduce((total, row) => total + Math.round(row.amountDue * 100), 0)) / 100;
  const issuer = user.perfil?.razonSocial || user.perfil?.nombreCompleto || session.user.name || "Administración de rentas";
  const end = receiptPeriodEnd(period);
  const month = formatReceiptPeriodRange(period, end);
  const pdf = await renderToBuffer(<CollectionSummaryDocument data={{ period: month, issuer, totalDue, rows }} />);
  return { pdf, periodValue };
}
