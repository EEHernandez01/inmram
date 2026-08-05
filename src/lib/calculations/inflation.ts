export function calculateInflationFromIndexLevels(baseLevel: number, finalLevel: number) {
  if (!Number.isFinite(baseLevel) || !Number.isFinite(finalLevel) || baseLevel <= 0 || finalLevel <= 0) {
    throw new RangeError("Los niveles del índice deben ser mayores que cero.");
  }
  return finalLevel / baseLevel - 1;
}

export function calculateRenewedRent(currentRent: number, accumulatedInflation: number) {
  if (!Number.isFinite(currentRent) || currentRent <= 0 || !Number.isFinite(accumulatedInflation)) {
    throw new RangeError("La renta y la inflación deben ser válidas.");
  }
  return Math.round(currentRent * (1 + accumulatedInflation) * 100) / 100;
}

export function contractExpirationAlertDays(endDate: Date, currentDate: Date) {
  const day = 86_400_000;
  return Math.ceil((Date.UTC(endDate.getUTCFullYear(), endDate.getUTCMonth(), endDate.getUTCDate()) - Date.UTC(currentDate.getUTCFullYear(), currentDate.getUTCMonth(), currentDate.getUTCDate())) / day);
}

export function expirationAlertLevel(days: number) {
  if (days < 0 || days > 90) return null;
  if (days <= 30) return "CRITICO" as const;
  return "PROXIMO" as const;
}
