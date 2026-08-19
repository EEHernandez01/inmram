import assert from "node:assert/strict";
import test from "node:test";

import {
  waterMeterInputSchema,
  waterPeriodDate,
  waterReadingInputSchema,
} from "../src/lib/validation/water.ts";
import { propertyReportFilterSchema } from "../src/lib/validation/reports.ts";

const unitId = "4ca5a15a-45ef-47cc-8c3c-557e1fd1b1c6";
const meterId = "8e6daed2-d5f8-420f-823a-6ae9b70c04fa";

test("acepta el medidor y las lecturas con precisión permitida", () => {
  const meter = waterMeterInputSchema.parse({
    unidadId: unitId,
    cuotaFija: "150.25",
    tarifaPorMetroCubico: "18.1234",
  });
  const reading = waterReadingInputSchema.parse({
    medidorAguaId: meterId,
    periodo: "2026-08",
    lecturaAnterior: "120.500",
    lecturaActual: "125.875",
  });

  assert.equal(meter.unidadId, unitId);
  assert.equal(reading.periodo, "2026-08");
});

test("rechaza periodos, UUIDs e importes inválidos de agua", () => {
  assert.equal(
    waterReadingInputSchema.safeParse({
      medidorAguaId: meterId,
      periodo: "2026-13",
      lecturaActual: "125.875",
    }).success,
    false,
  );
  assert.equal(
    waterReadingInputSchema.safeParse({
      medidorAguaId: "no-es-un-uuid",
      periodo: "2026-08",
      lecturaActual: "125.8759",
    }).success,
    false,
  );
  assert.equal(
    waterMeterInputSchema.safeParse({
      unidadId: unitId,
      cuotaFija: "-1",
      tarifaPorMetroCubico: "18.50",
    }).success,
    false,
  );
});

test("normaliza el primer día UTC del periodo de agua", () => {
  assert.equal(
    waterPeriodDate("2026-08").toISOString(),
    "2026-08-01T00:00:00.000Z",
  );
});

test("acepta solo un filtro de propiedad vacío o UUID válido", () => {
  assert.equal(propertyReportFilterSchema.parse(""), "");
  assert.equal(propertyReportFilterSchema.parse(unitId), unitId);
  assert.equal(propertyReportFilterSchema.safeParse("propiedad-1").success, false);
});
