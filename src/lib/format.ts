export function formatCurrency(value: { toString(): string } | string | number) {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
  }).format(Number(value));
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
