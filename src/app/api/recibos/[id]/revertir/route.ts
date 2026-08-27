import { NextResponse } from "next/server";

export async function POST() {
  return new NextResponse("Esta ruta ya no está disponible. Revierte un movimiento específico.", { status: 410 });
}
