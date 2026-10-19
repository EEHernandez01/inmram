import { formatCurrency } from "@/lib/format";

export function MonthlyComparison({
  expenses,
  max,
  rent,
}: {
  expenses: number;
  max: number;
  rent: number;
}) {
  const bars = [
    { label: "Renta mensual", value: rent, color: "bg-brand" },
    { label: "Gastos mensuales", value: expenses, color: "bg-warning" },
  ];

  return (
    <div className="space-y-5">
      {bars.map(({ label, value, color }) => {
        const progress = Math.min(100, Math.max(0, (value / max) * 100));

        return (
          <div key={label}>
            <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
              <span className="text-sm font-medium text-ink-secondary">{label}</span>
              <span className="text-sm font-bold text-ink [font-variant-numeric:tabular-nums]">{formatCurrency(value)}</span>
            </div>
            <div aria-label={`${label}: ${formatCurrency(value)}`} className="h-2.5 overflow-hidden rounded-pill bg-brand-soft" role="progressbar" aria-valuemax={100} aria-valuemin={0} aria-valuenow={progress}>
              <div className={`h-full rounded-pill ${color}`} style={{ width: `${progress}%` }} />
            </div>
          </div>
        );
      })}
      <p className="text-xs text-ink-secondary">Comparación mensual; las dos barras usan la misma escala.</p>
    </div>
  );
}
