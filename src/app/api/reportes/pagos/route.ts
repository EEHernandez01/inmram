import { safeRouteError } from "@/lib/http/route-security";
import { generarReportePagosMensualPdf } from "@/lib/services/payment-reports";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const search = new URL(request.url).searchParams;
  try {
    const { pdf, periodValue } = await generarReportePagosMensualPdf({
      periodo: search.get("periodo") ?? undefined,
      cliente: search.get("cliente") ?? undefined,
      propiedad: search.get("propiedad") ?? undefined,
      unidad: search.get("unidad") ?? undefined,
    });
    return new Response(new Uint8Array(pdf), {
      headers: {
        "content-type": "application/pdf",
        "content-disposition": `inline; filename="pagos-recibidos-${periodValue}.pdf"`,
        "cache-control": "private, no-store",
      },
    });
  } catch (error) {
    return Response.json({ error: safeRouteError(error) }, { status: 400 });
  }
}
