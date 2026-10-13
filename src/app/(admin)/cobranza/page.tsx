import { EstadoRecibo } from "@/generated/prisma/enums";
import Link from "next/link";
import { ReceiptMobileCard } from "@/components/collection/receipt-mobile-card";
import { receiptStatusLabels } from "@/components/collection/receipt-badge";
import { ReceiptTable } from "@/components/collection/receipt-table";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Field, Input } from "@/components/ui/form-controls";
import { PageHeader } from "@/components/ui/page-header";
import { getSystemUser, WRITE_ROLES } from "@/lib/auth/authorization";
import {
  currentCollectionDate,
  currentReceiptPeriod,
  receiptPeriodFromValue,
  receiptPeriodValue,
} from "@/lib/calculations/collection";
import { formatCurrency, formatPercent, toDateInput } from "@/lib/format";
import { listarCobranzaMensual } from "@/lib/services/collection";
import {
  receiptPeriodSchema,
  receiptStatusFilterSchema,
} from "@/lib/validation/collection";

const RECEIPTS_PER_PAGE = 20;

export default async function CollectionPage({
  searchParams,
}: {
  searchParams: Promise<{
    actualizados?: string;
    error?: string;
    estatus?: string;
    generados?: string;
    notificado?: string;
    pago?: string;
    buscar?: string;
    pagina?: string;
    periodo?: string;
  }>;
}) {
  const [query, { user }] = await Promise.all([searchParams, getSystemUser()]);
  const parsedPeriod = receiptPeriodSchema.safeParse(query.periodo);
  const period = parsedPeriod.success
    ? receiptPeriodFromValue(parsedPeriod.data)
    : currentReceiptPeriod();
  const periodValue = receiptPeriodValue(period);
  const parsedStatus = receiptStatusFilterSchema.safeParse(query.estatus);
  const status = parsedStatus.success ? parsedStatus.data : undefined;
  const search = query.buscar?.trim().slice(0, 100) || undefined;
  const requestedPage = Number(query.pagina);
  const page = Number.isSafeInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1;
  const { receipts, summary, counts, pagination } = await listarCobranzaMensual({ period, status, search, pagination: { pagina: page, limite: RECEIPTS_PER_PAGE } });
  const canWrite = WRITE_ROLES.includes(
    user.rol as (typeof WRITE_ROLES)[number],
  );
  const paymentDate = toDateInput(currentCollectionDate());
  const metrics = [
    ["Monto esperado", formatCurrency(summary.esperado), "text-brand"],
    ["Monto cobrado", formatCurrency(summary.cobrado), "text-brand"],
    ["Porcentaje cobrado", formatPercent(summary.porcentajeCobrado), "text-brand"],
    ["Recibos vencidos", String(summary.recibosVencidos), "text-danger"],
    ["Tasa de morosidad", formatPercent(summary.tasaMorosidad), "text-danger"],
  ] as const;
  const statusFilters = [
    { label: "Todos", value: undefined, count: counts?.todos ?? 0 },
    { label: "Por cobrar", value: EstadoRecibo.PENDIENTE, count: counts?.pendientes ?? 0 },
    { label: "Vencidos", value: EstadoRecibo.VENCIDO, count: counts?.vencidos ?? 0 },
    { label: "Pagados", value: EstadoRecibo.PAGADO, count: counts?.pagados ?? 0 },
  ] as const;
  const defaultPeriodValue = receiptPeriodValue(currentReceiptPeriod());
  const collectionUrl = (nextStatus?: EstadoRecibo, nextPage = 1, nextSearch: string | null | undefined = search, nextPeriod = periodValue) => {
    const params = new URLSearchParams({ periodo: nextPeriod });
    if (nextStatus) params.set("estatus", nextStatus);
    if (nextSearch) params.set("buscar", nextSearch);
    if (nextPage > 1) params.set("pagina", String(nextPage));
    return `/cobranza?${params.toString()}`;
  };
  const hasFilters = Boolean(search || status || periodValue !== defaultPeriodValue);
  const firstReceipt = pagination && pagination.total > 0 ? (pagination.pagina - 1) * RECEIPTS_PER_PAGE + 1 : 0;
  const lastReceipt = Math.min((pagination?.pagina ?? 1) * RECEIPTS_PER_PAGE, pagination?.total ?? 0);
  const firstVisiblePage = Math.max(1, Math.min((pagination?.pagina ?? 1) - 2, (pagination?.paginas ?? 1) - 4));
  const visiblePages = Array.from({ length: Math.min(pagination?.paginas ?? 1, 5) }, (_, index) => firstVisiblePage + index);

  return (
    <>
      <PageHeader
        action={
          canWrite ? (
            <form action="/api/cobranza/generar" method="post">
              <Button type="submit">Generar/actualizar cobranza</Button>
            </form>
          ) : null
        }
        description="Seguimiento mensual de recibos, pagos y morosidad."
        eyebrow="Operación"
        title="Cobranza"
      />

      {query.error ? <Alert className="mt-6" variant="danger">{query.error}</Alert> : null}
      {query.generados !== undefined ? (
        <Alert className="mt-6" variant="success">
          Proceso completado: {query.generados} recibos creados y{" "}
          {query.actualizados ?? "0"} vencimientos actualizados.
        </Alert>
      ) : null}
      {query.pago ? (
        <Alert className="mt-6" variant="success">
          {query.pago === "registrado"
            ? "Pago registrado correctamente."
            : "El movimiento fue revertido y el saldo se recalculó."}
        </Alert>
      ) : null}
      {query.notificado ? (
        <Alert className="mt-6" variant="success">
          Recordatorio enviado correctamente.
        </Alert>
      ) : null}

      <section aria-label="Resumen del periodo" className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {metrics.map(([label, display, color]) => (
          <div className="rounded-card border border-border bg-surface p-5" key={label}>
            <p className="text-xs font-medium text-ink-secondary">{label}</p>
            <p className={`mt-2 text-2xl font-bold tracking-tight [font-variant-numeric:tabular-nums] ${color}`}>
              {display}
            </p>
          </div>
        ))}
      </section>

      <section className="mt-7 rounded-card border border-border bg-surface p-5">
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
          <div>
            <p className="text-sm font-semibold text-ink">Explora los pagos del periodo</p>
            <p className="mt-1 text-sm text-ink-secondary">Empieza por los vencidos y registra un pago directamente desde cada recibo.</p>
            <nav aria-label="Filtrar recibos por estatus" className="mt-4 flex flex-wrap gap-2">
              {statusFilters.map((filter) => {
                const selected = (filter.value ?? undefined) === status;
                return <Link aria-current={selected ? "page" : undefined} className={`inline-flex items-center gap-2 rounded-pill px-3 py-1.5 text-sm font-semibold transition-colors ${selected ? "bg-brand text-white" : "bg-bg text-ink-secondary hover:bg-brand-soft hover:text-brand"}`} href={collectionUrl(filter.value)} key={filter.label}>{filter.label}<span className={selected ? "rounded-pill bg-white/20 px-2 py-0.5 text-xs" : "rounded-pill bg-surface px-2 py-0.5 text-xs"}>{filter.count}</span></Link>;
              })}
            </nav>
          </div>
          <form action="/cobranza" className="flex flex-col gap-3 sm:flex-row sm:items-end" method="get">
            {status ? <input name="estatus" type="hidden" value={status} /> : null}
            <Field label="Buscar recibo">
              <div className="relative">
                <svg aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-brand" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="6"/><path d="m16 16 4 4"/></svg>
                <Input className="h-11 pl-9" defaultValue={search} maxLength={100} name="buscar" placeholder="Inquilino, dirección o unidad" type="search" />
              </div>
            </Field>
            <Field label="Periodo">
              <Input defaultValue={periodValue} name="periodo" type="month" />
            </Field>
            <div className="flex items-end gap-2">
              <Button className="sm:self-end" type="submit" variant="secondary">Aplicar</Button>
              {hasFilters ? <Link className="inline-flex h-11 items-center justify-center rounded border border-border bg-surface px-3 text-sm font-semibold text-ink hover:bg-bg" href="/cobranza">Limpiar</Link> : null}
            </div>
          </form>
        </div>
        {search || periodValue !== defaultPeriodValue ? <nav aria-label="Filtros activos" className="mt-4 flex flex-wrap items-center gap-2 border-t border-border pt-4">
          <span className="text-xs font-semibold text-ink-secondary">Activos:</span>
          {search ? <Link aria-label={`Quitar búsqueda: ${search}`} className="rounded-pill bg-brand-soft px-3 py-1.5 text-xs font-semibold text-brand" href={collectionUrl(status, 1, null)}>Búsqueda: {search} <span aria-hidden="true">×</span></Link> : null}
          {periodValue !== defaultPeriodValue ? <Link aria-label="Quitar filtro de periodo" className="rounded-pill bg-brand-soft px-3 py-1.5 text-xs font-semibold text-brand" href={collectionUrl(status, 1, search, defaultPeriodValue)}>Periodo: {periodValue} <span aria-hidden="true">×</span></Link> : null}
        </nav> : null}
      </section>

      <section className="mt-7">
        <div className="mb-4 flex items-baseline justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold tracking-tight text-ink">{status ? receiptStatusLabels[status] : "Todos los recibos"}</h2>
            <p className="mt-1 text-sm text-ink-secondary">{pagination?.total ?? receipts.length} {(pagination?.total ?? receipts.length) === 1 ? "recibo" : "recibos"} en esta vista</p>
          </div>
          {status ? <Link className="text-sm font-semibold text-brand hover:text-brand-hover" href={collectionUrl()}>Ver todos</Link> : null}
        </div>
        {receipts.length === 0 ? (
          <EmptyState
            description="No hay recibos que coincidan con el periodo y estatus seleccionados."
            title="Sin recibos"
          />
        ) : (
          <>
            <div className="space-y-4 lg:hidden">
              {receipts.map((receipt) => (
                <ReceiptMobileCard
                  canWrite={canWrite}
                  key={receipt.id}
                  paymentDate={paymentDate}
                  periodValue={periodValue}
                  receipt={receipt}
                />
              ))}
            </div>
            <ReceiptTable
              canWrite={canWrite}
              paymentDate={paymentDate}
              periodValue={periodValue}
              receipts={receipts}
            />
          </>
        )}
        {pagination && pagination.paginas > 1 ? <>
          <p className="mt-5 text-center text-sm text-ink-secondary">Mostrando <span className="font-semibold text-ink">{firstReceipt}–{lastReceipt}</span> de <span className="font-semibold text-ink">{pagination.total}</span> recibos</p>
          <nav aria-label="Paginación de cobranza" className="mt-3 flex flex-wrap items-center justify-center gap-2">
            <Link aria-disabled={pagination.pagina === 1} className={`rounded border border-border px-3 py-2 text-sm font-semibold ${pagination.pagina === 1 ? "pointer-events-none text-ink-secondary/50" : "text-ink hover:bg-bg"}`} href={collectionUrl(status, pagination.pagina - 1)} tabIndex={pagination.pagina === 1 ? -1 : undefined}>Anterior</Link>
            {visiblePages.map((pageNumber) => pageNumber === pagination.pagina
              ? <span aria-current="page" className="rounded bg-brand px-3 py-2 text-sm font-semibold text-white" key={pageNumber}>{pageNumber}</span>
              : <Link className="rounded border border-border px-3 py-2 text-sm font-semibold text-ink hover:bg-bg" href={collectionUrl(status, pageNumber)} key={pageNumber}>{pageNumber}</Link>)}
            <Link aria-disabled={pagination.pagina === pagination.paginas} className={`rounded border border-border px-3 py-2 text-sm font-semibold ${pagination.pagina === pagination.paginas ? "pointer-events-none text-ink-secondary/50" : "text-ink hover:bg-bg"}`} href={collectionUrl(status, pagination.pagina + 1)} tabIndex={pagination.pagina === pagination.paginas ? -1 : undefined}>Siguiente</Link>
          </nav>
        </> : null}
      </section>
    </>
  );
}
