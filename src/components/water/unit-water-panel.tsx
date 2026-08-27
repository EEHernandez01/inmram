import { currentReceiptPeriod, receiptPeriodValue } from "@/lib/calculations/collection";

type WaterReading = {
  id: string;
  periodo: Date;
  lecturaAnterior: { toString(): string };
  lecturaActual: { toString(): string };
  metrosCubicosConsumidos: { toString(): string };
};

type WaterMeter = {
  id: string;
  lecturas: WaterReading[];
};

export function UnitWaterPanel({
  canWrite,
  meter,
  returnTo,
  unitId,
}: {
  canWrite: boolean;
  meter: WaterMeter | null;
  returnTo: string;
  unitId: string;
}) {
  const latest = meter?.lecturas[0];
  const period = receiptPeriodValue(currentReceiptPeriod());

  return (
    <section className="mt-8 rounded-3xl bg-bg p-6 shadow-[7px_7px_15px_#c6cdd6,-7px_-7px_15px_#fff]">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[.13em] text-brand/70">Servicios incluidos</p>
          <h2 className="mt-1 font-serif text-2xl font-semibold text-ink">Consumo de agua</h2>
          <p className="mt-2 text-sm text-ink-secondary">Control interno de consumo. El agua está incluida en los servicios mensuales y no modifica el recibo.</p>
        </div>
        <span className={meter ? "rounded-full bg-brand-soft px-3 py-1.5 text-xs font-bold text-brand" : "rounded-full bg-bg px-3 py-1.5 text-xs font-bold text-ink-secondary"}>{meter ? "Medidor activo" : "Sin medidor"}</span>
      </div>

      {!meter ? <div className="mt-5 rounded-2xl border border-dashed border-brand/25 p-4"><p className="text-sm text-ink-secondary">Esta unidad aún no tiene un medidor configurado.</p>{canWrite ? <form action="/api/agua/medidores" className="mt-4" method="post"><input name="unidadId" type="hidden" value={unitId} /><input name="returnTo" type="hidden" value={returnTo} /><button className="rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-hover" type="submit">Configurar medidor</button></form> : null}</div> : <>
        {canWrite ? <form action="/api/agua/lecturas" className="mt-6 grid gap-4 border-t border-brand/10 pt-5 sm:grid-cols-4" method="post"><input name="medidorAguaId" type="hidden" value={meter.id} /><input name="returnTo" type="hidden" value={returnTo} /><label className="text-xs font-medium text-ink-secondary">Periodo<input className="mt-2 w-full rounded border border-border bg-surface px-3 py-2.5 text-sm text-ink" defaultValue={period} name="periodo" required type="month" /></label>{!latest ? <label className="text-xs font-medium text-ink-secondary">Lectura anterior inicial<input className="mt-2 w-full rounded border border-border bg-surface px-3 py-2.5 text-sm text-ink" min="0" name="lecturaAnterior" required step="0.001" type="number" /></label> : <div><p className="text-xs font-medium text-ink-secondary">Lectura anterior automática</p><p className="mt-3 text-sm font-semibold text-ink [font-variant-numeric:tabular-nums]">{latest.lecturaActual.toString()}</p></div>}<label className="text-xs font-medium text-ink-secondary">Lectura actual<input className="mt-2 w-full rounded border border-border bg-surface px-3 py-2.5 text-sm text-ink" min="0" name="lecturaActual" required step="0.001" type="number" /></label><div className="flex items-end"><button className="w-full rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-hover" type="submit">Registrar lectura</button></div></form> : null}
        {meter.lecturas.length ? <div className="mt-6 overflow-x-auto"><table className="w-full min-w-[620px] text-left text-sm"><thead className="border-b border-brand/10 text-xs font-semibold uppercase tracking-wide text-ink-secondary"><tr><th className="py-3">Periodo</th><th className="py-3 text-right">Anterior</th><th className="py-3 text-right">Actual</th><th className="py-3 text-right">Consumo m³</th></tr></thead><tbody className="divide-y divide-brand/10">{meter.lecturas.map((reading) => <tr key={reading.id}><td className="py-3 font-semibold text-ink">{reading.periodo.toISOString().slice(0, 7)}</td><td className="py-3 text-right text-ink-secondary [font-variant-numeric:tabular-nums]">{reading.lecturaAnterior.toString()}</td><td className="py-3 text-right text-ink-secondary [font-variant-numeric:tabular-nums]">{reading.lecturaActual.toString()}</td><td className="py-3 text-right font-semibold text-ink [font-variant-numeric:tabular-nums]">{reading.metrosCubicosConsumidos.toString()}</td></tr>)}</tbody></table></div> : <p className="mt-6 rounded-xl bg-surface p-4 text-sm text-ink-secondary">Aún no hay lecturas registradas para este medidor.</p>}
      </>}
    </section>
  );
}
