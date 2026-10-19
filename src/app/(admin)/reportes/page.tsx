import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { PropertyFilter } from "@/components/reports/property-filter";
import { ProfitabilitySummary } from "@/components/reports/profitability-summary";
import { PropertyProfitability } from "@/components/reports/property-profitability";
import { obtenerReporteRentabilidad } from "@/lib/services/reports";

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ propiedad?: string }>;
}) {
  const query = await searchParams;
  const report = await obtenerReporteRentabilidad(query.propiedad);
  const selected = query.propiedad ?? "";

  return (
    <>
      <PageHeader
        action={
          <div className="flex flex-wrap gap-2">
            <a
              className="inline-flex min-h-11 items-center justify-center rounded-card border border-border bg-surface px-4 py-2.5 text-sm font-bold text-ink transition-colors hover:bg-bg"
              href="/reportes/pagos"
            >
              Reporte de pagos
            </a>
            <a
              className="inline-flex min-h-11 items-center justify-center rounded-card bg-brand px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-brand-hover"
              href={`/api/reportes/rentabilidad?propiedad=${encodeURIComponent(selected)}`}
            >
              Descargar CSV
            </a>
          </div>
        }
        description="Estimación con renta vigente y gastos de predial y mantenimiento prorrateados por m². Otros gastos: MXN$ 0.00."
        eyebrow="Análisis"
        title="Rentabilidad"
      />

      <PropertyFilter options={report.propertyOptions} selected={selected} />

      {report.properties.length === 0 ? (
        <div className="mt-7">
          <EmptyState title="Sin propiedades" description="No hay información disponible para calcular rentabilidad." />
        </div>
      ) : (
        <>
          <ProfitabilitySummary portfolio={report.portfolio} />

          <section aria-label="Detalle por propiedad" className="mt-9 space-y-7">
            <div>
              <h2 className="font-serif text-2xl font-semibold text-ink">Desglose por propiedad</h2>
              <p className="mt-1 text-sm text-ink-secondary">Consulta el rendimiento de cada unidad y abre sus datos detallados cuando los necesites.</p>
            </div>

            {report.properties.map((property) => (
              <PropertyProfitability key={property.id} property={property} />
            ))}
          </section>
        </>
      )}
    </>
  );
}
