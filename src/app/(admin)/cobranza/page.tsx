import { EstadoRecibo } from "@/generated/prisma/enums";
import Link from "next/link";
import { ReceiptMobileCard } from "@/components/collection/receipt-mobile-card";
import { receiptStatusLabels } from "@/components/collection/receipt-badge";
import { ReceiptTable } from "@/components/collection/receipt-table";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Field, Input, Select } from "@/components/ui/form-controls";
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
  const { receipts, summary } = await listarCobranzaMensual({ period, status });
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
    { label: "Todos", value: undefined },
    { label: "Por cobrar", value: EstadoRecibo.PENDIENTE },
    { label: "Vencidos", value: EstadoRecibo.VENCIDO },
    { label: "Pagados", value: EstadoRecibo.PAGADO },
  ] as const;
  const collectionUrl = (nextStatus?: EstadoRecibo) => {
    const params = new URLSearchParams({ periodo: periodValue });
    if (nextStatus) params.set("estatus", nextStatus);
    return `/cobranza?${params.toString()}`;
  };

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
            : "El pago fue corregido y el recibo se recalculó."}
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
            <nav aria-label="Filtrar cobranza por estatus" className="mt-4 flex flex-wrap gap-2">
              {statusFilters.map((filter) => {
                const selected = (filter.value ?? undefined) === status;
                return <Link className={`rounded-pill px-3 py-1.5 text-sm font-semibold transition-colors ${selected ? "bg-brand text-white" : "bg-bg text-ink-secondary hover:bg-brand-soft hover:text-brand"}`} href={collectionUrl(filter.value)} key={filter.label}>{filter.label}</Link>;
              })}
            </nav>
          </div>
          <form className="flex flex-col gap-3 sm:flex-row sm:items-end" method="get">
          <Field label="Periodo">
            <Input defaultValue={periodValue} name="periodo" type="month" />
          </Field>
          <Field label="Estatus">
            <Select defaultValue={status ?? ""} name="estatus">
              <option value="">Todos</option>
              {Object.values(EstadoRecibo).map((value) => (
                <option key={value} value={value}>
                  {receiptStatusLabels[value]}
                </option>
              ))}
            </Select>
          </Field>
          <Button className="sm:self-end" type="submit" variant="secondary">
            Aplicar filtros
          </Button>
          </form>
        </div>
      </section>

      <section className="mt-7">
        <div className="mb-4 flex items-baseline justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold tracking-tight text-ink">{status ? receiptStatusLabels[status] : "Todos los recibos"}</h2>
            <p className="mt-1 text-sm text-ink-secondary">{receipts.length} {receipts.length === 1 ? "recibo" : "recibos"} en esta vista</p>
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
      </section>
    </>
  );
}
