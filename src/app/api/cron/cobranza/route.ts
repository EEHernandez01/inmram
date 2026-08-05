import { validCronAuthorization } from "@/lib/http/route-security";
import { sincronizarCobranzaSistema } from "@/lib/services/collection";
import { contarAlertasRenovacionSistema } from "@/lib/services/inflation";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: Request) {
  if (!validCronAuthorization(request)) {
    return Response.json({ error: "No autorizado." }, { status: 401 });
  }

  const [result, contratosPorVencer] = await Promise.all([sincronizarCobranzaSistema(), contarAlertasRenovacionSistema()]);
  return Response.json({
    periodo: result.periodo.toISOString().slice(0, 10),
    recibosCreados: result.creados,
    recibosVencidosActualizados: result.actualizadosVencidos,
    contratosPorVencer,
  });
}
