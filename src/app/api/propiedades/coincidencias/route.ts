import { NextResponse } from "next/server";

import { safeRouteError } from "@/lib/http/route-security";
import { buscarCoincidenciasPropiedad } from "@/lib/services/foundation";

export async function GET(request: Request) {
  const url = new URL(request.url);

  try {
    const coincidencias = await buscarCoincidenciasPropiedad({
      direccion: url.searchParams.get("direccion") ?? "",
      googlePlaceId: url.searchParams.get("googlePlaceId"),
      excluirPropiedadId: url.searchParams.get("excluirPropiedadId") ?? undefined,
    });
    return NextResponse.json({ coincidencias });
  } catch (error) {
    return NextResponse.json({ error: safeRouteError(error) }, { status: 400 });
  }
}
