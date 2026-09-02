import { NextResponse } from "next/server";

import { requireSystemRole, WRITE_ROLES } from "@/lib/auth/authorization";
import { eliminarFotosBlob, guardarFotosBlobDePropiedad, propertyPhotoUploadsFromFormData } from "@/lib/property-photos";
import { actualizarPropiedad } from "@/lib/services/foundation";
import { isSameOrigin, safeRouteError } from "@/lib/http/route-security";

function formValue(form: FormData, key: string) {
  const value = String(form.get(key) ?? "").trim();
  return value.length > 0 ? value : null;
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const requestUrl = new URL(request.url);
  const { id } = await params;
  let photos: ReturnType<typeof propertyPhotoUploadsFromFormData> = [];

  if (!isSameOrigin(request)) {
    return new NextResponse("Origen no permitido.", { status: 403 });
  }

  try {
    await requireSystemRole(WRITE_ROLES);
    const form = await request.formData();
    photos = propertyPhotoUploadsFromFormData(form);
    await actualizarPropiedad(id, {
      propietarioId: String(form.get("propietarioId") ?? ""),
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
    await guardarFotosBlobDePropiedad(id, photos);

    const target = new URL(`/propiedades/${id}`, requestUrl);
    if (form.get("fotoCargaFallida") === "1") {
      target.searchParams.set("aviso", "Los cambios se guardaron, pero una o más fotos no pudieron cargarse. Inténtalo nuevamente.");
    }
    return NextResponse.redirect(target, 303);
  } catch (error) {
    await eliminarFotosBlob(photos);
    const target = new URL(`/propiedades/${id}/editar`, requestUrl);
    target.searchParams.set("error", safeRouteError(error));
    return NextResponse.redirect(target, 303);
  }
}
