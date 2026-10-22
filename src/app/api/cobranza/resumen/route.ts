import { safeRouteError } from "@/lib/http/route-security";
import { generarResumenCobranzaMensualPdf } from "@/lib/services/collection-summary";
import { receiptPeriodSchema } from "@/lib/validation/collection";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const period = receiptPeriodSchema.safeParse(new URL(request.url).searchParams.get("periodo"));
  if (!period.success) return Response.json({ error: period.error.issues[0]?.message ?? "Selecciona un periodo válido." }, { status: 400 });

  try {
    const { pdf, periodValue } = await generarResumenCobranzaMensualPdf(period.data);
    return new Response(new Uint8Array(pdf), {
      headers: {
        "content-type": "application/pdf",
        "content-disposition": `inline; filename="hoja-resumen-cobranza-${periodValue}.pdf"`,
        "cache-control": "private, no-store",
      },
    });
  } catch (error) {
    return Response.json({ error: safeRouteError(error) }, { status: 400 });
  }
}
