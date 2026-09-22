export const unitAmenities = [
  "Estacionamiento",
  "Balcón",
  "Bodega",
  "Elevador",
  "Terraza",
  "Roof garden",
  "Cuarto de servicio",
  "Baño de servicio",
] as const;

export type UnitAmenityDetails = {
  balconMetrosCuadrados?: number;
  cajonesEstacionamiento?: number;
  roofGardenMetrosCuadrados?: number;
};

export function unitAmenityInputFromFormData(formData: FormData) {
  const amenidades = formData.getAll("amenidades").map(String);
  const atributos: Record<string, string> = {};

  if (amenidades.includes("Roof garden")) {
    atributos.roofGardenMetrosCuadrados = String(formData.get("roofGardenMetrosCuadrados") ?? "").trim();
  }

  if (amenidades.includes("Balcón")) {
    atributos.balconMetrosCuadrados = String(formData.get("balconMetrosCuadrados") ?? "").trim();
  }

  if (amenidades.includes("Estacionamiento")) {
    atributos.cajonesEstacionamiento = String(formData.get("cajonesEstacionamiento") ?? "").trim();
  }

  return {
    amenidades,
    atributos: Object.keys(atributos).length > 0 ? atributos : null,
  };
}

export function unitAmenityDetailsFrom(value: unknown): UnitAmenityDetails {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};

  const attributes = value as Record<string, unknown>;
  return {
    balconMetrosCuadrados: numberValue(attributes.balconMetrosCuadrados),
    cajonesEstacionamiento: numberValue(attributes.cajonesEstacionamiento),
    roofGardenMetrosCuadrados: numberValue(attributes.roofGardenMetrosCuadrados),
  };
}

function numberValue(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}
