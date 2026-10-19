import { formatCurrency, formatPercent } from "@/lib/format";
import type { obtenerReporteRentabilidad } from "@/lib/services/reports";

type Property = Awaited<ReturnType<typeof obtenerReporteRentabilidad>>["properties"][number];
type Unit = Property["units"][number];

function percentage(value: number | null) {
  return value === null ? "N/D" : formatPercent(value);
}

function UnitProfitabilityCard({ unit }: { unit: Unit }) {
  return (
    <article className="rounded-card border border-border p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h4 className="font-semibold text-ink">Unidad {unit.identificador}</h4>
          <p className="mt-1 text-xs text-ink-secondary">{unit.metrosCuadrados.toLocaleString("es-MX")} m²</p>
        </div>
        <span className={`rounded-pill px-2.5 py-1 text-xs font-semibold ${unit.tieneContratoActivo ? "bg-success-soft text-success" : "bg-bg text-ink-secondary"}`}>
          {unit.tieneContratoActivo ? "Con contrato" : "Sin renta vigente"}
        </span>
      </div>

      <dl className="mt-4 grid grid-cols-3 gap-2 border-y border-border py-3 text-sm">
        <div><dt className="text-xs text-ink-secondary">Renta</dt><dd className="mt-1 font-semibold text-ink [font-variant-numeric:tabular-nums]">{formatCurrency(unit.monthlyRent)}</dd></div>
        <div><dt className="text-xs text-ink-secondary">Gastos</dt><dd className="mt-1 font-semibold text-ink [font-variant-numeric:tabular-nums]">{formatCurrency(unit.monthlyExpenses)}</dd></div>
        <div><dt className="text-xs text-ink-secondary">Neto</dt><dd className={`mt-1 font-bold [font-variant-numeric:tabular-nums] ${unit.monthlyNetIncome < 0 ? "text-danger" : "text-success"}`}>{formatCurrency(unit.monthlyNetIncome)}</dd></div>
      </dl>

      <details className="group mt-3">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-2 rounded px-1 py-2 text-sm font-semibold text-brand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand">
          Ver rendimiento y valores por m²
          <svg aria-hidden="true" className="size-4 shrink-0 transition-transform duration-200 group-open:rotate-180" fill="none" viewBox="0 0 24 24">
            <path d="m6 9 6 6 6-6" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
          </svg>
        </summary>
        <dl className="grid grid-cols-2 gap-x-3 gap-y-3 px-1 pb-2 pt-1 text-sm">
          <div><dt className="text-xs text-ink-secondary">Predial / mes</dt><dd className="mt-1 font-medium text-ink [font-variant-numeric:tabular-nums]">{formatCurrency(unit.monthlyTax)}</dd></div>
          <div><dt className="text-xs text-ink-secondary">Mantenimiento / mes</dt><dd className="mt-1 font-medium text-ink [font-variant-numeric:tabular-nums]">{formatCurrency(unit.monthlyMaintenance)}</dd></div>
          <div><dt className="text-xs text-ink-secondary">Renta / m²</dt><dd className="mt-1 font-medium text-ink [font-variant-numeric:tabular-nums]">{formatCurrency(unit.rentPerSquareMeter)}</dd></div>
          <div><dt className="text-xs text-ink-secondary">Neto / m²</dt><dd className="mt-1 font-medium text-ink [font-variant-numeric:tabular-nums]">{formatCurrency(unit.netIncomePerSquareMeter)}</dd></div>
          <div><dt className="text-xs text-ink-secondary">Rentabilidad anual neta</dt><dd className="mt-1 font-medium text-ink [font-variant-numeric:tabular-nums]">{percentage(unit.annualReturn)}</dd></div>
          <div><dt className="text-xs text-ink-secondary">Rentabilidad anual bruta</dt><dd className="mt-1 font-medium text-ink [font-variant-numeric:tabular-nums]">{percentage(unit.grossAnnualReturn)}</dd></div>
        </dl>
      </details>
    </article>
  );
}

export function PropertyProfitability({ property }: { property: Property }) {
  const rent = property.units.reduce((sum, unit) => sum + unit.monthlyRent, 0);
  const expenses = property.units.reduce((sum, unit) => sum + unit.monthlyExpenses, 0);

  return (
    <article className="overflow-hidden rounded-card border border-border bg-surface">
      <header className="flex flex-col gap-3 border-b border-border bg-bg/60 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h3 className="font-semibold text-ink">{property.direccion}</h3>
          <p className="mt-1 text-sm text-ink-secondary">{property.units.length} {property.units.length === 1 ? "unidad" : "unidades"} · {property.propertyArea.toLocaleString("es-MX")} m²</p>
        </div>
        <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm">
          <p className="text-ink-secondary">Renta <span className="ml-1 font-bold text-ink [font-variant-numeric:tabular-nums]">{formatCurrency(rent)}/mes</span></p>
          <p className="text-ink-secondary">Gastos <span className="ml-1 font-bold text-ink [font-variant-numeric:tabular-nums]">{formatCurrency(expenses)}/mes</span></p>
          <p className="text-ink-secondary">Renta neta <span className="ml-1 font-bold text-ink [font-variant-numeric:tabular-nums]">{formatCurrency(property.monthlyNetIncome)}/mes</span></p>
          <p className="text-ink-secondary">Rendimiento anual <span className="ml-1 font-bold text-brand [font-variant-numeric:tabular-nums]">{percentage(property.annualReturn)}</span></p>
        </div>
      </header>

      {property.units.length === 0 ? (
        <p className="p-5 text-sm text-ink-secondary">No hay unidades registradas para esta propiedad.</p>
      ) : (
        <div className="grid gap-3 p-4 sm:grid-cols-2">
          {property.units.map((unit) => <UnitProfitabilityCard key={unit.id} unit={unit} />)}
        </div>
      )}
    </article>
  );
}
