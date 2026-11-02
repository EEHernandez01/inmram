import "server-only";

import type { Prisma } from "@/generated/prisma/client";
import { EstadoContrato, EstadoRecibo } from "@/generated/prisma/enums";
import { getOwnerScope, READ_ROLES, requireSystemRole, WRITE_ROLES } from "@/lib/auth/authorization";
import {
  calculateOverdueDays,
  calculateReceiptPaymentBalance,
  calculateReceiptCoverage,
  calculatePeriodicCharge,
  calculateContractReceiptDueDate,
  calculateContractFirstCollectionDate,
  collectionIntervalMonths,
  collectionPeriodIsEligible,
  calculateReceiptStatus,
  calculateReceiptTotal,
  currentCollectionDate,
  currentReceiptPeriod,
  MONTHLY_COLLECTION_FREQUENCIES,
  receiptPeriodIsCoveredBy,
  receiptPeriodsOverlap,
  receiptPeriodValue,
  resolveReceiptOverlapStatus,
  receiptPeriodEnd,
} from "@/lib/calculations/collection";
import { prisma } from "@/lib/db/prisma";
import { DomainError } from "@/lib/domain/errors";
import { registrarAuditoria } from "@/lib/services/audit";
import { recordIdSchema, toDatabaseDate } from "@/lib/validation/foundation";
import {
  paymentInputSchema,
  paymentReversalInputSchema,
  receiptReviewResolutionSchema,
  type PaymentInput,
  type PaymentReversalInput,
} from "@/lib/validation/collection";

type ReceiptWithPayments = {
  monto: { toString(): string };
  pagos: { monto: { toString(): string }; anuladoEn: Date | null }[];
};

function cents(value: { toString(): string } | number | string) {
  return Math.round(Number(value) * 100);
}

function receiptTotal(receipt: Pick<ReceiptWithPayments, "monto">) {
  return calculateReceiptTotal({ rent: Number(receipt.monto) });
}

function receiptPaymentSummary(receipt: ReceiptWithPayments) {
  const total = receiptTotal(receipt);
  const balance = calculateReceiptPaymentBalance({
    total,
    payments: receipt.pagos.map((payment) => ({
      amount: Number(payment.monto),
      reversed: Boolean(payment.anuladoEn),
    })),
  });

  return {
    total,
    montoPagado: Math.min(balance.montoPagado, total),
    saldoPendiente: balance.saldoPendiente,
  };
}

export async function sincronizarCobranzaActual(now = new Date()) {
  await requireSystemRole(WRITE_ROLES);
  return sincronizarCobranzaSistema(now);
}

const overlapReviewReason = "El periodo se traslapa con otro recibo del contrato.";
const coveredByPaidReason = "El periodo ya está cubierto por un recibo pagado.";

function isUnsettledReceipt(status: EstadoRecibo) {
  return status === EstadoRecibo.PENDIENTE || status === EstadoRecibo.VENCIDO || status === EstadoRecibo.REVISION;
}

