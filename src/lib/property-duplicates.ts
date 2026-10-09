export type CriterioCoincidenciaPropiedad = "DIRECCION" | "GOOGLE_PLACE";

export function criteriosUnificacion(
  actual: { direccionNormalizada: string; googlePlaceId: string | null },
  candidata: { direccionNormalizada: string; googlePlaceId: string | null },
  ubicacion?: { direccion: string; googlePlaceId: string | null },
) {
  return criteriosCoincidenciaPropiedad({
    direccionNormalizada: ubicacion ? normalizarDireccion(ubicacion.direccion) : actual.direccionNormalizada,
    googlePlaceId: ubicacion ? ubicacion.googlePlaceId : actual.googlePlaceId,
    candidataDireccionNormalizada: candidata.direccionNormalizada,
    candidataGooglePlaceId: candidata.googlePlaceId,
  });
}

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
