import { NextResponse } from "next/server";

import { isSameOrigin, safeRouteError } from "@/lib/http/route-security";
import { actualizarUnidad } from "@/lib/services/foundation";

function formValue(form: FormData, key: string) {
  const value = String(form.get(key) ?? "").trim();
  return value.length > 0 ? value : null;
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string; unidadId: string }> },
) {
  const url = new URL(request.url);
  if (!isSameOrigin(request)) return new NextResponse("Origen no permitido.", { status: 403 });

  const { id, unidadId } = await params;
  try {
    const form = await request.formData();
    await actualizarUnidad(unidadId, {
      propiedadId: id,
      identificador: String(form.get("identificador") ?? ""),
      tipo: String(form.get("tipo") ?? "") as "DEPARTAMENTO" | "LOCAL_COMERCIAL" | "ACCESORIA" | "BODEGA" | "OFICINA" | "OTRO",
      metrosCuadrados: String(form.get("metrosCuadrados") ?? ""),
      descripcion: formValue(form, "descripcion"),
      piso: formValue(form, "piso"),
      atributos: null,
      recamaras: Number(form.get("recamaras") ?? 0), banosCompletos: Number(form.get("banosCompletos") ?? 0), mediosBanos: Number(form.get("mediosBanos") ?? 0), amenidades: form.getAll("amenidades").map(String),
    });

    return NextResponse.redirect(new URL(`/propiedades/${id}/unidades/${unidadId}`, url), 303);
  } catch (error) {
    const target = new URL(`/propiedades/${id}/unidades/${unidadId}/editar`, url);
    target.searchParams.set("error", safeRouteError(error));
    return NextResponse.redirect(target, 303);
  }
}
