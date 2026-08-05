import { NextResponse } from "next/server";

import { isSameOrigin, safeRouteError } from "@/lib/http/route-security";
import { renovarContrato } from "@/lib/services/inflation";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const url = new URL(request.url);
  if (!isSameOrigin(request)) return new NextResponse("Origen no permitido.", { status: 403 });
  const { id } = await params;
  try {
    const form = await request.formData();
    const result = await renovarContrato(id, Object.fromEntries(form));
    const target = new URL(`/contratos/${result.contrato.id}`, url); target.searchParams.set("renovado", "1");
    return NextResponse.redirect(target, 303);
  } catch (error) {
    const target = new URL(`/contratos/${id}`, url); target.searchParams.set("error", safeRouteError(error));
    return NextResponse.redirect(target, 303);
  }
}
