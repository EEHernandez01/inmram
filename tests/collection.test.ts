import assert from "node:assert/strict";
import test from "node:test";

import {
  calculateOverdueDays,
  calculateReceiptDueDate,
  calculateReceiptPaymentBalance,
  calculateReceiptCoverage,
  calculatePeriodicCharge,
  collectionIntervalMonths,
  collectionPeriodIsEligible,
  calculateContractReceiptDueDate,
  calculateReceiptStatus,
  calculateReceiptTotal,
  contractOverlapsPeriod,
  currentReceiptPeriod,
  receiptPeriodFromValue,
} from "../src/lib/calculations/collection.ts";
import { calculateInflationFromIndexLevels, calculateRenewedRent, expirationAlertLevel, isRenewalProposalWindow, renewalTermDates } from "../src/lib/calculations/inflation.ts";
import { calculatePortfolioProfitability, calculateUnitProfitability } from "../src/lib/calculations/profitability.ts";
import { calculateWaterConsumption } from "../src/lib/calculations/water.ts";

test("un pago el día 31 de febrero vence el 1 de marzo", () => {
  const period = receiptPeriodFromValue("2026-02");
  assert.equal(calculateReceiptDueDate(period, 31).toISOString(), "2026-03-01T00:00:00.000Z");
});

test("el primer recibo histórico respeta la fecha elegida y luego vuelve al día pactado", () => {
  const october = receiptPeriodFromValue("2026-10");
  const november = receiptPeriodFromValue("2026-11");
  const december = receiptPeriodFromValue("2026-12");
  const firstDate = new Date("2026-11-12T00:00:00.000Z");
  assert.equal(collectionPeriodIsEligible(october, firstDate), false);
  assert.equal(collectionPeriodIsEligible(november, firstDate), true);
  assert.equal(calculateContractReceiptDueDate(november, 5, firstDate).toISOString(), firstDate.toISOString());
  assert.equal(calculateReceiptStatus({ currentDate: new Date("2026-10-13T00:00:00.000Z"), dueDate: firstDate, paid: false }), "PENDIENTE");
  assert.equal(calculateContractReceiptDueDate(december, 5, firstDate).toISOString(), "2026-12-05T00:00:00.000Z");
});

test("los contratos existentes sin fecha inicial de cobro conservan el día pactado", () => {
  const october = receiptPeriodFromValue("2026-10");
  assert.equal(collectionPeriodIsEligible(october, null), true);
  assert.equal(calculateContractReceiptDueDate(october, 12, null).toISOString(), "2026-10-12T00:00:00.000Z");
});

test("la periodicidad determina los meses elegibles desde el próximo cobro", () => {
  const anchor = new Date("2026-11-12T00:00:00.000Z");
  assert.equal(collectionPeriodIsEligible(receiptPeriodFromValue("2026-12"), anchor, 2), false);
  assert.equal(collectionPeriodIsEligible(receiptPeriodFromValue("2027-01"), anchor, 2), true);
  assert.equal(collectionPeriodIsEligible(receiptPeriodFromValue("2027-05"), anchor, 6), true);
  assert.equal(collectionPeriodIsEligible(receiptPeriodFromValue("2027-11"), anchor, 12), true);
  assert.deepEqual(
    (["MENSUAL", "BIMESTRAL", "SEMESTRAL", "ANUAL"] as const).map(collectionIntervalMonths),
    [1, 2, 6, 12],
  );
});

test("el recibo cubre el intervalo y limita el último periodo al fin del contrato", () => {
  const coverage = calculateReceiptCoverage(
    receiptPeriodFromValue("2026-11"),
    6,
    new Date("2027-02-14T00:00:00.000Z"),
  );
  assert.equal(coverage.months, 4);
  assert.equal(coverage.periodEnd.toISOString(), "2027-02-28T00:00:00.000Z");
  assert.equal(
    calculateReceiptCoverage(receiptPeriodFromValue("2026-12"), 2).periodEnd.toISOString(),
    "2027-01-31T00:00:00.000Z",
  );
});

test("renta y servicios mensuales se multiplican con precisión de centavos", () => {
  assert.equal(calculatePeriodicCharge("10000.01", 6), "60000.06");
  assert.equal(calculatePeriodicCharge("450.25", 2), "900.50");
  assert.throws(() => calculatePeriodicCharge("999999999999.99", 12), RangeError);
});

test("un recibo vence solamente después de la fecha límite", () => {
  const dueDate = new Date("2026-08-05T00:00:00.000Z");
  assert.equal(calculateReceiptStatus({ currentDate: dueDate, dueDate, paid: false }), "PENDIENTE");
  assert.equal(calculateReceiptStatus({ currentDate: new Date("2026-08-06T00:00:00.000Z"), dueDate, paid: false }), "VENCIDO");
  assert.equal(calculateOverdueDays(new Date("2026-08-08T00:00:00.000Z"), dueDate), 3);
});

