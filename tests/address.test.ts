import assert from "node:assert/strict";
import test from "node:test";
import { addressPartsFromPlace, formatAddress, type AddressComponent } from "../src/lib/maps/address.ts";

const component = (longText: string, ...types: string[]): AddressComponent => ({ longText, types });
const base = [
  component("Adolfo Prieto", "route"),
  component("1353", "street_number"),
  component("Ciudad de México", "locality"),
  component("Ciudad de México", "administrative_area_level_1"),
  component("03100", "postal_code"),
];

test("CDMX separa alcaldía y colonia y muestra la ciudad una sola vez", () => {
  const parts = addressPartsFromPlace({ addressComponents: [...base,
    component("Benito Juárez", "sublocality", "sublocality_level_1"),
    component("Colonia del Valle Centro", "sublocality", "sublocality_level_2"),
  ] });
  assert.equal(parts.municipio, "Benito Juárez");
  assert.equal(parts.colonia, "Colonia del Valle Centro");
  assert.equal(parts.ciudad, "Ciudad de México");
  assert.equal(parts.estado, "Ciudad de México");
  assert.equal(formatAddress(parts), "Adolfo Prieto 1353, Colonia del Valle Centro, Benito Juárez, Ciudad de México, C.P. 03100, Mexico");
});

test("CDMX admite alcaldía administrativa y colonia de primer nivel", () => {
  const parts = addressPartsFromPlace({ addressComponents: [...base,
    component("Benito Juárez", "administrative_area_level_2"),
    component("Colonia del Valle Centro", "sublocality_level_1"),
  ] });
  assert.equal(parts.municipio, "Benito Juárez");
  assert.equal(parts.colonia, "Colonia del Valle Centro");
});

test("no sustituye una alcaldía ausente con la ciudad ni la colonia", () => {
  const parts = addressPartsFromPlace({ addressComponents: [...base,
    component("Ciudad de México", "administrative_area_level_2"),
    component("Colonia del Valle Centro", "sublocality_level_1"),
  ] });
  assert.equal(parts.municipio, "");
  assert.equal(parts.colonia, "Colonia del Valle Centro");
});

test("conserva municipio, ciudad y colonia distintos fuera de CDMX", () => {
  const parts = addressPartsFromPlace({ addressComponents: [
    component("Naucalpan de Juárez", "administrative_area_level_2"),
    component("Ciudad Satélite", "locality"),
    component("Circuito Médicos", "sublocality_level_1"),
    component("Estado de México", "administrative_area_level_1"),
  ] });
  assert.equal(parts.municipio, "Naucalpan de Juárez");
  assert.equal(parts.ciudad, "Ciudad Satélite");
  assert.equal(parts.colonia, "Circuito Médicos");
  assert.match(formatAddress(parts), /Estado de México, Mexico$/);
});

test("edición manual elimina duplicados con variantes de acentos y CDMX", () => {
  const parts = { ...addressPartsFromPlace({ addressComponents: base }),
    municipio: " ciudad de mexico ", estado: "CDMX", numeroInterior: "2B" };
  assert.equal(formatAddress(parts), "Adolfo Prieto 1353 Int. 2B, ciudad de mexico, C.P. 03100, Mexico");
});

test("sin componentes conserva la dirección original de respaldo", () => {
  assert.equal(formatAddress(addressPartsFromPlace({}), "Dirección original"), "Dirección original");
});
