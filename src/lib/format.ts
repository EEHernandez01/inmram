type NumericValue = { toString(): string } | string | number;

export function normalizeCurrencyInput(value: unknown) {
  return String(value ?? "")
    .trim()
    .replace(/^MXN\$\s*/i, "")
    .replaceAll("$", "")
    .replaceAll(",", "")
    .trim();
}

export function formatCurrency(value: NumericValue, fractionDigits = 2) {
  return `MXN$ ${new Intl.NumberFormat("en-US", {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(Number(value))}`;
}

export function formatCurrencyInput(value: NumericValue | null | undefined, fractionDigits = 2) {
  const normalized = normalizeCurrencyInput(value);
  return normalized ? formatCurrency(normalized, fractionDigits) : "";
}

export function formatDate(value: Date) {
  return new Intl.DateTimeFormat("es-MX", { timeZone: "UTC" }).format(value);
}

export function formatReceiptPeriodRange(start: Date, end: Date) {
  const monthYear = (value: Date) => new Intl.DateTimeFormat("es-MX", { month: "long", year: "numeric", timeZone: "UTC" }).format(value);
  return start.getUTCFullYear() === end.getUTCFullYear() && start.getUTCMonth() === end.getUTCMonth()
    ? monthYear(start)
    : `${monthYear(start)} – ${monthYear(end)}`;
}

export function formatDateRange(start: Date, end: Date) {
  const date = (value: Date) => new Intl.DateTimeFormat("es-MX", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(value);
  return `del ${keepDateTogether(date(start))} al ${keepDateTogether(date(end))}`;
}

/** Keep the day, month, and year of a formatted Spanish date on the same line. */
export function keepDateTogether(value: string) {
  return value.replace(/\b(\d{1,2}) de ([\p{L}]+) (de|del) (\d{4})\b/giu, "$1\u00a0de\u00a0$2\u00a0$3\u00a0$4");
}

export function formatReceiptCoverageRange(periodStart: Date, periodEnd: Date) {
  return formatDateRange(periodStart, periodEnd);
}

export function formatPercent(value: number) {
  return new Intl.NumberFormat("es-MX", {
    maximumFractionDigits: 1,
    minimumFractionDigits: 0,
  }).format(value) + "%";
}

export function toDateInput(value: Date) {
  return value.toISOString().slice(0, 10);
}
