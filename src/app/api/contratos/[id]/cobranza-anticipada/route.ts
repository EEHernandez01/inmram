import { NextResponse } from "next/server";

import { isSameOrigin, safeRouteError } from "@/lib/http/route-security";
import { generarCobranzaAnticipada } from "@/lib/services/collection";
import { receiptPeriodSchema } from "@/lib/validation/collection";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!isSameOrigin(request)) return new NextResponse("Origen no permitido.", { status: 403 });
  const requestUrl = new URL(request.url);
  const { id } = await params;
  const target = new URL(`/contratos/${encodeURIComponent(id)}`, requestUrl);
  const form = await request.formData();
  const period = receiptPeriodSchema.safeParse(String(form.get("periodo") ?? ""));
  if (!period.success) {
    target.searchParams.set("error", "Selecciona un periodo válido.");
    return NextResponse.redirect(target, 303);
  }

  try {
    const receipt = await generarCobranzaAnticipada(id, period.data);
    target.searchParams.set("solicitud", "generada");
    target.searchParams.set("reciboId", receipt.id);
  } catch (error) {
    target.searchParams.set("error", safeRouteError(error));
  }
  return NextResponse.redirect(target, 303);
}
