import { NextResponse } from "next/server";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { crearPropiedad } from "@/lib/services/foundation";
import { prisma } from "@/lib/db/prisma";
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
    const property = await crearPropiedad({
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

    const photos = form.getAll("fotos").filter((value): value is File => value instanceof File && value.size > 0);
    if (photos.length > 8) throw new Error("Puedes cargar hasta 8 fotos.");
    for (const [order, photo] of photos.entries()) {
      if (!/^image\/(jpeg|png|webp)$/.test(photo.type) || photo.size > 5 * 1024 * 1024) throw new Error("Cada foto debe ser JPG, PNG o WebP y pesar máximo 5 MB.");
      const extension = photo.name.split(".").pop()?.toLowerCase() || "jpg";
      const filename = `${crypto.randomUUID()}.${extension}`;
      const folder = path.join(process.cwd(), "public", "uploads", "propiedades", property.id);
      await mkdir(folder, { recursive: true });
      await writeFile(path.join(folder, filename), Buffer.from(await photo.arrayBuffer()));
      const url = `/uploads/propiedades/${property.id}/${filename}`;
      await prisma.archivoExpediente.create({ data: { propiedadId: property.id, tipo: "FOTO_PROPIEDAD", url, nombre: photo.name, mimeType: photo.type, tamanoBytes: photo.size, orden: order } });
    }

    return NextResponse.redirect(new URL(`/propiedades/${property.id}`, url), 303);
  } catch (error) {
    const target = new URL("/propiedades/nueva", url);
    target.searchParams.set("error", safeRouteError(error));
    return NextResponse.redirect(target, 303);
  }
}