export async function reconcileReceiptOverlaps(tx: Prisma.TransactionClient, contractId: string, usuarioSistemaId: string | null = null) {
  const receipts = await tx.recibo.findMany({
    where: { contratoId: contractId },
    orderBy: [{ periodoInicio: "asc" }, { periodo: "asc" }, { creadoEn: "asc" }, { id: "asc" }],
    select: { id: true, periodo: true, periodoInicio: true, periodoFin: true, estatus: true, creadoEn: true },
  });
  const paidReceipts = receipts.filter((receipt) => receipt.estatus === EstadoRecibo.PAGADO);

  for (const receipt of receipts) {
    if (!isUnsettledReceipt(receipt.estatus)) continue;
    const range = { periodStart: receipt.periodoInicio, periodEnd: receipt.periodoFin };
    const paidCover = paidReceipts.find((paid) => paid.id !== receipt.id && receiptPeriodIsCoveredBy(range, { periodStart: paid.periodoInicio, periodEnd: paid.periodoFin }));
    const overlappingPaid = paidReceipts.find((paid) => paid.id !== receipt.id && receiptPeriodsOverlap(range, { periodStart: paid.periodoInicio, periodEnd: paid.periodoFin }));
    const earlierUnsettled = receipts.find((other) => {
      if (other.id === receipt.id || !isUnsettledReceipt(other.estatus)) return false;
      const earlier = other.periodoInicio < receipt.periodoInicio
        || (other.periodoInicio.getTime() === receipt.periodoInicio.getTime() && other.periodo < receipt.periodo)
        || (other.periodoInicio.getTime() === receipt.periodoInicio.getTime() && other.periodo.getTime() === receipt.periodo.getTime() && other.creadoEn <= receipt.creadoEn);
      return earlier && receiptPeriodsOverlap(range, { periodStart: other.periodoInicio, periodEnd: other.periodoFin });
    });

    const overlapStatus = resolveReceiptOverlapStatus({
      fullyCoveredByPaidReceipt: Boolean(paidCover),
      overlapsPaidReceipt: Boolean(overlappingPaid),
      overlapsUnsettledReceipt: Boolean(earlierUnsettled),
    });
    const nextStatus = overlapStatus ? EstadoRecibo[overlapStatus] : receipt.estatus;
    if (nextStatus === receipt.estatus) continue;

    await tx.recibo.update({ where: { id: receipt.id }, data: { estatus: nextStatus } });
    await registrarAuditoria(tx, {
      usuarioSistemaId,
      accion: paidCover ? "OMITIR_RECIBO_CUBIERTO" : "ENVIAR_RECIBO_REVISION_TRASLAPE",
      entidad: "Recibo",
      entidadId: receipt.id,
      antes: { estatus: receipt.estatus, periodoInicio: receipt.periodoInicio.toISOString(), periodoFin: receipt.periodoFin.toISOString() },
      despues: {
        estatus: nextStatus,
        motivo: paidCover ? coveredByPaidReason : overlapReviewReason,
        reciboRelacionadoId: paidCover?.id ?? overlappingPaid?.id ?? earlierUnsettled?.id ?? null,
      },
    });
    receipt.estatus = nextStatus;
  }
}

export async function sincronizarCobranzaSistema(now = new Date()) {
  const period = currentReceiptPeriod(now);
  const currentDate = currentCollectionDate(now);
  const contracts = await prisma.contrato.findMany({
    where: {
      estado: EstadoContrato.ACTIVO,
      fechaInicio: { lte: receiptPeriodEnd(period) },
      fechaFin: { gte: period },
      periodicidadCobro: { in: [...MONTHLY_COLLECTION_FREQUENCIES] },
      unidad: { propiedad: { archivadaEn: null } },
    },
    select: {
      id: true,
      rentaMensualBase: true,
      diaPago: true,
      fechaInicio: true,
      fechaProximoCobro: true,
      fechaFin: true,
      periodicidadCobro: true,
    },
  });

  let createdCount = 0;
  for (const contract of contracts) {
    await prisma.$transaction(async (tx) => {
      await reconcileReceiptOverlaps(tx, contract.id);
      const firstCollectionDate = contract.fechaProximoCobro ?? calculateContractFirstCollectionDate(contract.fechaInicio, contract.diaPago);
      const intervalMonths = collectionIntervalMonths(contract.periodicidadCobro);
      if (!collectionPeriodIsEligible(period, firstCollectionDate, intervalMonths)) return;

      const dueDate = calculateContractReceiptDueDate(period, contract.diaPago, firstCollectionDate);
      if (receiptPeriodValue(dueDate) !== receiptPeriodValue(period)) return;
      const coverage = calculateReceiptCoverage(period, intervalMonths, contract.fechaFin, contract.fechaInicio);
      if (coverage.months === 0 || coverage.periodEnd < period) return;
      const existing = await tx.recibo.findUnique({ where: { contratoId_periodo: { contratoId: contract.id, periodo: period } }, select: { id: true } });
      if (existing) return;

      await tx.recibo.create({
        data: {
          contratoId: contract.id,
          periodo: period,
          periodoInicio: coverage.periodStart,
          periodoFin: coverage.periodEnd,
          fechaVencimiento: dueDate,
          monto: calculatePeriodicCharge(contract.rentaMensualBase.toString(), coverage.months),
          estatus: calculateReceiptStatus({ currentDate, dueDate, paid: false }),
        },
      });
      createdCount += 1;
      await reconcileReceiptOverlaps(tx, contract.id);
    });
  }

  const expired = await prisma.recibo.updateMany({
    where: {
      estatus: EstadoRecibo.PENDIENTE,
      fechaVencimiento: { lt: currentDate },
      contrato: { estado: EstadoContrato.ACTIVO, unidad: { propiedad: { archivadaEn: null } } },
    },
    data: { estatus: EstadoRecibo.VENCIDO },
  });

  await prisma.recibo.updateMany({
    where: {
      estatus: EstadoRecibo.VENCIDO,
      fechaVencimiento: { gte: currentDate },
      contrato: { estado: EstadoContrato.ACTIVO, unidad: { propiedad: { archivadaEn: null } } },
    },
    data: { estatus: EstadoRecibo.PENDIENTE },
  });

  return {
    periodo: period,
    creados: createdCount,
    actualizadosVencidos: expired.count,
  };
}

