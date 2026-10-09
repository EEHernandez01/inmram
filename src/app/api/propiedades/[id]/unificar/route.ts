import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import { isSameOrigin, safeRouteError } from "@/lib/http/route-security";
import { unificarPropiedades } from "@/lib/services/foundation";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!isSameOrigin(request)) return new NextResponse("Origen no permitido.", { status: 403 });

  const requestUrl = new URL(request.url);
  const { id } = await params;
  const form = await request.formData();
  const wantsJson = request.headers.get("accept")?.includes("application/json");

  try {
    const ubicacion = form.has("direccion") ? {
      direccion: form.get("direccion"),
      googlePlaceId: form.get("googlePlaceId") || null,
      latitud: form.get("latitud") || null,
      longitud: form.get("longitud") || null,
    } : undefined;
    const result = await unificarPropiedades(id, String(form.get("propiedadDuplicadaId") ?? ""), ubicacion);
    revalidatePath("/propiedades");
    revalidatePath(`/propiedades/${result.propiedadId}`);
    revalidatePath(`/propiedades/${result.propiedadEliminadaId}`);
    const mensaje = `Unificación completada: se trasladaron ${result.unidadesMovidas} unidades. La ficha conservada tiene ahora ${result.totalUnidades} unidades. Se conservaron sus contratos e historial.`;
    const target = new URL(`/propiedades/${result.propiedadId}`, requestUrl);
    target.searchParams.set("aviso", mensaje);
    target.searchParams.set("unificada", "1");
    if (wantsJson) return NextResponse.json({ ...result, mensaje, redirectUrl: `${target.pathname}${target.search}` });
    return NextResponse.redirect(target, 303);
  } catch (error) {
    if (wantsJson) return NextResponse.json({ error: safeRouteError(error) }, { status: 422 });
    const target = new URL(`/propiedades/${id}`, requestUrl);
    target.searchParams.set("error", safeRouteError(error));
    return NextResponse.redirect(target, 303);
  }
}
