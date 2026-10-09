export type AddressParts = {
  calle: string;
  numero: string;
  numeroInterior: string;
  colonia: string;
  municipio: string;
  ciudad: string;
  estado: string;
  codigoPostal: string;
};

export type AddressComponent = {
  longText?: string;
  shortText?: string;
  long_name?: string;
  short_name?: string;
  types: string[];
};

function normalize(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().replace(/\s+/g, " ").toLowerCase();
}

function componentText(component: AddressComponent | undefined) {
  return (component?.longText ?? component?.long_name ?? "").trim();
}

const boroughs = new Set([
  "Álvaro Obregón", "Azcapotzalco", "Benito Juárez", "Coyoacán", "Cuajimalpa de Morelos",
  "Cuauhtémoc", "Gustavo A. Madero", "Iztacalco", "Iztapalapa", "La Magdalena Contreras",
  "Miguel Hidalgo", "Milpa Alta", "Tláhuac", "Tlalpan", "Venustiano Carranza", "Xochimilco",
].map(normalize));

export function addressPartsFromPlace(place: { addressComponents?: AddressComponent[] }): AddressParts {
  const components = place.addressComponents ?? [];
  const find = (type: string) => components.find((component) => component.types.includes(type));
  const state = find("administrative_area_level_1");
  const isMexicoCity = [componentText(state), state?.shortText ?? state?.short_name ?? ""]
    .some((name) => ["ciudad de mexico", "cdmx", "d.f.", "distrito federal"].includes(normalize(name)));

  // In CDMX a sublocality can be either a borough or a neighborhood.
  // Only use a recognized borough; never substitute the city or a neighborhood.
  const municipality = isMexicoCity
    ? components.find((component) =>
      component.types.some((type) => type.startsWith("administrative_area_level_") || type.startsWith("sublocality") || type === "locality") &&
      boroughs.has(normalize(componentText(component)).replace(/^(alcaldia|delegacion)\s+/, "")))
    : find("administrative_area_level_2") ?? find("locality");
  const neighborhood = ["neighborhood", "sublocality_level_2", "sublocality_level_1", "sublocality"]
    .map(find)
    .find((component) => component && component !== municipality && componentText(component));

  return {
    calle: componentText(find("route")),
    numero: componentText(find("street_number")),
    numeroInterior: componentText(find("subpremise")),
    colonia: componentText(neighborhood),
    municipio: componentText(municipality),
    ciudad: componentText(find("locality") ?? find("postal_town")),
    estado: componentText(state),
    codigoPostal: componentText(find("postal_code")),
  };
}

export function formatAddress(parts: AddressParts, fallback = "") {
  const street = [parts.calle, parts.numero, parts.numeroInterior ? `Int. ${parts.numeroInterior}` : ""]
    .map((value) => value.trim()).filter(Boolean).join(" ");
  const seen = new Set<string>();
  const areas = [parts.colonia, parts.municipio, parts.ciudad, parts.estado]
    .map((value) => value.trim())
    .filter((value) => {
      const normalized = normalize(value);
      const key = ["cdmx", "d.f.", "distrito federal"].includes(normalized) ? "ciudad de mexico" : normalized;
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  const address = [street, ...areas, parts.codigoPostal ? `C.P. ${parts.codigoPostal}` : ""]
    .filter(Boolean).join(", ");
  return address ? `${address}, Mexico` : fallback;
}
