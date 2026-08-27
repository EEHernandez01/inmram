import { NextResponse } from "next/server";

import { isSameOrigin, safeRouteError, sameOriginRedirectUrl } from "@/lib/http/route-security";
import { WATER_CONTROL_ENABLED } from "@/lib/features";
import { registrarLecturaAgua } from "@/lib/services/water";

export async function POST(request: Request) {
  if (!WATER_CONTROL_ENABLED) return new NextResponse("El control de agua está deshabilitado.", { status: 404 });
  if (!isSameOrigin(request)) return new NextResponse("Origen no permitido.", { status: 403 });
  const form = await request.formData();
  const target = sameOriginRedirectUrl(request, form.get("returnTo"), "/agua");
  try {
    await registrarLecturaAgua(Object.fromEntries(form));
    target.searchParams.set("agua", "lectura");
    return NextResponse.redirect(target, 303);
  } catch (error) {
    target.searchParams.set("error", safeRouteError(error));
    return NextResponse.redirect(target, 303);
  }
}