export async function listarCobranzaMensual({
  period,
  status,
  search,
  pagination,
  now = new Date(),
}: {
  period: Date;
  status?: EstadoRecibo;
  search?: string;
  pagination?: { pagina: number; limite: number };
  now?: Date;
}) {
  await requireSystemRole(READ_ROLES);
  const ownerId = await getOwnerScope();
  const contractFilter = {
    ...(ownerId ? { unidad: { propietarioId: ownerId } } : {}),
    ...(search ? { OR: [
      { arrendatario: { contains: search, mode: "insensitive" as const } },
      { unidad: { identificador: { contains: search, mode: "insensitive" as const } } },
      { unidad: { propiedad: { direccion: { contains: search, mode: "insensitive" as const } } } },
    ] } : {}),
  };
  const monthEnd = receiptPeriodEnd(period);
  const receiptDueThisMonth = { fechaVencimiento: { gte: period, lte: monthEnd } };
  const collectionContractFilter = { ...contractFilter, periodicidadCobro: { in: [...MONTHLY_COLLECTION_FREQUENCIES] } };
  const where = { ...receiptDueThisMonth, estatus: status, contrato: collectionContractFilter };
  const wherePrintable = { ...where, contrato: { ...collectionContractFilter, formaPago: "EFECTIVO" as const } };
  const whereForSummary = {
    fechaVencimiento: { gte: period, lte: monthEnd },
    contrato: {
      periodicidadCobro: { in: [...MONTHLY_COLLECTION_FREQUENCIES] },
      unidad: ownerId ? { propietarioId: ownerId } : undefined,
    },
  };
  const whereForCounts = { ...receiptDueThisMonth, contrato: collectionContractFilter };
  const [total, groupedCounts, printableTotal] = pagination ? await Promise.all([
    prisma.recibo.count({ where }),
    prisma.recibo.groupBy({ by: ["estatus"], where: whereForCounts, _count: { _all: true } }),
    prisma.recibo.count({ where: wherePrintable }),
  ]) : [undefined, undefined, undefined];
  const paginas = pagination ? Math.max(1, Math.ceil((total ?? 0) / pagination.limite)) : 1;
  const pagina = pagination ? Math.min(Math.max(1, pagination.pagina), paginas) : 1;
  const receipts = await prisma.recibo.findMany({
    where,
    orderBy: [
      { contrato: { unidad: { propiedad: { direccion: "asc" } } } },
      { contrato: { unidad: { identificador: "asc" } } },
      { id: "asc" },
    ],
    skip: pagination ? (pagina - 1) * pagination.limite : undefined,
    take: pagination?.limite,
    include: {
      contrato: {
        include: {
          unidad: { include: { propiedad: true } },
        },
      },
      pagos: {
        orderBy: [{ fechaPago: "desc" }, { creadoEn: "desc" }],
        include: {
          registradoPor: { include: { perfil: true } },
          anuladoPor: { include: { perfil: true } },
        },
      },
    },
  });

  const receiptsDueInMonth = await prisma.recibo.findMany({
    where: whereForSummary,
    select: { estatus: true, monto: true, pagos: { select: { monto: true, anuladoEn: true } } },
  });
  const confirmedReceipts = receiptsDueInMonth.filter((receipt) => receipt.estatus !== EstadoRecibo.REVISION && receipt.estatus !== EstadoRecibo.OMITIDO);
  const expected = confirmedReceipts.reduce((sum, receipt) => sum + receiptTotal(receipt), 0);
  const collected = confirmedReceipts.reduce(
    (sum, receipt) => sum + receiptPaymentSummary(receipt).montoPagado,
    0,
  );
  const overdue = confirmedReceipts.filter(
    (receipt) => receipt.estatus === EstadoRecibo.VENCIDO,
  ).length;
  const currentDate = currentCollectionDate(now);

  return {
    receipts: receipts.map((receipt) => {
      const paymentSummary = receiptPaymentSummary(receipt);
      return {
        ...receipt,
        ...paymentSummary,
        diasAtraso:
          receipt.estatus === EstadoRecibo.VENCIDO
            ? calculateOverdueDays(currentDate, receipt.fechaVencimiento)
            : 0,
      };
    }),
    summary: {
      esperado: expected,
      cobrado: collected,
      porcentajeCobrado: expected > 0 ? (collected / expected) * 100 : 0,
      recibosVencidos: overdue,
      recibosRevision: receiptsDueInMonth.filter((receipt) => receipt.estatus === EstadoRecibo.REVISION).length,
      tasaMorosidad:
        confirmedReceipts.length > 0 ? (overdue / confirmedReceipts.length) * 100 : 0,
    },
    counts: pagination ? {
      todos: groupedCounts?.reduce((sum, group) => sum + group._count._all, 0) ?? 0,
      pendientes: groupedCounts?.find((group) => group.estatus === EstadoRecibo.PENDIENTE)?._count._all ?? 0,
      vencidos: groupedCounts?.find((group) => group.estatus === EstadoRecibo.VENCIDO)?._count._all ?? 0,
      pagados: groupedCounts?.find((group) => group.estatus === EstadoRecibo.PAGADO)?._count._all ?? 0,
      revision: groupedCounts?.find((group) => group.estatus === EstadoRecibo.REVISION)?._count._all ?? 0,
      omitidos: groupedCounts?.find((group) => group.estatus === EstadoRecibo.OMITIDO)?._count._all ?? 0,
    } : undefined,
    pagination: pagination ? { pagina, paginas, total: total ?? 0, totalImprimible: printableTotal ?? 0 } : undefined,
  };
}

