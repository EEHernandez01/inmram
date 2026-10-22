import { safeRouteError } from "@/lib/http/route-security";
import { DomainError } from "@/lib/domain/errors";
import { generarRecibosCobranzaPdf } from "@/lib/services/receipts";
import { receiptPeriodSchema, receiptStatusFilterSchema } from "@/lib/validation/collection";
import { recordIdSchema } from "@/lib/validation/foundation";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const form = await request.formData();
    const periodValue = receiptPeriodSchema.parse(String(form.get("periodo") ?? ""));
    const parsedStatus = receiptStatusFilterSchema.safeParse(String(form.get("estatus") ?? "") || undefined);
    if (!parsedStatus.success) throw parsedStatus.error;

    const mode = String(form.get("modo") ?? "");
    if (mode !== "todos" && mode !== "seleccionados") throw new DomainError("INVALID_INPUT", "Selecciona qué recibos deseas imprimir.");
    const search = String(form.get("buscar") ?? "").trim().slice(0, 100) || undefined;
    const rawIds = form.getAll("ids").map(String);
    const ids = mode === "seleccionados" ? [...new Set(rawIds.map((id) => recordIdSchema.parse(id)))] : undefined;
    if (mode === "seleccionados" && !ids?.length) throw new DomainError("INVALID_INPUT", "Selecciona al menos un recibo para imprimir.");

    const pdf = await generarRecibosCobranzaPdf({ periodValue, status: parsedStatus.data, search, ids });
    const filename = `recibos-cobranza-${periodValue}.pdf`;
    return new Response(new Uint8Array(pdf), {
      headers: {
        "content-type": "application/pdf",
        "content-disposition": `inline; filename="${filename}"`,
        "cache-control": "private, no-store",
      },
    });
  } catch (error) {
    return Response.json({ error: safeRouteError(error) }, { status: 400 });
  }
}
