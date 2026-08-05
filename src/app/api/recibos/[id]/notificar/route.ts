import { NextResponse } from "next/server";

import { isSameOrigin, safeRouteError } from "@/lib/http/route-security";
import { enviarRecordatorioRecibo } from "@/lib/services/notifications";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const url = new URL(request.url);
  if (!isSameOrigin(request)) return new NextResponse("Origen no permitido.", { status: 403 });
  const { id } = await params;
  const period = (await request.formData()).get("periodo");
  try {
    await enviarRecordatorioRecibo(id);
    const target = new URL("/cobranza", url); if (period) target.searchParams.set("periodo", String(period)); target.searchParams.set("notificado", "1");
    return NextResponse.redirect(target, 303);
  } catch (error) {
    const target = new URL("/cobranza", url); if (period) target.searchParams.set("periodo", String(period)); target.searchParams.set("error", safeRouteError(error));
    return NextResponse.redirect(target, 303);
  }
}
