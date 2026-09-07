import { NextResponse } from "next/server";

import { isSameOrigin, safeRouteError } from "@/lib/http/route-security";
import { eliminarPropiedadArchivadaPermanentemente } from "@/lib/services/foundation";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!isSameOrigin(request)) {
    return new NextResponse("Origen no permitido.", { status: 403 });
  }

  const { id } = await params;
  const requestUrl = new URL(request.url);

  try {
    await eliminarPropiedadArchivadaPermanentemente(id);
    return NextResponse.redirect(new URL("/propiedades?estado=archivadas", requestUrl), 303);
  } catch (error) {
    const target = new URL(`/propiedades/${id}`, requestUrl);
    target.searchParams.set("error", safeRouteError(error));
    return NextResponse.redirect(target, 303);
  }
}
