export function calculateWaterConsumption(previousReading: number, currentReading: number) {
  if (!Number.isFinite(previousReading) || !Number.isFinite(currentReading) || previousReading < 0 || currentReading < previousReading) {
    throw new RangeError("La lectura actual no puede ser menor que la anterior.");
  }
  return Math.round((currentReading - previousReading) * 1_000) / 1_000;
}
