import { NextResponse } from "next/server";
import { z } from "zod";

import { DomainError } from "@/lib/domain/errors";
import { guardarPerfilActual } from "@/lib/services/profile";

const optional = (formData: FormData, key: string) => {
  const captured = String(formData.get(key) ?? "").trim();
  return captured || null;
};

export async function POST(request: Request) {
  const requestUrl = new URL(request.url);
  const origin = request.headers.get("origin");

  if (!origin || origin !== requestUrl.origin) {
    return new NextResponse("Origen no permitido.", { status: 403 });
  }

  const formData = await request.formData();
  let errorMessage: string | undefined;

  try {
    await guardarPerfilActual({
      nombreCompleto: String(formData.get("nombreCompleto") ?? ""),
      alias: optional(formData, "alias"),
      razonSocial: optional(formData, "razonSocial"),
      telefono: optional(formData, "telefono"),
      rfc: optional(formData, "rfc"),
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      errorMessage = error.issues[0]?.message ?? "Revisa los datos capturados.";
    } else if (error instanceof DomainError) {
      errorMessage = error.message;
    } else {
      errorMessage = "No fue posible guardar tu perfil.";
    }
  }

  if (errorMessage) {
    const errorUrl = new URL("/configuracion/perfil", requestUrl);
    errorUrl.searchParams.set("error", errorMessage);
    return NextResponse.redirect(errorUrl, 303);
  }

  return NextResponse.redirect(
    new URL("/configuracion/perfil?guardado=1", requestUrl),
    303,
  );
}

