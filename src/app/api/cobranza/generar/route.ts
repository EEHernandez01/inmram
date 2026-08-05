import { NextResponse } from "next/server";

import { isSameOrigin, safeRouteError } from "@/lib/http/route-security";
import { sincronizarCobranzaActual } from "@/lib/services/collection";
import { receiptPeriodValue } from "@/lib/calculations/collection";

export async function POST(request: Request) {
  if (!isSameOrigin(request)) {
    return new NextResponse("Origen no permitido.", { status: 403 });
  }

  const requestUrl = new URL(request.url);
  try {
    const result = await sincronizarCobranzaActual();
    const target = new URL("/cobranza", requestUrl);
    target.searchParams.set("periodo", receiptPeriodValue(result.periodo));
    target.searchParams.set("generados", String(result.creados));
    target.searchParams.set("actualizados", String(result.actualizadosVencidos));
    return NextResponse.redirect(target, 303);
  } catch (error) {
    const target = new URL("/cobranza", requestUrl);
    target.searchParams.set("error", safeRouteError(error));
    return NextResponse.redirect(target, 303);
  }
}

