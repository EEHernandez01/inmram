import { NextResponse } from "next/server";

import { isSameOrigin, safeRouteError } from "@/lib/http/route-security";
import { crearContrato } from "@/lib/services/foundation";

function formValue(form: FormData, key: string) {
  return String(form.get(key) ?? "").trim();
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string; unidadId: string }> },
) {
  const url = new URL(request.url);
  if (!isSameOrigin(request)) return new NextResponse("Origen no permitido.", { status: 403 });

  const { id, unidadId } = await params;
  try {
    const form = await request.formData();
    const contract = await crearContrato({
      unidadId,
      arrendatario: formValue(form, "arrendatario"),
      emailArrendatario: formValue(form, "emailArrendatario") || null,
      telefonoArrendatario: formValue(form, "telefonoArrendatario") || null,
      aval: formValue(form, "aval"),
      fechaInicio: formValue(form, "fechaInicio"),
      plazoMeses: Number(formValue(form, "plazoMeses")),
      fechaFin: formValue(form, "fechaFin"),
      rentaMensualBase: formValue(form, "rentaMensualBase"),
      diaPago: Number(formValue(form, "diaPago")),
      depositoGarantia: formValue(form, "depositoGarantia"),
      estado: String(form.get("estado") ?? "ACTIVO") as "ACTIVO" | "VENCIDO",
    });

    return NextResponse.redirect(new URL(`/contratos/${contract.id}`, url), 303);
  } catch (error) {
    const target = new URL(`/propiedades/${id}/unidades/${unidadId}/contratos/nuevo`, url);
    target.searchParams.set("error", safeRouteError(error));
    return NextResponse.redirect(target, 303);
  }
}