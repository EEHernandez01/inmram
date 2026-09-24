export type CriterioCoincidenciaPropiedad = "DIRECCION" | "GOOGLE_PLACE";

export function normalizarDireccion(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

export function criteriosCoincidenciaPropiedad({
  direccionNormalizada,
  googlePlaceId,
  candidataDireccionNormalizada,
  candidataGooglePlaceId,
}: {
  direccionNormalizada: string;
  googlePlaceId?: string | null;
  candidataDireccionNormalizada: string;
  candidataGooglePlaceId?: string | null;
}): CriterioCoincidenciaPropiedad[] {
  const criteria: CriterioCoincidenciaPropiedad[] = [];

  if (direccionNormalizada && direccionNormalizada === candidataDireccionNormalizada) {
    criteria.push("DIRECCION");
  }
  if (googlePlaceId && candidataGooglePlaceId === googlePlaceId) {
    criteria.push("GOOGLE_PLACE");
  }

  return criteria;
}
