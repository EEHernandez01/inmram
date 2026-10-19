import Link from "next/link";

import type { obtenerReporteRentabilidad } from "@/lib/services/reports";

type PropertyOptions = Awaited<ReturnType<typeof obtenerReporteRentabilidad>>["propertyOptions"];

export function PropertyFilter({
  options,
  selected,
}: {
  options: PropertyOptions;
  selected: string;
}) {
  return (
    <section aria-label="Filtros del reporte" className="mt-7 rounded-card border border-border bg-surface p-5">
      <form action="/reportes" className="flex flex-col gap-3 sm:flex-row sm:items-end" method="get">
        <label className="block min-w-0 flex-1 space-y-2 text-sm font-semibold text-ink" htmlFor="property-filter">
          <span className="block">Propiedad</span>
          <select className="h-11 w-full rounded border border-border bg-surface px-3 text-sm text-ink focus:border-brand" defaultValue={selected} id="property-filter" name="propiedad">
            <option value="">Todo el portafolio</option>
            {options.map((property) => (
              <option key={property.id} value={property.id}>{property.direccion}</option>
            ))}
          </select>
        </label>
        <div className="flex gap-2">
          <button className="min-h-11 rounded-card bg-brand px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-brand-hover" type="submit">Aplicar</button>
          {selected ? <Link className="inline-flex min-h-11 items-center rounded-card border border-border px-4 py-2.5 text-sm font-semibold text-ink hover:bg-bg" href="/reportes">Limpiar</Link> : null}
        </div>
      </form>
    </section>
  );
}
