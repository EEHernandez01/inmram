export const COLLECTION_TIME_ZONE = "America/Mexico_City";

export type CollectionFrequency = "MENSUAL" | "BIMESTRAL" | "SEMESTRAL" | "ANUAL";

const COLLECTION_INTERVALS: Record<CollectionFrequency, number> = {
  MENSUAL: 1,
  BIMESTRAL: 2,
  SEMESTRAL: 6,
  ANUAL: 12,
};

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

export function collectionIntervalMonths(frequency: CollectionFrequency) {
  return COLLECTION_INTERVALS[frequency];
}

export function collectionPeriodIsEligible(period: Date, firstCollectionDate: Date | null, intervalMonths = 1) {
  if (!Number.isInteger(intervalMonths) || intervalMonths < 1) throw new Error("La periodicidad de cobro no es válida.");
  if (!firstCollectionDate) return true;
  if (firstCollectionDate.getTime() > receiptPeriodEnd(period).getTime()) return false;
  const monthOffset = (period.getUTCFullYear() - firstCollectionDate.getUTCFullYear()) * 12
    + period.getUTCMonth() - firstCollectionDate.getUTCMonth();
  return monthOffset >= 0 && monthOffset % intervalMonths === 0;
}

export function calculateReceiptCoverage(period: Date, intervalMonths: number, contractEndDate?: Date | null) {
  if (!Number.isInteger(intervalMonths) || intervalMonths < 1) throw new Error("La periodicidad de cobro no es válida.");
  const startMonth = period.getUTCFullYear() * 12 + period.getUTCMonth();
  const contractEndMonth = contractEndDate
    ? contractEndDate.getUTCFullYear() * 12 + contractEndDate.getUTCMonth()
    : startMonth + intervalMonths - 1;
  const months = Math.max(1, Math.min(intervalMonths, contractEndMonth - startMonth + 1));
  return {
    months,
    periodEnd: new Date(Date.UTC(period.getUTCFullYear(), period.getUTCMonth() + months, 0)),
  };
}

export function calculatePeriodicCharge(monthlyAmount: number | string, months: number) {
  if (!Number.isInteger(months) || months < 1) throw new Error("El periodo del recibo no es válido.");
  const cents = Math.round(Number(monthlyAmount) * 100) * months;
  if (!Number.isSafeInteger(cents) || cents > 99_999_999_999_999) throw new RangeError("El importe del recibo excede el máximo permitido.");
  return (cents / 100).toFixed(2);
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

export function calculateContractReceiptDueDate(period: Date, paymentDay: number, firstCollectionDate: Date | null) {
  if (firstCollectionDate && firstCollectionDate.getUTCFullYear() === period.getUTCFullYear() && firstCollectionDate.getUTCMonth() === period.getUTCMonth()) return firstCollectionDate;
  return calculateReceiptDueDate(period, paymentDay);
}

export function calculateContractFirstCollectionDate(startDate: Date, paymentDay: number) {
  const startPeriod = new Date(Date.UTC(startDate.getUTCFullYear(), startDate.getUTCMonth(), 1));
  const firstDueDate = calculateReceiptDueDate(startPeriod, paymentDay);
  if (firstDueDate.getTime() >= startDate.getTime()) return firstDueDate;
  return calculateReceiptDueDate(new Date(Date.UTC(startPeriod.getUTCFullYear(), startPeriod.getUTCMonth() + 1, 1)), paymentDay);
}

export function calculateNextContractCollectionDate({
  currentDate,
  startDate,
  endDate,
  paymentDay,
  firstCollectionDate,
  intervalMonths = 1,
}: {
  currentDate: Date;
  startDate: Date;
  endDate: Date;
  paymentDay: number;
  firstCollectionDate: Date | null;
  intervalMonths?: number;
}) {
  const anchor = firstCollectionDate ?? calculateContractFirstCollectionDate(startDate, paymentDay);
  const currentMonth = currentDate.getUTCFullYear() * 12 + currentDate.getUTCMonth();
  const anchorMonth = anchor.getUTCFullYear() * 12 + anchor.getUTCMonth();
  const firstMonth = Math.max(currentMonth, anchorMonth);
  const currentPeriod = new Date(Date.UTC(Math.floor(firstMonth / 12), firstMonth % 12, 1));

  for (let offset = 0; offset <= intervalMonths + 12; offset += 1) {
    const period = new Date(Date.UTC(currentPeriod.getUTCFullYear(), currentPeriod.getUTCMonth() + offset, 1));
    const dueDate = calculateContractReceiptDueDate(period, paymentDay, anchor);
    if (!collectionPeriodIsEligible(period, anchor, intervalMonths)) continue;
    if (dueDate < currentDate || dueDate < startDate) continue;
    if (dueDate > endDate) return null;
    return dueDate;
  }

  return null;
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

export function calculateReceiptTotal({ rent }: { rent: number }) {
  return Math.round((rent + Number.EPSILON) * 100) / 100;
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
