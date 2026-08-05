import { safeRouteError } from "@/lib/http/route-security";
import { obtenerReporteInflacion } from "@/lib/services/inflation";

export async function GET(request: Request) {
  const url = new URL(request.url);
  try {
    const report = await obtenerReporteInflacion(url.searchParams.get("anio"));
    const rows = [["indice", "mes", "nivel_oficial", "fecha_corte"], ...report.meses.map((item) => [item.indice, item.mes.toISOString().slice(0, 7), item.valor.toString(), item.fechaCorte.toISOString().slice(0, 10)])];
    rows.push([report.indice, "inflacion_acumulada", report.acumulado?.toString() ?? "incompleta", ""]);
    return new Response(rows.map((row) => row.join(",")).join("\r\n"), { headers: { "content-type": "text/csv; charset=utf-8", "content-disposition": `attachment; filename="inflacion-${report.anio}.csv"` } });
  } catch (error) {
    return Response.json({ error: safeRouteError(error) }, { status: 400 });
  }
}
