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

  try {
    const result = await unificarPropiedades(id, String(form.get("propiedadDuplicadaId") ?? ""));
    const target = new URL(`/propiedades/${result.propiedadId}`, requestUrl);
    target.searchParams.set("aviso", "Las propiedades se unificaron y sus unidades se conservaron en una sola ficha.");
    return NextResponse.redirect(target, 303);
  } catch (error) {
    const target = new URL(`/propiedades/${id}`, requestUrl);
    target.searchParams.set("error", safeRouteError(error));
    return NextResponse.redirect(target, 303);
  }
}
