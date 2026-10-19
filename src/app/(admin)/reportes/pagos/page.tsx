import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { PrintReportButton } from "@/components/reports/print-report-button";
import { formatCurrency, formatDate, formatReceiptPeriodRange } from "@/lib/format";
import { obtenerReportePagosMensual } from "@/lib/services/payment-reports";

function queryString(filters: Record<string, string>) {
  return new URLSearchParams(Object.entries(filters).filter(([, value]) => value)).toString();
}

export default async function MonthlyPaymentsReportPage({
  searchParams,
}: {
  searchParams: Promise<{ periodo?: string; cliente?: string; propiedad?: string; unidad?: string }>;
}) {
  const query = await searchParams;
  const report = await obtenerReportePagosMensual(query);
  const filters = { periodo: report.periodValue, ...report.filters };
  const downloadHref = `/api/reportes/pagos?${queryString(filters)}`;
  const groups = report.tenants;

  return <div id="printable-report">
    <PageHeader
      action={<div className="screen-only flex flex-wrap gap-2"><PrintReportButton /><a className="inline-flex min-h-11 items-center justify-center rounded-card bg-brand px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-brand-hover" href={downloadHref} rel="noreferrer" target="_blank">Descargar PDF</a></div>}
      description="Pagos recibidos en el mes seleccionado. El saldo refleja el estado actual de cada recibo. Reporte administrativo, no es CFDI ni comprobante fiscal."
      eyebrow="Análisis"
      title="Pagos recibidos"
    />

    <section aria-label="Filtros del reporte" className="screen-only mt-7 rounded-card border border-border bg-surface p-5">
      <form action="/reportes/pagos" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5" method="get">
        <label className="space-y-2 text-sm font-semibold text-ink">Mes de pago<input className="h-11 w-full rounded border border-border bg-surface px-3 text-sm font-normal text-ink" defaultValue={report.periodValue} name="periodo" required type="month" /></label>
        <label className="space-y-2 text-sm font-semibold text-ink">Cliente<input className="h-11 w-full rounded border border-border bg-surface px-3 text-sm font-normal text-ink" defaultValue={report.filters.cliente} maxLength={120} name="cliente" placeholder="Buscar cliente" type="search" /></label>
        <label className="space-y-2 text-sm font-semibold text-ink">Propiedad<select className="h-11 w-full rounded border border-border bg-surface px-3 text-sm font-normal text-ink" defaultValue={report.filters.propiedad} name="propiedad"><option value="">Todas</option>{report.properties.map((property) => <option key={property.id} value={property.id}>{property.direccion}</option>)}</select></label>
        <label className="space-y-2 text-sm font-semibold text-ink">Unidad<select className="h-11 w-full rounded border border-border bg-surface px-3 text-sm font-normal text-ink" defaultValue={report.filters.unidad} name="unidad"><option value="">Todas</option>{report.units.map((unit) => <option key={unit.id} value={unit.id}>{unit.propiedad.direccion} · {unit.identificador}</option>)}</select></label>
        <button className="min-h-11 self-end rounded-card bg-brand px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-brand-hover" type="submit">Aplicar filtros</button>
      </form>
    </section>

    <section aria-label="Resumen mensual" className="mt-6 grid gap-4 sm:grid-cols-2">
      <div className="rounded-card border border-border bg-surface p-5"><p className="text-xs font-medium text-ink-secondary">Total recibido</p><p className="mt-2 text-2xl font-bold tracking-tight text-brand [font-variant-numeric:tabular-nums]">{formatCurrency(report.totalReceived)}</p></div>
      <div className="rounded-card border border-border bg-surface p-5"><p className="text-xs font-medium text-ink-secondary">Pagos revertidos (excluidos del total)</p><p className="mt-2 text-2xl font-bold tracking-tight text-danger [font-variant-numeric:tabular-nums]">{formatCurrency(report.totalReversed)}</p></div>
    </section>

    {groups.length === 0 ? <div className="mt-7"><EmptyState title="Sin pagos en este periodo" description="No se encontraron movimientos con los filtros seleccionados." /></div> : <section aria-label="Detalle de pagos por cliente" className="mt-8 space-y-6">
      {groups.map((group) => <article className="overflow-hidden rounded-card border border-border bg-surface" key={group.tenant}>
        <header className="flex flex-wrap items-baseline justify-between gap-2 border-b border-border px-5 py-4"><h2 className="font-semibold text-ink">{group.tenant}</h2><p className="text-sm font-bold text-brand">Total recibido: {formatCurrency(group.total)}</p></header>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[950px] text-left text-sm">
            <thead className="border-b border-border bg-bg text-xs font-semibold uppercase tracking-wide text-ink-secondary"><tr><th className="px-4 py-3">Fecha</th><th className="px-4 py-3">Inmueble / unidad</th><th className="px-4 py-3">Periodo cubierto</th><th className="px-4 py-3">Forma / referencia</th><th className="px-4 py-3 text-right">Pago</th><th className="px-4 py-3 text-right">Saldo actual</th></tr></thead>
            <tbody className="divide-y divide-border">{group.payments.map((payment) => <tr className={payment.reversedAt ? "text-danger" : "text-ink"} key={payment.id}>
              <td className={payment.reversedAt ? "px-4 py-3 line-through" : "px-4 py-3"}>{formatDate(payment.paymentDate)}{payment.reversedAt ? <span className="ml-1 font-semibold no-underline">· Revertido</span> : null}</td>
              <td className="px-4 py-3">{payment.property} · {payment.unit}</td>
              <td className="px-4 py-3">{formatReceiptPeriodRange(payment.period, payment.periodEnd)}</td>
              <td className="px-4 py-3">{payment.method === "EFECTIVO" ? "Efectivo" : "Transferencia"}{payment.reference ? ` · ${payment.reference}` : ""}</td>
              <td className="px-4 py-3 text-right font-semibold [font-variant-numeric:tabular-nums]">{formatCurrency(payment.amount)}</td>
              <td className="px-4 py-3 text-right [font-variant-numeric:tabular-nums]">{payment.showBalance ? formatCurrency(payment.currentBalance) : ""}</td>
            </tr>)}</tbody>
          </table>
        </div>
      </article>)}
    </section>}
  </div>;
}
