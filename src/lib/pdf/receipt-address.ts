export function addressIncludesUnit(address: string, unit: string) {
  const normalizedUnit = unit.trim();
  if (!normalizedUnit) return true;

  const escapedUnit = normalizedUnit.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`\\b${escapedUnit}\\b`, "i").test(address);
}