test("un recibo pagado conserva el estado pagado", () => {
  assert.equal(calculateReceiptStatus({ currentDate: new Date("2026-08-20T00:00:00.000Z"), dueDate: new Date("2026-08-05T00:00:00.000Z"), paid: true }), "PAGADO");
});

test("el total del recibo suma únicamente la renta con precisión de centavos", () => {
  assert.equal(
    calculateReceiptTotal({ rent: 10_000.1 }),
    10_000.1,
  );
});

test("los pagos parciales y revertidos determinan el saldo del recibo", () => {
  const balance = calculateReceiptPaymentBalance({
    total: 10_450.35,
    payments: [
      { amount: 3_000 },
      { amount: 1_000, reversed: true },
      { amount: 2_450.35 },
    ],
  });
  assert.equal(balance.montoPagado, 5_450.35);
  assert.equal(balance.saldoPendiente, 5_000);
});

test("el periodo actual respeta America/Mexico_City", () => {
  assert.equal(currentReceiptPeriod(new Date("2026-09-01T05:30:00.000Z")).toISOString(), "2026-08-01T00:00:00.000Z");
});

test("detecta contratos que se cruzan con el periodo", () => {
  const period = receiptPeriodFromValue("2026-08");
  assert.equal(contractOverlapsPeriod({ startDate: new Date("2026-08-15T00:00:00.000Z"), endDate: new Date("2027-08-14T00:00:00.000Z"), period }), true);
  assert.equal(contractOverlapsPeriod({ startDate: new Date("2026-09-01T00:00:00.000Z"), endDate: new Date("2027-08-31T00:00:00.000Z"), period }), false);
  assert.equal(contractOverlapsPeriod({ startDate: new Date("2015-01-01T00:00:00.000Z"), endDate: new Date("2016-01-01T00:00:00.000Z"), period }), false);
});

test("calcula inflación acumulada desde niveles oficiales", () => {
  assert.ok(Math.abs(calculateInflationFromIndexLevels(125, 130) - 0.04) < Number.EPSILON);
  assert.equal(calculateRenewedRent(10_000, 0.04), 10_400);
});

test("clasifica alertas de renovación a 90 y 30 días", () => {
  assert.equal(expirationAlertLevel(90), "PROXIMO");
  assert.equal(expirationAlertLevel(30), "CRITICO");
  assert.equal(expirationAlertLevel(91), null);
});

test("habilita la propuesta durante el mes calendario previo al vencimiento", () => {
  const end = new Date("2027-08-19T00:00:00.000Z");
  assert.equal(isRenewalProposalWindow(end, new Date("2027-07-01T00:00:00.000Z")), true);
  assert.equal(isRenewalProposalWindow(end, new Date("2027-07-31T00:00:00.000Z")), true);
  assert.equal(isRenewalProposalWindow(end, new Date("2027-06-30T00:00:00.000Z")), false);
  assert.equal(isRenewalProposalWindow(end, new Date("2027-08-01T00:00:00.000Z")), false);
});

test("calcula una vigencia de renovación de doce meses desde el día siguiente", () => {
  const term = renewalTermDates(new Date("2027-08-19T00:00:00.000Z"));
  assert.equal(term.start.toISOString(), "2027-08-20T00:00:00.000Z");
  assert.equal(term.end.toISOString(), "2028-08-19T00:00:00.000Z");
});

test("prorratea predial, mantenimiento y valor comercial por metros cuadrados", () => {
  const result = calculateUnitProfitability({ monthlyRent: 10_000, unitArea: 50, propertyArea: 100, propertyAnnualTax: 12_000, propertyAnnualMaintenance: 24_000, propertyCommercialValue: 2_000_000 });
  assert.equal(result.share, 0.5);
  assert.equal(result.monthlyTax, 500);
  assert.equal(result.monthlyMaintenance, 1_000);
  assert.equal(result.monthlyNetIncome, 8_500);
  assert.equal(result.estimatedUnitValue, 1_000_000);
  assert.equal(result.annualReturn, 10.2);
  assert.equal(result.rentPerSquareMeter, 200);
});

test("consolida rentabilidad del portafolio", () => {
  const result = calculatePortfolioProfitability(20_000, 2_000, 2_000_000);
  assert.equal(result.monthlyNetIncome, 18_000);
  assert.equal(result.annualReturn, 10.8);
});

test("calcula consumo de agua para control interno", () => {
  const consumption = calculateWaterConsumption(125.5, 132.75);
  assert.equal(consumption, 7.25);
});

test("rechaza una lectura actual menor que la anterior", () => {
  assert.throws(() => calculateWaterConsumption(20, 19.5), RangeError);
});
