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

export function formatPercent(value: number) {
  return new Intl.NumberFormat("es-MX", {
    maximumFractionDigits: 1,
    minimumFractionDigits: 0,
  }).format(value) + "%";
}

export function toDateInput(value: Date) {
  return value.toISOString().slice(0, 10);
}