export async function registrarPagoRecibo(
  receiptId: string,
  input: PaymentInput,
  now = new Date(),
) {
  const { user } = await requireSystemRole(WRITE_ROLES);
  const id = recordIdSchema.parse(receiptId);
  const data = paymentInputSchema.parse(input);
  const paymentDate = toDatabaseDate(data.fechaPago);

  if (paymentDate.getTime() > currentCollectionDate(now).getTime()) {
    throw new DomainError(
      "FUTURE_PAYMENT_DATE",
      "La fecha de pago no puede estar en el futuro.",
    );
  }

  return prisma.$transaction(async (tx) => {
    const receipt = await tx.recibo.findUnique({
      where: { id },
      include: {
        pagos: { where: { anuladoEn: null } },
        contrato: { include: { unidad: { include: { propiedad: { select: { archivadaEn: true } } } } } },
      },
    });
    if (!receipt) throw new DomainError("NOT_FOUND", "El recibo no existe.");
    if (receipt.contrato.unidad.propiedad.archivadaEn) throw new DomainError("PROPERTY_ARCHIVED", "La propiedad está archivada y es de solo consulta.");
    if (data.formaPago !== receipt.contrato.formaPago) throw new DomainError("PAYMENT_METHOD_MISMATCH", "La forma de pago debe coincidir con la establecida en el contrato.");

    const summary = receiptPaymentSummary(receipt);
    const paymentCents = cents(data.monto);
    const pendingCents = cents(summary.saldoPendiente);
    if (pendingCents === 0) {
      throw new DomainError("RECEIPT_SETTLED", "El recibo ya está liquidado.");
    }
    if (paymentCents > pendingCents) {
      throw new DomainError("PAYMENT_EXCEEDS_BALANCE", "El pago no puede ser mayor al saldo pendiente.");
    }

    const settled = paymentCents === pendingCents;
    const payment = await tx.pagoRecibo.create({
      data: {
        reciboId: id,
        monto: data.monto,
        fechaPago: paymentDate,
        formaPago: data.formaPago,
        referencia: data.referencia || null,
        registradoPorId: user.id,
      },
    });
    const updated = await tx.recibo.update({
      where: { id },
      data: {
        estatus: settled
          ? EstadoRecibo.PAGADO
          : calculateReceiptStatus({
              currentDate: currentCollectionDate(now),
              dueDate: receipt.fechaVencimiento,
              paid: false,
            }),
        fechaPago: settled ? paymentDate : null,
        formaPago: settled ? data.formaPago : null,
      },
    });
    await registrarAuditoria(tx, {
      usuarioSistemaId: user.id,
      accion: "REGISTRAR_PAGO",
      entidad: "PagoRecibo",
      entidadId: payment.id,
      antes: { estatusRecibo: receipt.estatus, montoPagado: summary.montoPagado },
      despues: {
        reciboId: id,
        monto: Number(data.monto),
        referencia: data.referencia || null,
        saldoPendiente: (pendingCents - paymentCents) / 100,
        estatusRecibo: updated.estatus,
      },
    });
    return payment;
  });
}

