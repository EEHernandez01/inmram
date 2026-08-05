export function calculateWaterConsumption(previousReading: number, currentReading: number) {
  if (!Number.isFinite(previousReading) || !Number.isFinite(currentReading) || previousReading < 0 || currentReading < previousReading) {
    throw new RangeError("La lectura actual no puede ser menor que la anterior.");
  }
  return Math.round((currentReading - previousReading) * 1_000) / 1_000;
}

export function calculateWaterCharge(fixedFee: number, ratePerCubicMeter: number, consumption: number) {
  if (fixedFee < 0 || ratePerCubicMeter < 0 || consumption < 0) throw new RangeError("Los importes y el consumo no pueden ser negativos.");
  return Math.round((fixedFee + consumption * ratePerCubicMeter) * 100) / 100;
}
