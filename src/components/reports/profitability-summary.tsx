import { formatCurrency, formatPercent } from "@/lib/format";
import type { obtenerReporteRentabilidad } from "@/lib/services/reports";
import { MonthlyComparison } from "@/components/reports/monthly-comparison";

type Portfolio = Awaited<ReturnType<typeof obtenerReporteRentabilidad>>["portfolio"];

function percentage(value: number | null) {
  return value === null ? "N/D" : formatPercent(value);
}

export function ProfitabilitySummary({ portfolio }: { portfolio: Portfolio }) {
  const max = Math.max(portfolio.monthlyRent, portfolio.monthlyExpenses, 1);
  const returnProgress = Math.min(100, Math.max(0, portfolio.annualReturn ?? 0));
  const returnCircumference = (returnProgress / 100) * 2 * Math.PI * 24;

  return (
    <section aria-label="Resumen de rentabilidad" className="mt-7 grid gap-4 lg:grid-cols-2">
      <article className="flex flex-col gap-5 rounded-card border border-brand/10 bg-brand p-6 text-white sm:flex-row sm:items-center">
        <div aria-label={`Rentabilidad anual: ${percentage(portfolio.annualReturn)}`} className="relative grid size-28 shrink-0 place-items-center self-center sm:self-auto" role="img">
          <svg aria-hidden="true" className="size-full -rotate-90" viewBox="0 0 56 56">
            <circle className="text-white/20" cx="28" cy="28" fill="none" r="24" stroke="currentColor" strokeWidth="5" />
            <circle className="text-white" cx="28" cy="28" fill="none" r="24" stroke="currentColor" strokeDasharray={`${returnCircumference} ${2 * Math.PI * 24}`} strokeLinecap="round" strokeWidth="5" />
          </svg>
          <span aria-hidden="true" className="absolute text-xl font-bold tracking-tight [font-variant-numeric:tabular-nums]">{percentage(portfolio.annualReturn)}</span>
        </div>
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[.1em] text-white/70">Rentabilidad neta anual</p>
          <p className="mt-2 text-2xl font-bold tracking-tight [font-variant-numeric:tabular-nums]">{formatCurrency(portfolio.monthlyNetIncome)}<span className="ml-1 text-sm font-medium text-white/70">/ mes netos</span></p>
          <p className="mt-2 text-sm leading-6 text-white/70">Calculada sobre un valor comercial estimado de {formatCurrency(portfolio.commercialValue)}.</p>
          <p className="mt-3 text-sm text-white/80">Rentabilidad bruta anual: <span className="font-bold text-white">{percentage(portfolio.grossAnnualReturn)}</span></p>
        </div>
      </article>

      <article className="rounded-card border border-border bg-surface p-6">
        <h2 className="text-sm font-bold text-ink">Ingresos y gastos mensuales</h2>
        <p className="mb-5 mt-1 text-sm text-ink-secondary">Mira cuánto de la renta se destina a gastos del portafolio.</p>
        <MonthlyComparison expenses={portfolio.monthlyExpenses} max={max} rent={portfolio.monthlyRent} />
      </article>
    </section>
  );
}