export async function resolverRevisionRecibo(receiptId: string, input: unknown, now = new Date()) {
  const { user } = await requireSystemRole(WRITE_ROLES);
  const id = recordIdSchema.parse(receiptId);
  const data = receiptReviewResolutionSchema.parse(input);
  return prisma.$transaction(async (tx) => {
    const receipt = await tx.recibo.findUnique({
      where: { id },
      include: { contrato: { include: { unidad: { include: { propiedad: { select: { archivadaEn: true } } } } } } },
    });
    if (!receipt) throw new DomainError("NOT_FOUND", "El recibo no existe.");
    if (receipt.contrato.unidad.propiedad.archivadaEn) throw new DomainError("PROPERTY_ARCHIVED", "La propiedad está archivada y es de solo consulta.");
    if (receipt.estatus !== EstadoRecibo.REVISION) throw new DomainError("RECEIPT_NOT_IN_REVIEW", "El recibo ya no está pendiente de revisión.");
    const status = data.accion === "OMITIR" ? EstadoRecibo.OMITIDO : calculateReceiptStatus({ currentDate: currentCollectionDate(now), dueDate: receipt.fechaVencimiento, paid: false });
    const updated = await tx.recibo.update({ where: { id }, data: { estatus: status } });
    await registrarAuditoria(tx, { usuarioSistemaId: user.id, accion: data.accion === "OMITIR" ? "OMITIR_RECIBO_REVISION" : "CONFIRMAR_SALDO_REVISION", entidad: "Recibo", entidadId: id, antes: { estatus: receipt.estatus, fechaVencimiento: receipt.fechaVencimiento.toISOString() }, despues: { estatus: updated.estatus, motivo: data.accion === "OMITIR" ? data.motivo : null } });
    return updated;
  });
}

export async function revertirPagoRecibo(
  paymentId: string,
  input: PaymentReversalInput,
  now = new Date(),
) {
  const { user } = await requireSystemRole(WRITE_ROLES);
  const id = recordIdSchema.parse(paymentId);
  const data = paymentReversalInputSchema.parse(input);

  return prisma.$transaction(async (tx) => {
    const payment = await tx.pagoRecibo.findUnique({
      where: { id },
      include: {
        recibo: {
          include: {
            pagos: { where: { anuladoEn: null } },
            contrato: { include: { unidad: { include: { propiedad: { select: { archivadaEn: true } } } } } },
          },
        },
      },
    });
    if (!payment) throw new DomainError("NOT_FOUND", "El pago no existe.");
    if (payment.recibo.contrato.unidad.propiedad.archivadaEn) throw new DomainError("PROPERTY_ARCHIVED", "La propiedad está archivada y es de solo consulta.");
    if (payment.anuladoEn) throw new DomainError("PAYMENT_REVERSED", "El pago ya fue revertido.");

    const summary = receiptPaymentSummary(payment.recibo);
    const remainingAfterReversal = (cents(summary.saldoPendiente) + cents(payment.monto)) / 100;
    const reversed = await tx.pagoRecibo.update({
      where: { id },
      data: {
        anuladoEn: now,
        anuladoPorId: user.id,
        motivoAnulacion: data.motivo,
      },
    });
    const updated = await tx.recibo.update({
      where: { id: payment.reciboId },
      data: {
        estatus: calculateReceiptStatus({
          currentDate: currentCollectionDate(now),
          dueDate: payment.recibo.fechaVencimiento,
          paid: false,
        }),
        fechaPago: null,
        formaPago: null,
      },
    });
    await registrarAuditoria(tx, {
      usuarioSistemaId: user.id,
      accion: "REVERTIR_PAGO",
      entidad: "PagoRecibo",
      entidadId: reversed.id,
      antes: { reciboId: payment.reciboId, monto: Number(payment.monto), saldoPendiente: summary.saldoPendiente },
      despues: { motivo: data.motivo, saldoPendiente: remainingAfterReversal, estatusRecibo: updated.estatus },
    });
    return reversed;
  });
}
