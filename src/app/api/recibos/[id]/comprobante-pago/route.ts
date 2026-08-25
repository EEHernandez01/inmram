import { safeRouteError } from "@/lib/http/route-security";
import { generarComprobantePagoPdf } from "@/lib/services/receipts";

export const runtime = "nodejs";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const pdf = await generarComprobantePagoPdf(id);
    return new Response(new Uint8Array(pdf), { headers: { "content-type": "application/pdf", "content-disposition": `inline; filename="comprobante-pago-${id.slice(0, 8)}.pdf"`, "cache-control": "private, no-store" } });
  } catch (error) {
    return Response.json({ error: safeRouteError(error) }, { status: 400 });
  }
}
