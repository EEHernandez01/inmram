import { safeRouteError } from "@/lib/http/route-security";
import { generarPropuestaRenovacionPdf, generarVistaPreviaPropuestaRenovacionPdf } from "@/lib/services/inflation";

export const runtime = "nodejs";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const isPreview = new URL(request.url).searchParams.get("preview") === "1";
    const pdf = isPreview
      ? await generarVistaPreviaPropuestaRenovacionPdf(id)
      : await generarPropuestaRenovacionPdf(id);
    return new Response(new Uint8Array(pdf), {
      headers: {
        "content-type": "application/pdf",
        "content-disposition": `inline; filename="${isPreview ? "vista-previa-renovacion" : "propuesta-renovacion"}-${id.slice(0, 8)}.pdf"`,
        "cache-control": "private, no-store",
      },
    });
  } catch (error) {
    return Response.json({ error: safeRouteError(error) }, { status: 400 });
  }
}
