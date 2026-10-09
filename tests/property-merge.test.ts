import assert from "node:assert/strict";
import test from "node:test";
import { criteriosUnificacion, normalizarDireccion } from "../src/lib/property-duplicates.ts";
import { ubicacionParaUnificarSchema } from "../src/lib/validation/property-merge.ts";

const actual = { direccionNormalizada: "direccion antigua", googlePlaceId: "anterior" };
const candidata = {
  direccionNormalizada: normalizarDireccion("Desierto de los Leones 4054, Altavista, Ciudad de México, Ciudad de México, Ciudad de México"),
  googlePlaceId: "ubicacion-compartida",
};
const ubicacion = {
  direccion: "Desierto de los Leones 4054, Altavista, Álvaro Obregón, Ciudad de México, C.P. 01790, Mexico",
  googlePlaceId: "ubicacion-compartida", latitud: "19.35", longitud: "-99.19",
};

test("unificar usa la ubicación corregida que originó el aviso de coincidencia", () => {
  assert.deepEqual(criteriosUnificacion(actual, candidata), []);
  assert.deepEqual(criteriosUnificacion(actual, candidata, ubicacion), ["GOOGLE_PLACE"]);
  assert.deepEqual(ubicacionParaUnificarSchema.parse(ubicacion), ubicacion);
});

test("sin ubicación editada conserva la comparación de las fichas guardadas", () => {
  assert.deepEqual(criteriosUnificacion(candidata, candidata), ["DIRECCION", "GOOGLE_PLACE"]);
});

test("una edición no coincidente no permite unificar aunque antes coincidieran", () => {
  assert.deepEqual(criteriosUnificacion(candidata, candidata, { direccion: "Otro inmueble 123", googlePlaceId: null }), []);
});

test("direcciones manuales coincidentes permiten unificar sin inventar coordenadas", () => {
  const manual = { ...ubicacion, googlePlaceId: null, latitud: null, longitud: null };
  assert.equal(ubicacionParaUnificarSchema.safeParse(manual).success, true);
  assert.deepEqual(criteriosUnificacion(actual, { direccionNormalizada: normalizarDireccion(manual.direccion), googlePlaceId: null }, manual), ["DIRECCION"]);
});

test("rechaza ubicaciones incompletas, fuera de rango y campos ajenos a la ubicación", () => {
  for (const invalid of [
    { ...ubicacion, direccion: "" }, { ...ubicacion, latitud: null },
    { ...ubicacion, latitud: "91" }, { ...ubicacion, longitud: "-181" },
    { ...ubicacion, propietarioId: "otro" },
  ]) assert.equal(ubicacionParaUnificarSchema.safeParse(invalid).success, false);
});
