import { NextResponse } from "next/server";

import { requireSystemRole, WRITE_ROLES } from "@/lib/auth/authorization";
import { isSameOrigin, safeRouteError } from "@/lib/http/route-security";
import { sincronizarIndiceInpcBanxico, sincronizarInflacionMensualAnualBanxico } from "@/lib/services/inflation";

export async function POST(request: Request) {
  const url = new URL(request.url);
  if (!isSameOrigin(request)) return new NextResponse("Origen no permitido.", { status: 403 });

  try {
    await requireSystemRole(WRITE_ROLES);
    const form = await request.formData();
    const [indice, inflacion] = await Promise.all([
      sincronizarIndiceInpcBanxico(),
      sincronizarInflacionMensualAnualBanxico(),
    ]);
    const target = new URL("/inflacion", url);
    const desde = String(form.get("desde") ?? "");
    const hasta = String(form.get("hasta") ?? "");
    if (/^\d{4}$/.test(desde)) target.searchParams.set("desde", desde);
    if (/^\d{4}$/.test(hasta)) target.searchParams.set("hasta", hasta);
    if (indice.estado === "token_no_configurado" || inflacion.estado === "token_no_configurado") {
      target.searchParams.set("syncError", "token");
    } else if (indice.estado === "dato_no_disponible" || inflacion.estado === "dato_no_disponible") {
      target.searchParams.set("syncError", "banxico");
    } else {
      target.searchParams.set("sincronizado", "1");
    }
    return NextResponse.redirect(target, 303);
  } catch (error) {
    const target = new URL("/inflacion", url);
    const databaseCode = error && typeof error === "object" && "code" in error && typeof error.code === "string" && /^P\d{4}$/.test(error.code)
      ? error.code
      : null;
    target.searchParams.set(
      "syncError",
      databaseCode === "P2039"
        ? "La base de datos aún rechaza las tasas mensuales negativas. Aplica la migración de inflación y vuelve a sincronizar."
        : databaseCode
        ? "No se pudieron guardar los datos en la base de datos (" + databaseCode + ")."
        : safeRouteError(error),
    );
    return NextResponse.redirect(target, 303);
  }
}
