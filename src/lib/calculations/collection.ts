export const COLLECTION_TIME_ZONE = "America/Mexico_City";

const DAY_MS = 86_400_000;

type DateParts = { year: number; month: number; day: number };

function mexicoCityParts(date: Date): DateParts {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: COLLECTION_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  const captured = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return {
    year: Number(captured.year),
    month: Number(captured.month),
    day: Number(captured.day),
  };
}

function utcDate({ year, month, day }: DateParts) {
  return new Date(Date.UTC(year, month - 1, day));
}

export function currentCollectionDate(now = new Date()) {
  return utcDate(mexicoCityParts(now));
}

export function currentReceiptPeriod(now = new Date()) {
  const { year, month } = mexicoCityParts(now);
  return new Date(Date.UTC(year, month - 1, 1));
}

export function receiptPeriodFromValue(value: string) {
  const match = /^(\d{4})-(0[1-9]|1[0-2])$/.exec(value);
  if (!match) throw new Error("Periodo mensual inválido.");
  return new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, 1));
}

export function receiptPeriodValue(period: Date) {
  return `${period.getUTCFullYear()}-${String(period.getUTCMonth() + 1).padStart(2, "0")}`;
}

export function receiptPeriodEnd(period: Date) {
  return new Date(Date.UTC(period.getUTCFullYear(), period.getUTCMonth() + 1, 0));
}

export function calculateReceiptDueDate(period: Date, paymentDay: number) {
  if (!Number.isInteger(paymentDay) || paymentDay < 1 || paymentDay > 31) {
    throw new Error("El día de pago debe estar entre 1 y 31.");
  }

  const year = period.getUTCFullYear();
  const month = period.getUTCMonth();
  const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();

  return paymentDay <= daysInMonth
    ? new Date(Date.UTC(year, month, paymentDay))
    : new Date(Date.UTC(year, month + 1, 1));
}

export function calculateReceiptStatus({
  currentDate,
  dueDate,
  paid,
}: {
  currentDate: Date;
  dueDate: Date;
  paid: boolean;
}) {
  if (paid) return "PAGADO" as const;
  return currentDate.getTime() > dueDate.getTime()
    ? ("VENCIDO" as const)
    : ("PENDIENTE" as const);
}

export function calculateReceiptTotal({
  rent,
  servicesCharge = 0,
}: {
  rent: number;
  servicesCharge?: number;
}) {
  return Math.round((rent + servicesCharge + Number.EPSILON) * 100) / 100;
}

export function calculateReceiptPaymentBalance({
  total,
  payments,
}: {
  total: number;
  payments: readonly { amount: number; reversed?: boolean }[];
}) {
  const totalCents = Math.round(total * 100);
  const paidCents = payments
    .filter((payment) => !payment.reversed)
    .reduce((sum, payment) => sum + Math.round(payment.amount * 100), 0);

  return {
    montoPagado: paidCents / 100,
    saldoPendiente: Math.max(0, totalCents - paidCents) / 100,
  };
}

export function calculateOverdueDays(currentDate: Date, dueDate: Date) {
  return Math.max(0, Math.floor((currentDate.getTime() - dueDate.getTime()) / DAY_MS));
}

export function contractOverlapsPeriod({
  startDate,
  endDate,
  period,
}: {
  startDate: Date;
  endDate: Date;
  period: Date;
}) {
  return startDate.getTime() <= receiptPeriodEnd(period).getTime()
    && endDate.getTime() >= period.getTime();
}
