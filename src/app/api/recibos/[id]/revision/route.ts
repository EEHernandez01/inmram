import { NextResponse } from "next/server";

import { isSameOrigin, safeRouteError } from "@/lib/http/route-security";
import { resolverRevisionRecibo } from "@/lib/services/collection";
import { receiptPeriodSchema } from "@/lib/validation/collection";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!isSameOrigin(request)) return new NextResponse("Origen no permitido.", { status: 403 });
  const requestUrl = new URL(request.url);
  const form = await request.formData();
  const period = receiptPeriodSchema.safeParse(String(form.get("periodo") ?? ""));
  const target = new URL("/cobranza", requestUrl);
  if (period.success) target.searchParams.set("periodo", period.data);
  try {
    const { id } = await params;
    await resolverRevisionRecibo(id, { accion: String(form.get("accion") ?? ""), motivo: String(form.get("motivo") ?? "") });
    target.searchParams.set("revision", "resuelta");
  } catch (error) {
    target.searchParams.set("error", safeRouteError(error));
  }
  return NextResponse.redirect(target, 303);
}
