import { Alert } from "@/components/ui/alert";
import { PageHeader } from "@/components/ui/page-header";
import { getSystemUser, WRITE_ROLES } from "@/lib/auth/authorization";
import { obtenerSugerenciaInpc } from "@/lib/services/banxico";
import { listarIndicesInflacion } from "@/lib/services/inflation";

const cp154Url = "https://www.banxico.org.mx/SieInternet/consultarDirectorioInternetAction.do?sector=8&accion=consultarCuadro&idCuadro=CP154&locale=es";
const cp151Url = "https://www.banxico.org.mx/SieInternet/consultarDirectorioInternetAction.do?sector=8&accion=consultarCuadro&idCuadro=CP151&locale=es";
const monthNames = ["ENERO", "FEBRERO", "MARZO", "ABRIL", "MAYO", "JUNIO", "JULIO", "AGOSTO", "SEPTIEMBRE", "OCTUBRE", "NOVIEMBRE", "DICIEMBRE"];

function displayMonthlyPercent(value: number | undefined) {
  if (value === undefined) return "—";
  return new Intl.NumberFormat("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 4 }).format(value) + "%";
}

function displayMonth(value: string) {
  return new Intl.DateTimeFormat("es-MX", { month: "long", timeZone: "UTC" })
    .format(new Date(value + "-01T00:00:00.000Z"));
}

type InflationRecord = { mes: Date; valor: { toString(): string }; actualizadoEn: Date };

function yearSummary(monthlyRecords: InflationRecord[], annualRecords: InflationRecord[], year: number) {
  const monthly = new Map(
    monthlyRecords
      .filter((item) => item.mes.getUTCFullYear() === year)
      .map((item) => [item.mes.toISOString().slice(5, 7), Number(item.valor)]),
  );
  const annualRecord = annualRecords
    .filter((item) => item.mes.getUTCFullYear() === year)
    .sort((left, right) => left.mes.getTime() - right.mes.getTime())
    .at(-1);
  const annual = annualRecord
    ? { month: annualRecord.mes.toISOString().slice(0, 7), percent: Number(annualRecord.valor) }
    : null;
  return { year, monthly, annual };
}

function latestUpdate(records: InflationRecord[]) {
  return records.reduce<Date | null>((latest, item) => (
    !latest || item.actualizadoEn > latest ? item.actualizadoEn : latest
  ), null);
}

export default async function InflationPage({ searchParams }: { searchParams: Promise<{ desde?: string; hasta?: string; anio?: string; guardado?: string; error?: string; mes?: string; valor?: string; sincronizado?: string; syncError?: string }> }) {
  const query = await searchParams;
  const currentYear = new Date().getUTCFullYear();
  const earliestAvailableYear = Math.max(1969, currentYear - 9);
  const parseYear = (value: string | undefined) => {
    const year = Number(value);
    return Number.isInteger(year) && year >= earliestAvailableYear && year <= 2200 ? year : null;
  };
  const requestedEnd = parseYear(query.hasta ?? query.anio);
  const endYear = Math.max(earliestAvailableYear, Math.min(requestedEnd ?? currentYear, currentYear));
  const requestedStart = parseYear(query.desde);
  const startYear = Math.max(earliestAvailableYear, Math.min(requestedStart ?? Math.max(earliestAvailableYear, endYear - 4), endYear));
  const years = Array.from({ length: endYear - startYear + 1 }, (_, index) => startYear + index);
  const [{ user }, monthlyIndices, annualIndices, suggestion] = await Promise.all([
    getSystemUser(),
    listarIndicesInflacion("INFLACION_MENSUAL"),
    listarIndicesInflacion("INFLACION_ANUAL"),
    obtenerSugerenciaInpc(),
  ]);
  const canWrite = WRITE_ROLES.includes(user.rol as (typeof WRITE_ROLES)[number]);
  const selectedMonth = query.mes ?? new Date().toISOString().slice(0, 7);
  const summaries = years.map((year) => yearSummary(monthlyIndices, annualIndices, year));
  const rangeRecords = [...monthlyIndices, ...annualIndices].filter((item) => {
    const recordYear = item.mes.getUTCFullYear();
    return recordYear >= startYear && recordYear <= endYear;
  });
  const lastUpdate = latestUpdate(rangeRecords);
  const hasData = summaries.some((summary) => summary.monthly.size > 0 || summary.annual !== null);

  return <>
    <PageHeader description="Consulta y conserva la inflación oficial para respaldar los ajustes de renta." eyebrow="Ajustes anuales" title="Ajustes de renta" />
    {query.guardado ? <Alert className="mt-7" variant="success">Nivel INPC guardado correctamente.</Alert> : null}
    {query.error ? <Alert className="mt-7" variant="danger">{query.error}</Alert> : null}
    {query.sincronizado ? <Alert className="mt-7" variant="success">Sincronización terminada. Se actualizaron los datos publicados por Banxico de los últimos diez años.</Alert> : null}
    {query.syncError === "token" ? <Alert className="mt-7" variant="danger">Falta configurar BANXICO_SIE_TOKEN para consultar los datos oficiales.</Alert> : null}
    {query.syncError === "banxico" ? <Alert className="mt-7" variant="danger">Banxico no devolvió todos los datos. Intenta sincronizar de nuevo más tarde.</Alert> : null}
    {query.syncError && query.syncError !== "token" && query.syncError !== "banxico" ? <Alert className="mt-7" variant="danger">{query.syncError}</Alert> : null}

    <section className="mt-7 rounded-card border border-border bg-surface p-5 sm:p-6">
      <div className="flex flex-wrap items-end justify-between gap-5">
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-[.13em] text-brand">Fuente oficial · INPC general</p>
          <h2 className="mt-1 font-serif text-2xl font-semibold tracking-tight text-ink sm:text-3xl">Inflación mensual y anual</h2>
          <p className="mt-2 max-w-2xl text-sm text-ink-secondary">Consulta hasta diez años de variaciones oficiales de Banxico. La tabla se actualiza al sincronizar y conserva el histórico para comparar periodos.</p>
        </div>
        <div className="flex flex-wrap items-end gap-2">
          <form className="flex flex-wrap items-end gap-2">
            <label className="text-xs font-medium text-ink-secondary">
              Desde
              <input className="mt-1 block w-24 rounded border border-border bg-surface px-3 py-2 text-sm text-ink" defaultValue={startYear} max={currentYear} min={1969} name="desde" type="number" />
            </label>
            <label className="text-xs font-medium text-ink-secondary">
              Hasta
              <input className="mt-1 block w-24 rounded border border-border bg-surface px-3 py-2 text-sm text-ink" defaultValue={endYear} max={currentYear} min={1969} name="hasta" type="number" />
            </label>
            <button className="rounded border border-border bg-surface px-4 py-2 text-sm font-semibold text-ink hover:bg-bg">Consultar</button>
          </form>
          {canWrite ? <form action="/api/inflacion/sincronizar" method="post">
            <input name="desde" type="hidden" value={startYear} />
            <input name="hasta" type="hidden" value={endYear} />
            <button className="rounded bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-hover">Sincronizar ahora</button>
          </form> : null}
        </div>
      </div>

      {!hasData ? <p className="mt-5 rounded-xl bg-bg p-4 text-sm text-ink-secondary">Aún no hay datos guardados para este periodo. Usa “Sincronizar ahora”; la tarea automática también consulta Banxico diariamente.</p> : null}

      <div className="mt-5 overflow-x-auto rounded-xl border border-border">
        <table className="w-full min-w-[850px] text-left text-sm">
          <thead className="bg-bg text-xs font-semibold uppercase tracking-wide text-ink-secondary">
            <tr>
              <th className="sticky left-0 bg-bg px-4 py-3">Mes</th>
              {summaries.map((summary) => <th className="px-4 py-3 text-right" key={summary.year}>{summary.year}</th>)}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {monthNames.map((month, index) => {
              const monthNumber = String(index + 1).padStart(2, "0");
              return <tr key={month}>
                <th className="sticky left-0 bg-surface px-4 py-3 font-semibold text-ink">{month}</th>
                {summaries.map((summary) => <td className="px-4 py-3 text-right text-ink-secondary [font-variant-numeric:tabular-nums]" key={summary.year}>{displayMonthlyPercent(summary.monthly.get(monthNumber))}</td>)}
              </tr>;
            })}
          </tbody>
          <tfoot className="border-t-2 border-brand/20 bg-brand-soft/30">
            <tr>
              <th className="sticky left-0 bg-brand-soft px-4 py-3 font-semibold text-ink">Inflación anual oficial</th>
              {summaries.map((summary) => <td className="px-4 py-3 text-right font-semibold text-brand [font-variant-numeric:tabular-nums]" key={summary.year}>
                {summary.annual ? <>{displayMonthlyPercent(summary.annual.percent)}<span className="mt-1 block text-xs font-normal text-ink-secondary">a {displayMonth(summary.annual.month)}</span></> : "Pendiente"}
              </td>)}
            </tr>
          </tfoot>
        </table>
      </div>

      <div className="mt-4 grid gap-4 border-t border-border pt-4 text-sm sm:grid-cols-[minmax(0,1fr)_auto]">
        <div>
          <p className="font-semibold text-ink">Origen y verificación</p>
          <p className="mt-1 text-ink-secondary">Inflación mensual SP30577 y anual SP30578 del SIE de Banxico, cuadro CP151. El nivel INPC SP1 se consulta en el cuadro CP154.</p>
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
            <a className="font-semibold text-brand underline underline-offset-2" href={cp151Url} rel="noreferrer" target="_blank">Ver series mensual y anual en Banxico ↗</a>
            <a className="font-semibold text-brand underline underline-offset-2" href={cp154Url} rel="noreferrer" target="_blank">Ver niveles INPC en Banxico ↗</a>
          </div>
        </div>
        <p className="text-xs text-ink-secondary sm:text-right">
          {lastUpdate ? "Última sincronización guardada: " + new Intl.DateTimeFormat("es-MX", { dateStyle: "medium", timeZone: "UTC" }).format(lastUpdate) : "Sin registros sincronizados"}
        </p>
      </div>

      <details className="mt-5 border-t border-border pt-4" open={Boolean(query.valor)}>
        <summary className="cursor-pointer font-semibold text-brand">
          <span className="flex flex-wrap items-center justify-between gap-2">
            <span>Respaldo: capturar el nivel INPC manualmente</span>
            <span className="text-xs font-medium text-ink-secondary">Solo si falta o necesitas corregir un dato</span>
          </span>
        </summary>
        <div className="mt-4 rounded-xl bg-bg p-4">
          <p className="text-sm text-ink-secondary">La sincronización automática también guarda el nivel INPC para las renovaciones. Este formulario captura el nivel del índice, no el porcentaje de inflación mensual.</p>
          {suggestion ? <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-brand/20 bg-brand-soft/40 p-3">
            <p className="text-sm text-ink">Sugerencia: INPC de {suggestion.month}, nivel <span className="font-semibold">{suggestion.value}</span>.</p>
            <a className="rounded-lg border border-brand/30 bg-surface px-3 py-2 text-sm font-semibold text-brand hover:bg-bg" href={"/inflacion?desde=" + startYear + "&hasta=" + endYear + "&mes=" + suggestion.month + "&valor=" + suggestion.value}>Cargar sugerencia</a>
          </div> : null}
          {canWrite ? <form action="/api/inflacion/indices" className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4" method="post">
            <input name="indice" type="hidden" value="INPC" />
            <label className="text-xs font-medium text-ink-secondary">Mes<input className="mt-2 w-full rounded border border-border bg-surface px-3 py-2.5 text-sm text-ink" defaultValue={selectedMonth} name="mes" required type="month" /></label>
            <label className="text-xs font-medium text-ink-secondary">Nivel INPC<input className="mt-2 w-full rounded border border-border bg-surface px-3 py-2.5 text-sm text-ink" defaultValue={query.valor ?? ""} inputMode="decimal" name="valor" placeholder="140.78000000" required /></label>
            <label className="text-xs font-medium text-ink-secondary">Fecha de corte<input className="mt-2 w-full rounded border border-border bg-surface px-3 py-2.5 text-sm text-ink" defaultValue={selectedMonth + "-10"} name="fechaCorte" required type="date" /></label>
            <div className="flex items-end"><button className="w-full rounded bg-brand px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-hover" type="submit">Guardar nivel</button></div>
          </form> : null}
        </div>
      </details>
    </section>
  </>;
}
