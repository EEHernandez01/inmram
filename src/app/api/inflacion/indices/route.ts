import { NextResponse } from "next/server";

import { isSameOrigin, safeRouteError } from "@/lib/http/route-security";
import { guardarIndiceInflacion } from "@/lib/services/inflation";

export async function POST(request: Request) {
  const url = new URL(request.url);
  if (!isSameOrigin(request)) return new NextResponse("Origen no permitido.", { status: 403 });
  try {
    const form = await request.formData();
    await guardarIndiceInflacion({ indice: form.get("indice"), mes: form.get("mes"), valor: form.get("valor"), fechaCorte: form.get("fechaCorte") });
    const target = new URL("/inflacion", url); target.searchParams.set("guardado", "1");
    return NextResponse.redirect(target, 303);
  } catch (error) {
    const target = new URL("/inflacion", url); target.searchParams.set("error", safeRouteError(error));
    return NextResponse.redirect(target, 303);
  }
}
