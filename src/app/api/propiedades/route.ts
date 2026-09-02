import { NextResponse } from "next/server";

import { requireSystemRole, WRITE_ROLES } from "@/lib/auth/authorization";
import { prisma } from "@/lib/db/prisma";
import { eliminarFotosBlob, propertyPhotoUploadsFromFormData } from "@/lib/property-photos";
import { propiedadInputSchema } from "@/lib/validation/foundation";
import { isSameOrigin, safeRouteError } from "@/lib/http/route-security";

function formValue(form: FormData, key: string) {
  const value = String(form.get(key) ?? "").trim();
  return value.length > 0 ? value : null;
}

export async function POST(request: Request) {
  const requestUrl = new URL(request.url);
  let photos: ReturnType<typeof propertyPhotoUploadsFromFormData> = [];

  if (!isSameOrigin(request)) {
    return new NextResponse("Origen no permitido.", { status: 403 });
  }

  try {
    await requireSystemRole(WRITE_ROLES);
    const form = await request.formData();
    const data = propiedadInputSchema.parse({
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
    photos = propertyPhotoUploadsFromFormData(form);

    const property = await prisma.$transaction(async (transaction) => {
      const created = await transaction.propiedad.create({ data });

      if (photos.length > 0) {
        await transaction.archivoExpediente.createMany({
          data: photos.map((photo, order) => ({
            propiedadId: created.id,
            tipo: "FOTO_PROPIEDAD" as const,
            url: photo.url,
            nombre: photo.nombre,
            mimeType: photo.mimeType,
            tamanoBytes: photo.tamanoBytes,
            orden: order,
          })),
        });
      }

      return created;
    });

    const target = new URL(`/propiedades/${property.id}`, requestUrl);
    if (form.get("fotoCargaFallida") === "1") {
      target.searchParams.set("aviso", "La propiedad se guardó, pero una o más fotos no pudieron cargarse. Inténtalo nuevamente desde Editar propiedad.");
    }
    return NextResponse.redirect(target, 303);
  } catch (error) {
    await eliminarFotosBlob(photos);
    const target = new URL("/propiedades/nueva", requestUrl);
    target.searchParams.set("error", safeRouteError(error));
    return NextResponse.redirect(target, 303);
  }
}
