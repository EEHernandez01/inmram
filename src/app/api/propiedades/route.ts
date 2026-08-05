import { NextResponse } from "next/server";

import { crearPropiedad } from "@/lib/services/foundation";
import { obtenerPropietarioActual } from "@/lib/services/profile";
import { isSameOrigin, safeRouteError } from "@/lib/http/route-security";

function formValue(form: FormData, key: string) {
  const value = String(form.get(key) ?? "").trim();
  return value.length > 0 ? value : null;
}

export async function POST(request: Request) {
  const url = new URL(request.url);
  if (!isSameOrigin(request)) {
    return new NextResponse("Origen no permitido.", { status: 403 });
  }

  try {
    const form = await request.formData();
    const owner = await obtenerPropietarioActual();

    const property = await crearPropiedad({
      propietarioId: owner.id,
      marcaId: formValue(form, "marcaId"),
      direccion: String(form.get("direccion") ?? ""),
      googlePlaceId: formValue(form, "googlePlaceId"),
      latitud: formValue(form, "latitud"),
      longitud: formValue(form, "longitud"),
      valorCatastral: String(form.get("valorCatastral") ?? ""),
      valorComercialTotal: String(form.get("valorComercialTotal") ?? ""),
      predialAnual: String(form.get("predialAnual") ?? ""),
      mantenimientoAnual: String(form.get("mantenimientoAnual") ?? ""),
    });

    return NextResponse.redirect(new URL(`/propiedades/${property.id}`, url), 303);
  } catch (error) {
    const target = new URL("/propiedades/nueva", url);
    target.searchParams.set("error", safeRouteError(error));
    return NextResponse.redirect(target, 303);
  }
}