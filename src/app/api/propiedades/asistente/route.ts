import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { z } from "zod";

import { requireSystemRole, WRITE_ROLES } from "@/lib/auth/authorization";
import { DomainError } from "@/lib/domain/errors";
import { isSameOrigin } from "@/lib/http/route-security";
import { eliminarFotosBlob, propertyPhotoUploadsFromFormData } from "@/lib/property-photos";
import { crearAltaPropiedadAsistida } from "@/lib/services/foundation";

function errorResponse(error: unknown) {
  if (error instanceof z.ZodError) {
    return NextResponse.json({
      error: error.issues[0]?.message ?? "Revisa los datos capturados.",
      issues: error.issues.map((issue) => ({ path: issue.path.join("."), message: issue.message })),
    }, { status: 422 });
  }

  if (error instanceof DomainError) {
    return NextResponse.json({ error: error.message, code: error.code }, { status: 422 });
  }

  return NextResponse.json({ error: "No fue posible completar el alta de la propiedad." }, { status: 500 });
}

export async function POST(request: Request) {
  if (!isSameOrigin(request)) return new NextResponse("Origen no permitido.", { status: 403 });

  let photos: ReturnType<typeof propertyPhotoUploadsFromFormData> = [];
  try {
    await requireSystemRole(WRITE_ROLES);
    const form = await request.formData();
    const raw = form.get("alta");
    if (typeof raw !== "string") {
      return NextResponse.json({ error: "No recibimos los datos del asistente." }, { status: 400 });
    }

    let alta: unknown;
    try {
      alta = JSON.parse(raw) as unknown;
    } catch {
      return NextResponse.json({ error: "Los datos del asistente no son válidos." }, { status: 400 });
    }

    photos = propertyPhotoUploadsFromFormData(form);
    const property = await crearAltaPropiedadAsistida(alta, photos);
    revalidatePath("/propiedades");
    revalidatePath(`/propiedades/${property.id}`);
    return NextResponse.json({ propiedadId: property.id }, { status: 201 });
  } catch (error) {
    await eliminarFotosBlob(photos);
    return errorResponse(error);
  }
}
