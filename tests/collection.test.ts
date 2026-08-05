import assert from "node:assert/strict";
import test from "node:test";

import {
  calculateOverdueDays,
  calculateReceiptDueDate,
  calculateReceiptStatus,
  contractOverlapsPeriod,
  currentReceiptPeriod,
  receiptPeriodFromValue,
} from "../src/lib/calculations/collection.ts";
import { calculateInflationFromIndexLevels, calculateRenewedRent, expirationAlertLevel } from "../src/lib/calculations/inflation.ts";
import { calculatePortfolioProfitability, calculateUnitProfitability } from "../src/lib/calculations/profitability.ts";
import { calculateWaterCharge, calculateWaterConsumption } from "../src/lib/calculations/water.ts";

test("un pago el día 31 de febrero vence el 1 de marzo", () => {
  const period = receiptPeriodFromValue("2026-02");
  assert.equal(calculateReceiptDueDate(period, 31).toISOString(), "2026-03-01T00:00:00.000Z");
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

test("el periodo actual respeta America/Mexico_City", () => {
  assert.equal(currentReceiptPeriod(new Date("2026-09-01T05:30:00.000Z")).toISOString(), "2026-08-01T00:00:00.000Z");
});

test("detecta contratos que se cruzan con el periodo", () => {
  const period = receiptPeriodFromValue("2026-08");
  assert.equal(contractOverlapsPeriod({ startDate: new Date("2026-08-15T00:00:00.000Z"), endDate: new Date("2027-08-14T00:00:00.000Z"), period }), true);
  assert.equal(contractOverlapsPeriod({ startDate: new Date("2026-09-01T00:00:00.000Z"), endDate: new Date("2027-08-31T00:00:00.000Z"), period }), false);
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

test("calcula consumo y cargo de agua", () => {
  const consumption = calculateWaterConsumption(125.5, 132.75);
  assert.equal(consumption, 7.25);
  assert.equal(calculateWaterCharge(100, 18.5, consumption), 234.13);
});

test("rechaza una lectura actual menor que la anterior", () => {
  assert.throws(() => calculateWaterConsumption(20, 19.5), RangeError);
});
