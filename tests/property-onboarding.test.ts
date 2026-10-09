import assert from "node:assert/strict";
import test from "node:test";
import { altaPropiedadAsistidaSchema } from "../src/lib/validation/property-onboarding.ts";

const id = "4ca5a15a-45ef-47cc-8c3c-557e1fd1b1c6";
const existing = {
  propiedadExistenteId: id,
  propiedad: { direccion: "Desierto de los Leones 4054" },
  unidades: [{ datos: { identificador: "102" }, propietario: { modo: "PRINCIPAL" }, contrato: null }],
};

test("agregar unidades conserva el destino sin pedir otro propietario principal", () => {
  const result = altaPropiedadAsistidaSchema.parse(existing);
  assert.ok("propiedadExistenteId" in result);
  assert.equal(result.propiedadExistenteId, id);
  assert.equal(result.propietario, undefined);
  assert.equal(result.unidades[0].datos.identificador, "102");
});

test("agregar a una propiedad requiere destino válido y al menos una unidad", () => {
  assert.equal(altaPropiedadAsistidaSchema.safeParse({ ...existing, unidades: [] }).success, false);
  assert.equal(altaPropiedadAsistidaSchema.safeParse({ ...existing, propiedadExistenteId: "otra" }).success, false);
});

test("una ficha nueva sigue requiriendo propietario principal", () => {
  const withoutTarget = { propiedad: existing.propiedad, unidades: existing.unidades };
  assert.equal(altaPropiedadAsistidaSchema.safeParse(withoutTarget).success, false);
  assert.equal(altaPropiedadAsistidaSchema.safeParse({ ...withoutTarget,
    propietario: { modo: "EXISTENTE", propietarioId: id }, unidades: [],
  }).success, true);
});

test("las unidades agregadas conservan sus dueños y contratos independientes", () => {
  const result = altaPropiedadAsistidaSchema.parse({ ...existing, unidades: [
    { datos: { identificador: "A" }, propietario: { modo: "EXISTENTE", propietarioId: id }, contrato: null },
    { datos: { identificador: "B" }, propietario: { modo: "NUEVO", propietario: { nombre: "Ana Pérez" } }, contrato: { arrendatario: "Luis" } },
  ] });
  assert.equal(result.unidades[0].propietario.modo, "EXISTENTE");
  assert.equal(result.unidades[1].propietario.modo, "NUEVO");
  assert.equal(result.unidades[1].contrato?.arrendatario, "Luis");
});
