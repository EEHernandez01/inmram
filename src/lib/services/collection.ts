import "server-only";

import { EstadoContrato, EstadoRecibo } from "@/generated/prisma/enums";
import { getOwnerScope, READ_ROLES, requireSystemRole, WRITE_ROLES } from "@/lib/auth/authorization";
import {
  calculateOverdueDays,
  calculateReceiptPaymentBalance,
  calculateReceiptDueDate,
  calculateReceiptStatus,
  calculateReceiptTotal,
  currentCollectionDate,
  currentReceiptPeriod,
  receiptPeriodEnd,
} from "@/lib/calculations/collection";
import { prisma } from "@/lib/db/prisma";
import { DomainError } from "@/lib/domain/errors";
import { registrarAuditoria } from "@/lib/services/audit";
import { recordIdSchema, toDatabaseDate } from "@/lib/validation/foundation";
import {
  paymentInputSchema,
  paymentReversalInputSchema,
  type PaymentInput,
  type PaymentReversalInput,
} from "@/lib/validation/collection";

type ReceiptWithPayments = {
  monto: { toString(): string };
  cargoFijo: { toString(): string };
  pagos: { monto: { toString(): string }; anuladoEn: Date | null }[];
};

function cents(value: { toString(): string } | number | string) {
  return Math.round(Number(value) * 100);
}

function receiptTotal(receipt: Pick<ReceiptWithPayments, "monto" | "cargoFijo">) {
  return calculateReceiptTotal({
    rent: Number(receipt.monto),
    servicesCharge: Number(receipt.cargoFijo),
  });
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
    ...balance,
  };
}

export async function sincronizarCobranzaActual(now = new Date()) {
  await requireSystemRole(WRITE_ROLES);
  return sincronizarCobranzaSistema(now);
}

export async function sincronizarCobranzaSistema(now = new Date()) {
  const period = currentReceiptPeriod(now);
  const currentDate = currentCollectionDate(now);
  const contracts = await prisma.contrato.findMany({
    where: {
      estado: EstadoContrato.ACTIVO,
      fechaInicio: { lte: receiptPeriodEnd(period) },
      fechaFin: { gte: period },
      unidad: { propiedad: { archivadaEn: null } },
    },
    select: {
      id: true,
      rentaMensualBase: true,
      cargoFijoMensual: true,
      diaPago: true,
    },
  });

  const receiptData = contracts.map((contract) => {
      const dueDate = calculateReceiptDueDate(period, contract.diaPago);
      return {
        contratoId: contract.id,
        periodo: period,
        fechaVencimiento: dueDate,
        monto: contract.rentaMensualBase,
        cargoFijo: contract.cargoFijoMensual,
        estatus: calculateReceiptStatus({
          currentDate,
          dueDate,
          paid: false,
        }),
      };
    });

  const created = receiptData.length
    ? await prisma.recibo.createMany({ data: receiptData, skipDuplicates: true })
    : { count: 0 };

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
    creados: created.count,
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
  const where = { periodo: period, estatus: status, contrato: contractFilter };
  const whereForSummary = { periodo: period, contrato: ownerId ? { unidad: { propietarioId: ownerId } } : undefined };
  const whereForCounts = { periodo: period, contrato: contractFilter };
  const [total, groupedCounts] = pagination ? await Promise.all([
    prisma.recibo.count({ where }),
    prisma.recibo.groupBy({ by: ["estatus"], where: whereForCounts, _count: { _all: true } }),
  ]) : [undefined, undefined];
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

  const allReceipts = status || pagination
    ? await prisma.recibo.findMany({
      where: whereForSummary,
      select: { estatus: true, monto: true, cargoFijo: true, pagos: { select: { monto: true, anuladoEn: true } } },
    })
    : receipts;
  const expected = allReceipts.reduce((sum, receipt) => sum + receiptTotal(receipt), 0);
  const collected = allReceipts.reduce(
    (sum, receipt) => sum + receiptPaymentSummary(receipt).montoPagado,
    0,
  );
  const overdue = allReceipts.filter(
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
      tasaMorosidad:
        allReceipts.length > 0 ? (overdue / allReceipts.length) * 100 : 0,
    },
    counts: pagination ? {
      todos: groupedCounts?.reduce((sum, group) => sum + group._count._all, 0) ?? 0,
      pendientes: groupedCounts?.find((group) => group.estatus === EstadoRecibo.PENDIENTE)?._count._all ?? 0,
      vencidos: groupedCounts?.find((group) => group.estatus === EstadoRecibo.VENCIDO)?._count._all ?? 0,
      pagados: groupedCounts?.find((group) => group.estatus === EstadoRecibo.PAGADO)?._count._all ?? 0,
    } : undefined,
    pagination: pagination ? { pagina, paginas, total: total ?? 0 } : undefined,
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
