import { safeRouteError } from "@/lib/http/route-security";
import { obtenerReporteRentabilidad } from "@/lib/services/reports";

function csvCell(value: string | number | null) {
  let text = value === null ? "" : String(value);
  if (/^[=+\-@]/.test(text)) text = `'${text}`;
  return `"${text.replaceAll('"', '""')}"`;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  try {
    const report = await obtenerReporteRentabilidad(url.searchParams.get("propiedad") ?? undefined);
    const rows: (string | number | null)[][] = [["propiedad", "unidad", "m2", "renta_mensual", "predial_mensual", "mantenimiento_mensual", "ingreso_neto_mensual", "valor_estimado_unidad", "renta_por_m2", "neto_por_m2", "rentabilidad_mensual_pct", "rentabilidad_anual_pct", "rentabilidad_bruta_anual_pct"]];
    for (const property of report.properties) for (const unit of property.units) rows.push([property.direccion, unit.identificador, unit.metrosCuadrados, unit.monthlyRent, unit.monthlyTax, unit.monthlyMaintenance, unit.monthlyNetIncome, unit.estimatedUnitValue, unit.rentPerSquareMeter, unit.netIncomePerSquareMeter, unit.monthlyReturn, unit.annualReturn, unit.grossAnnualReturn]);
    return new Response(`\uFEFF${rows.map((row) => row.map(csvCell).join(",")).join("\r\n")}`, { headers: { "content-type": "text/csv; charset=utf-8", "content-disposition": "attachment; filename=rentabilidad.csv" } });
  } catch (error) {
    return Response.json({ error: safeRouteError(error) }, { status: 400 });
  }
}
