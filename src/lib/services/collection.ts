import "server-only";

import { EstadoContrato, EstadoRecibo } from "@/generated/prisma/enums";
import { READ_ROLES, requireSystemRole, WRITE_ROLES } from "@/lib/auth/authorization";
import {
  calculateOverdueDays,
  calculateReceiptDueDate,
  calculateReceiptStatus,
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
  type PaymentInput,
} from "@/lib/validation/collection";

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
    },
    data: { estatus: EstadoRecibo.VENCIDO },
  });

  await prisma.recibo.updateMany({
    where: {
      estatus: EstadoRecibo.VENCIDO,
      fechaVencimiento: { gte: currentDate },
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
  now = new Date(),
}: {
  period: Date;
  status?: EstadoRecibo;
  now?: Date;
}) {
  await requireSystemRole(READ_ROLES);
  const receipts = await prisma.recibo.findMany({
    where: { periodo: period, estatus: status },
    orderBy: [
      { contrato: { unidad: { propiedad: { direccion: "asc" } } } },
      { contrato: { unidad: { identificador: "asc" } } },
    ],
    include: {
      contrato: {
        include: {
          unidad: { include: { propiedad: true } },
        },
      },
    },
  });

  const allReceipts = status
    ? await prisma.recibo.findMany({ where: { periodo: period } })
    : receipts;
  const receiptTotal = (receipt: { monto: { toString(): string }; cargoAgua: { toString(): string } | null; cargoFijo: { toString(): string } }) => Number(receipt.monto) + Number(receipt.cargoAgua ?? 0) + Number(receipt.cargoFijo);
  const expected = allReceipts.reduce((sum, receipt) => sum + receiptTotal(receipt), 0);
  const collected = allReceipts
    .filter((receipt) => receipt.estatus === EstadoRecibo.PAGADO)
    .reduce((sum, receipt) => sum + receiptTotal(receipt), 0);
  const overdue = allReceipts.filter(
    (receipt) => receipt.estatus === EstadoRecibo.VENCIDO,
  ).length;
  const currentDate = currentCollectionDate(now);

  return {
    receipts: receipts.map((receipt) => ({
      ...receipt,
      total: receiptTotal(receipt),
      diasAtraso:
        receipt.estatus === EstadoRecibo.VENCIDO
          ? calculateOverdueDays(currentDate, receipt.fechaVencimiento)
          : 0,
    })),
    summary: {
      esperado: expected,
      cobrado: collected,
      porcentajeCobrado: expected > 0 ? (collected / expected) * 100 : 0,
      recibosVencidos: overdue,
      tasaMorosidad:
        allReceipts.length > 0 ? (overdue / allReceipts.length) * 100 : 0,
    },
  };
}

export async function marcarReciboPagado(
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

  const receipt = await prisma.recibo.findUnique({ where: { id } });
  if (!receipt) throw new DomainError("NOT_FOUND", "El recibo no existe.");

  return prisma.$transaction(async (tx) => {
    const updated = await tx.recibo.update({ where: { id }, data: {
      estatus: EstadoRecibo.PAGADO,
      fechaPago: paymentDate,
      formaPago: data.formaPago,
    } });
    await registrarAuditoria(tx, { usuarioSistemaId: user.id, accion: "REGISTRAR_PAGO", entidad: "Recibo", entidadId: id, antes: { estatus: receipt.estatus }, despues: { estatus: updated.estatus, fechaPago: updated.fechaPago?.toISOString(), formaPago: updated.formaPago } });
    return updated;
  });
}

export async function revertirPagoRecibo(receiptId: string, now = new Date()) {
  const { user } = await requireSystemRole(WRITE_ROLES);
  const id = recordIdSchema.parse(receiptId);
  const receipt = await prisma.recibo.findUnique({ where: { id } });
  if (!receipt) throw new DomainError("NOT_FOUND", "El recibo no existe.");

  return prisma.$transaction(async (tx) => {
    const updated = await tx.recibo.update({ where: { id }, data: {
      estatus: calculateReceiptStatus({
        currentDate: currentCollectionDate(now),
        dueDate: receipt.fechaVencimiento,
        paid: false,
      }),
      fechaPago: null,
      formaPago: null,
    } });
    await registrarAuditoria(tx, { usuarioSistemaId: user.id, accion: "REVERTIR_PAGO", entidad: "Recibo", entidadId: id, antes: { estatus: receipt.estatus, fechaPago: receipt.fechaPago?.toISOString(), formaPago: receipt.formaPago }, despues: { estatus: updated.estatus } });
    return updated;
  });
}
