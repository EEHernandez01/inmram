export type ProfitabilityInput = {
  monthlyRent: number;
  unitArea: number;
  propertyArea: number;
  propertyAnnualTax: number;
  propertyAnnualMaintenance: number;
  propertyCommercialValue: number;
};

export function calculateUnitProfitability(input: ProfitabilityInput) {
  if (input.unitArea <= 0 || input.propertyArea <= 0) throw new RangeError("Las superficies deben ser mayores que cero.");
  const share = input.unitArea / input.propertyArea;
  const monthlyTax = input.propertyAnnualTax / 12 * share;
  const monthlyMaintenance = input.propertyAnnualMaintenance / 12 * share;
  const monthlyExpenses = monthlyTax + monthlyMaintenance;
  const monthlyNetIncome = input.monthlyRent - monthlyExpenses;
  const estimatedUnitValue = input.propertyCommercialValue * share;
  const monthlyReturn = estimatedUnitValue > 0 ? monthlyNetIncome / estimatedUnitValue * 100 : null;
  const annualReturn = estimatedUnitValue > 0 ? monthlyNetIncome * 12 / estimatedUnitValue * 100 : null;
  const grossAnnualReturn = estimatedUnitValue > 0 ? input.monthlyRent * 12 / estimatedUnitValue * 100 : null;

  return {
    share,
    monthlyTax,
    monthlyMaintenance,
    monthlyExpenses,
    monthlyNetIncome,
    estimatedUnitValue,
    monthlyReturn,
    annualReturn,
    capRate: annualReturn,
    grossAnnualReturn,
    netIncomePerSquareMeter: monthlyNetIncome / input.unitArea,
    rentPerSquareMeter: input.monthlyRent / input.unitArea,
  };
}

export function calculatePortfolioProfitability(monthlyRent: number, monthlyExpenses: number, commercialValue: number) {
  const monthlyNetIncome = monthlyRent - monthlyExpenses;
  return {
    monthlyRent,
    monthlyExpenses,
    monthlyNetIncome,
    monthlyReturn: commercialValue > 0 ? monthlyNetIncome / commercialValue * 100 : null,
    annualReturn: commercialValue > 0 ? monthlyNetIncome * 12 / commercialValue * 100 : null,
    grossAnnualReturn: commercialValue > 0 ? monthlyRent * 12 / commercialValue * 100 : null,
    commercialValue,
  };
}
