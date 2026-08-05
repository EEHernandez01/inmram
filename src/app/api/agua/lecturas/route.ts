import { NextResponse } from "next/server";

import { isSameOrigin, safeRouteError } from "@/lib/http/route-security";
import { registrarLecturaAgua } from "@/lib/services/water";

export async function POST(request: Request) {
  const url = new URL(request.url);
  if (!isSameOrigin(request)) return new NextResponse("Origen no permitido.", { status: 403 });
  try {
    const form = await request.formData();
    await registrarLecturaAgua(Object.fromEntries(form));
    const target = new URL("/agua", url); target.searchParams.set("lectura", "registrada");
    return NextResponse.redirect(target, 303);
  } catch (error) {
    const target = new URL("/agua", url); target.searchParams.set("error", safeRouteError(error));
    return NextResponse.redirect(target, 303);
  }
}
