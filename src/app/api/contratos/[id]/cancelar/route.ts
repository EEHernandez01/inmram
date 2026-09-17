import { NextResponse } from "next/server";

import { isSameOrigin, safeRouteError } from "@/lib/http/route-security";
import { cancelarContrato } from "@/lib/services/foundation";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const url = new URL(request.url);
  if (!isSameOrigin(request)) return new NextResponse("Origen no permitido.", { status: 403 });

  const { id } = await params;
  try {
    const form = await request.formData();
    await cancelarContrato(id, {
      fechaCancelacion: String(form.get("fechaCancelacion") ?? ""),
      motivoCancelacion: String(form.get("motivoCancelacion") ?? ""),
    });
    const target = new URL(`/contratos/${id}`, url);
    target.searchParams.set("cancelado", "1");
    return NextResponse.redirect(target, 303);
  } catch (error) {
    const target = new URL(`/contratos/${id}`, url);
    target.searchParams.set("error", safeRouteError(error));
    return NextResponse.redirect(target, 303);
  }
}
