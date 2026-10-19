import "server-only";

import { renderToBuffer } from "@react-pdf/renderer";

import { getOwnerScope, REPORT_ROLES, requireSystemRole } from "@/lib/auth/authorization";
import { calculateReceiptPaymentBalance, currentReceiptPeriod, receiptPeriodEnd, receiptPeriodFromValue, receiptPeriodValue } from "@/lib/calculations/collection";
import { formatReceiptPeriodRange } from "@/lib/format";
import { MonthlyPaymentReportDocument } from "@/lib/pdf/monthly-payment-report-document";
import { prisma } from "@/lib/db/prisma";
import { monthlyPaymentReportSchema } from "@/lib/validation/payment-reports";

export async function obtenerReportePagosMensual(input: unknown = {}) {
  const filters = monthlyPaymentReportSchema.parse(input);
  const { user, session } = await requireSystemRole(REPORT_ROLES);
  const ownerId = await getOwnerScope();
  const period = filters.periodo ? receiptPeriodFromValue(filters.periodo) : currentReceiptPeriod();
  const monthValue = receiptPeriodValue(period);
  const monthEnd = receiptPeriodEnd(period);
  const propertyId = filters.propiedad || undefined;
  const unitId = filters.unidad || undefined;
  const tenantSearch = filters.cliente || undefined;
  const unitScope = {
    propietarioId: ownerId ?? undefined,
    id: unitId,
    propiedadId: propertyId,
    propiedad: { archivadaEn: null },
    contratos: tenantSearch ? { some: { arrendatario: { contains: tenantSearch, mode: "insensitive" as const } } } : undefined,
  };

  const [payments, properties, units] = await Promise.all([
    prisma.pagoRecibo.findMany({
      where: {
        fechaPago: { gte: period, lte: monthEnd },
        recibo: {
          contrato: {
            arrendatario: tenantSearch ? { contains: tenantSearch, mode: "insensitive" } : undefined,
            unidad: {
              propietarioId: ownerId ?? undefined,
              id: unitId,
              propiedadId: propertyId,
              propiedad: { archivadaEn: null },
            },
          },
        },
      },
      orderBy: [{ recibo: { contrato: { arrendatario: "asc" } } }, { fechaPago: "asc" }, { creadoEn: "asc" }],
      include: {
        recibo: {
          include: {
            contrato: {
              select: {
                arrendatario: true,
                unidad: { select: { id: true, identificador: true, propiedad: { select: { direccion: true } } } },
              },
            },
            pagos: { select: { monto: true, anuladoEn: true } },
          },
        },
      },
    }),
    prisma.propiedad.findMany({
      where: { archivadaEn: null, unidades: { some: { propietarioId: ownerId ?? undefined } } },
      orderBy: { direccion: "asc" },
      select: { id: true, direccion: true },
    }),
    prisma.unidad.findMany({
      where: unitScope,
      orderBy: [{ propiedad: { direccion: "asc" } }, { identificador: "asc" }],
      select: { id: true, identificador: true, propiedad: { select: { id: true, direccion: true } } },
    }),
  ]);

  const mappedPayments = payments.map((payment) => {
    const receipt = payment.recibo;
    const balance = calculateReceiptPaymentBalance({
      total: Number(receipt.monto),
      payments: receipt.pagos.map((item) => ({ amount: Number(item.monto), reversed: Boolean(item.anuladoEn) })),
    });
    return {
      id: payment.id,
      receiptId: payment.reciboId,
      tenant: receipt.contrato.arrendatario,
      property: receipt.contrato.unidad.propiedad.direccion,
      unit: receipt.contrato.unidad.identificador,
      unitId: receipt.contrato.unidad.id,
      period: receipt.periodo,
      periodEnd: receipt.periodoFin,
      paymentDate: payment.fechaPago,
      amount: Number(payment.monto),
      method: payment.formaPago,
      reference: payment.referencia,
      reversedAt: payment.anuladoEn,
      currentBalance: balance.saldoPendiente,
      received: !payment.anuladoEn,
    };
  });

  const seenReceipts = new Set<string>();
  const rows = mappedPayments.map((payment) => {
    const showBalance = !seenReceipts.has(payment.receiptId);
    seenReceipts.add(payment.receiptId);
    return { ...payment, showBalance };
  });
  const grouped = new Map<string, { tenant: string; payments: typeof rows; total: number }>();
  for (const row of rows) {
    const group = grouped.get(row.tenant) ?? { tenant: row.tenant, payments: [], total: 0 };
    group.payments.push(row);
    if (row.received) group.total = (Math.round(group.total * 100) + Math.round(row.amount * 100)) / 100;
    grouped.set(row.tenant, group);
  }

  return {
    period,
    periodValue: monthValue,
    filters: { cliente: filters.cliente ?? "", propiedad: propertyId ?? "", unidad: unitId ?? "" },
    properties,
    units,
    tenants: [...grouped.values()],
    totalReceived: rows.reduce((total, row) => total + (row.received ? Math.round(row.amount * 100) : 0), 0) / 100,
    totalReversed: rows.reduce((total, row) => total + (row.received ? 0 : Math.round(row.amount * 100)), 0) / 100,
    issuer: user.perfil?.razonSocial || user.perfil?.nombreCompleto || session.user.name || "Administración de rentas",
  };
}

export async function generarReportePagosMensualPdf(input: unknown = {}) {
  const report = await obtenerReportePagosMensual(input);
  const monthEnd = new Date(Date.UTC(report.period.getUTCFullYear(), report.period.getUTCMonth() + 1, 0));
  const month = formatReceiptPeriodRange(report.period, monthEnd);
  const pdf = await renderToBuffer(<MonthlyPaymentReportDocument data={{ ...report, month }} />);
  return { pdf, periodValue: report.periodValue };
}
